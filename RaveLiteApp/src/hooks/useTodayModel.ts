import {useCallback, useEffect, useMemo, useState} from 'react';

import {
  activityForDay,
  activityInRange,
  subscribeActivity,
  type ActivityItem,
} from '../domain/activity/activity';
import {
  hydrationGlasses,
  pointsByElement,
  pointsByElementByDay,
  streakDays,
  windowStart,
} from '../domain/activity/stats';
import {activeMinutes, outdoorMinutes} from '../domain/activity/active';
import {isHarmony} from '../domain/activity/par';
import {WATER_TARGET} from '../components/today/WaterCounter';
import {formatTemp} from '../domain/conditions/format';
import {drinkTarget} from '../domain/conditions/heatWater';
import {
  drillForPlanChime,
  getWeatherPrefs,
  hottestFeelsToday,
  hottestToday,
  planWithWeather,
  subscribeWeather,
  weatherLine,
  type WeatherLine,
} from '../domain/conditions/weather';
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
import {partsOf} from '../domain/info/info';
import {moveForExercise, moveForTrack} from '../domain/exercises/moves';
import {entriesForDay, handledPulseIds} from '../domain/journal/journal';
import {dailyPar} from '../domain/profile/repository';
import {doneByTrack} from '../domain/program/progress';
import {focusFor, subscribeProgram} from '../domain/program/repository';
import {movesOf} from '../domain/program/rounds';
import {summarizeSets, type SetsSummary} from '../domain/program/setsSummary';
import type {SetFire} from '../domain/program/types';
import type {DayFocus} from '../domain/program/week';
import {expandPlanToFires, planPulseId} from '../domain/reminders/expandPlan';
import {loadPlan, subscribePlan} from '../domain/reminders/repository';
import {
  buildDayList,
  type DayRow,
  type ScheduledChime,
} from '../domain/today/dayList';
import {localDayKey} from '../domain/training/grading';
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
  /** Effort points per element today. */
  points: Record<ElementId, number>;
  /** Every element reached par today. */
  harmony: boolean;
  glasses: number;
  /** Glasses to aim for today: more on hot days. */
  waterTarget: number;
  /** Why the target is above the usual eight, when it is. */
  waterReason?: string;
  /** The sun and the weather now; undefined until a place is set. */
  weather?: WeatherLine;
  sets: SetsSummary;
  /** Today's focus attributes, morning block and any Saturday test. */
  focus: DayFocus;
  /** Minutes of movement today, toward 150 (see `activity/active.ts`). */
  activeMinutes: number;
  /** Per element, effort points for each of the last 7 days (today last). */
  week: Record<ElementId, number[]>;
  /** Days in a row, ending today, with anything done. */
  streak: number;
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
    move: moveForTrack(movesOf(rx)[0]?.trackId),
    exerciseId: fire.exerciseId,
    parts: partsOf(rx, fire.element),
  };
}

/**
 * Why the Drink target grew, when it has. With air conditioning it only
 * grows for time actually spent outside, so a hot day at the desk asks
 * for the usual eight.
 */
function heatReason(
  now: number,
  activity: readonly ActivityItem[],
): string | undefined {
  const heat = hottestToday(now);
  if (heat === 'none') {
    return undefined;
  }
  const prefs = getWeatherPrefs();
  const outside = outdoorMinutes(activity);
  const extra =
    drinkTarget(WATER_TARGET, heat, {
      airConditioned: prefs.airConditioned,
      outdoorMinutes: outside,
    }) - WATER_TARGET;
  if (extra === 0) {
    return undefined;
  }
  const feels = hottestFeelsToday(now);
  const hot = feels === undefined ? 'the heat' : formatTemp(feels, prefs.units);
  return prefs.airConditioned
    ? `+${extra} · ${outside} min out in ${hot}`
    : `+${extra} · feels ${hot} today`;
}

/** Everything Today shows, read from storage and the chime runtime. */
export function buildTodayModel(
  now: number,
): Omit<TodayModel, 'week' | 'streak'> {
  const date = new Date(now);
  const journal = entriesForDay(date);
  const activity = activityForDay(date);
  const plan = planWithWeather(loadPlan(), now);
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
    const {drill, note, detail} = drillForPlanChime(slot, id, fire.ts, window);
    planChimes.push({
      id,
      ts: fire.ts,
      element: drill?.element ?? fire.element,
      label: drill?.name ?? ELEMENTS[fire.element].name,
      detail: note ?? detail ?? window?.label,
      move: moveForExercise(drill?.id),
      exerciseId: drill?.id,
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
        move:
          scheduled.find(c => c.id === summary.pulseId)?.move ??
          moveForExercise(summary.drillId),
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
  const points = pointsByElement(activity);
  const pauseUntil = readPauseUntil();
  return {
    now,
    myDay,
    pauseUntil:
      pauseUntil !== undefined && pauseUntil > now ? pauseUntil : undefined,
    active: summary,
    next: rows.find(r => r.status === 'upcoming'),
    rows,
    points,
    harmony: isHarmony(points, dailyPar()),
    glasses: hydrationGlasses(activity),
    waterTarget: drinkTarget(WATER_TARGET, hottestToday(now), {
      airConditioned: getWeatherPrefs().airConditioned,
      outdoorMinutes: outdoorMinutes(activity),
    }),
    waterReason: heatReason(now, activity),
    weather: weatherLine(now),
    sets: summarizeSets(sets.prescriptions, done),
    focus: focusFor(date),
    activeMinutes: activeMinutes(activity),
  };
}

/** The week's dots and the streak: they only change with activity or the date. */
export function buildTodayHistory(
  now: number,
): Pick<TodayModel, 'week' | 'streak'> {
  const date = new Date(now);
  const week = pointsByElementByDay(
    activityInRange(windowStart(7, date), date),
    7,
    date,
  );
  return {week, streak: streakDays(date)};
}

/**
 * Today's model, kept live: rebuilt whenever the chime runtime, activity,
 * program, plan or My day changes (and every 30 s), with a one-second
 * clock only while a chime is sounding.
 */
export function useTodayModel(): TodayModel {
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [activityVersion, setActivityVersion] = useState(0);
  const refresh = useCallback(() => {
    setVersion(v => v + 1);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const unsubscribes = [
      subscribeRuntime(refresh),
      subscribeActivity(() => {
        setActivityVersion(v => v + 1);
        refresh();
      }),
      subscribeProgram(refresh),
      subscribePlan(refresh),
      subscribeActiveHours(refresh),
      subscribeWeather(refresh),
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
  // The streak walks back day by day, so it is kept off the 30 s refresh.
  const day = localDayKey(now);
  const history = useMemo(
    () => buildTodayHistory(Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activityVersion, day],
  );

  const sounding = model.active !== undefined;
  useEffect(() => {
    if (!sounding) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sounding]);

  return {...model, ...history, now};
}
