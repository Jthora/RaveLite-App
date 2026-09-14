import {useCallback, useEffect, useMemo, useState} from 'react';

import type {SetsSummary} from '../components/today/SetsSummaryLine';
import {activityForDay, subscribeActivity} from '../domain/activity/activity';
import {countsByElement, hydrationGlasses} from '../domain/activity/stats';
import {
  getActiveHours,
  readPauseUntil,
  subscribeActiveHours,
  withinActiveHours,
} from '../domain/ambient/activeHours';
import {
  getActivePulseSummary,
  queuedPulses,
  subscribe as subscribeRuntime,
} from '../domain/ambient/pulseRuntime';
import {setsToday} from '../domain/ambient/setScheduler';
import type {ActiveHours, ActivePulseSummary} from '../domain/ambient/types';
import {entriesForDay, handledPulseIds} from '../domain/journal/journal';
import {doneByTrack} from '../domain/program/progress';
import {subscribeProgram} from '../domain/program/repository';
import {movesOf} from '../domain/program/rounds';
import {TRACKS} from '../domain/program/tracks';
import type {SetFire} from '../domain/program/types';
import {expandPlanToFires, planPulseId} from '../domain/reminders/expandPlan';
import {loadPlan, subscribePlan} from '../domain/reminders/repository';
import {pickDrillForSlotSeeded} from '../domain/reminders/scheduler';
import {
  buildDayList,
  type DayRow,
  type ScheduledChime,
} from '../domain/today/dayList';
import {ELEMENTS, type ElementId} from '../theme/elements';

export interface TodayModel {
  now: number;
  myDay: ActiveHours;
  /** Set while chimes are paused. */
  pauseUntil?: number;
  /** The chime sounding right now. */
  active?: ActivePulseSummary;
  /** The next upcoming chime. */
  next?: DayRow;
  rows: DayRow[];
  counts: Record<ElementId, number>;
  glasses: number;
  sets: SetsSummary;
}

/** How often the day is re-read when nothing has changed. */
const DATA_REFRESH_MS = 30_000;

function roundChime(fire: SetFire): ScheduledChime {
  const rx = fire.prescription;
  const extras = [
    rx.roundIndex && rx.rounds ? `Round ${rx.roundIndex} of ${rx.rounds}` : '',
    rx.partner ? `then ${rx.partner.label}` : '',
    rx.water ? '+ glass' : '',
  ].filter(Boolean);
  return {
    id: fire.id,
    ts: fire.ts,
    element: fire.element,
    label: movesOf(rx)
      .map(m => m.label)
      .join(' + '),
    detail: extras.join(' · ') || undefined,
  };
}

/** Everything Today shows, read from storage and the chime runtime. */
export function buildTodayModel(now: number): TodayModel {
  const date = new Date(now);
  const journal = entriesForDay(date);
  const activity = activityForDay(date);
  const plan = loadPlan();
  const myDay = getActiveHours();
  const sets = setsToday(now);
  const handled = handledPulseIds(journal);
  const riding = new Set(sets.absorbedPlanIds);

  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const planChimes: ScheduledChime[] = [];
  for (const fire of expandPlanToFires(
    plan,
    midnight.getTime(),
    midnight.getTime() + 86_399_999,
  )) {
    const id = planPulseId(fire);
    if (riding.has(id) || !withinActiveHours(new Date(fire.ts), myDay)) {
      continue;
    }
    const window = plan.windows.find(w => w.id === fire.windowId);
    const slot = window?.slots[fire.slotIndex];
    const drill = slot ? pickDrillForSlotSeeded(slot, id) : undefined;
    planChimes.push({
      id,
      ts: fire.ts,
      element: fire.element,
      label: drill?.name ?? ELEMENTS[fire.element].name,
      detail: window?.label,
    });
  }
  const rounds = [
    ...sets.fires.filter(f => handled.has(f.id)),
    ...sets.upcoming,
  ].map(roundChime);
  const scheduled = [...planChimes, ...rounds];

  const summary = getActivePulseSummary();
  const active = summary
    ? {
        id: summary.pulseId,
        ts: summary.fireAt,
        element: summary.element,
        label:
          scheduled.find(c => c.id === summary.pulseId)?.label ??
          summary.drillName,
      }
    : undefined;
  const rows = buildDayList({
    now,
    activity,
    journal,
    scheduled,
    active,
    queuedAt: new Map(queuedPulses().map(p => [p.id, p.fireAt])),
  });

  const done = doneByTrack(journal);
  const pauseUntil = readPauseUntil();
  return {
    now,
    myDay,
    pauseUntil:
      pauseUntil !== undefined && pauseUntil > now ? pauseUntil : undefined,
    active: summary,
    next: rows.find(r => r.status === 'upcoming'),
    rows,
    counts: countsByElement(activity),
    glasses: hydrationGlasses(activity),
    sets: {
      done: sets.prescriptions.reduce(
        (sum, p) => sum + Math.min(p.sets, done[p.trackId]?.sets ?? 0),
        0,
      ),
      total: sets.prescriptions.reduce((sum, p) => sum + p.sets, 0),
      tracks: sets.prescriptions.map(p => {
        const total = p.setSize * p.sets;
        return {
          trackId: p.trackId,
          name: TRACKS.find(tr => tr.id === p.trackId)?.name ?? p.label,
          done: Math.min(total, done[p.trackId]?.amount ?? 0),
          total,
        };
      }),
    },
  };
}

/**
 * Today's model, kept live: rebuilt whenever the chime runtime, activity,
 * program, plan or My day changes (and every 30 s), with a one-second
 * clock only while a chime is sounding.
 */
export function useTodayModel(): TodayModel {
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const refresh = useCallback(() => {
    setVersion(v => v + 1);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const unsubscribes = [
      subscribeRuntime(refresh),
      subscribeActivity(refresh),
      subscribeProgram(refresh),
      subscribePlan(refresh),
      subscribeActiveHours(refresh),
    ];
    const timer = setInterval(refresh, DATA_REFRESH_MS);
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      clearInterval(timer);
    };
  }, [refresh]);

  // `version` is the rebuild trigger; the build reads storage directly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const model = useMemo(() => buildTodayModel(Date.now()), [version]);

  const sounding = model.active !== undefined;
  useEffect(() => {
    if (!sounding) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sounding]);

  return {...model, now};
}
