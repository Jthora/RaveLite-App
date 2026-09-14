/**
 * Daily Sets scheduler — turns today's program into round chimes inside
 * the pulse runtime, alongside the plan scheduler.
 *
 * Every minute (and whenever the program, plan, or a set is logged):
 *   1. Prescribe today's sets, group them into rounds and spread the
 *      rounds across the set window, keeping clear of the plan's chimes.
 *   2. Compare against today's journal: sets already done (from a chime,
 *      a notification button, a drill tap, or a manual "+ set") trim the
 *      upcoming rounds.
 *   3. Enqueue needed rounds not yet enqueued, re-queue a waiting round
 *      whose moves changed, and cancel rounds no longer needed.
 */
import {entriesForDay, subscribeJournal} from '../journal/journal';
import {expandPlanToFires} from '../reminders/expandPlan';
import {loadPlan, subscribePlan} from '../reminders/repository';
import {doneByTrack, firedSetIds} from '../program/progress';
import {
  loadProgram,
  prescriptionsFor,
  subscribeProgram,
} from '../program/repository';
import {groupIntoRounds} from '../program/rounds';
import {placeRounds, selectUpcomingRounds} from '../program/schedule';
import {
  SETS_WINDOW_ID,
  type DayPrescription,
  type SetFire,
  type SetPrescription,
} from '../program/types';
import {localDayKey} from '../training/grading';
import {
  cancelQueued,
  enqueue,
  hasPulse,
  queuedPulseIds,
  queuedPulses,
} from './pulseRuntime';

/** Rounds up to a minute late still get enqueued (reconcile granularity). */
export const SET_GRACE_MS = 60_000;
export const SET_RECONCILE_MS = 60_000;

export interface SetsToday {
  prescriptions: DayPrescription[];
  /** The full roster, including rounds already fired or no longer needed. */
  fires: SetFire[];
  /** Upcoming rounds still needed. */
  upcoming: SetFire[];
  /** Upcoming rounds made redundant by sets already done. */
  redundant: string[];
}

/** Today's rounds, computed from current storage. Safe to call from UI. */
export function setsToday(now: number = Date.now()): SetsToday {
  const date = new Date(now);
  const program = loadProgram(date);
  const prescriptions = prescriptionsFor(program, date);
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const blockedTs = expandPlanToFires(
    loadPlan(),
    midnight.getTime(),
    midnight.getTime() + 86_399_999,
  ).map(f => f.ts);
  const fires = placeRounds({
    date,
    dayStart: program.dayStart,
    dayEnd: program.dayEnd,
    rounds: groupIntoRounds(prescriptions),
    blockedTs,
  });
  const entries = entriesForDay(date);
  const {keep, drop} = selectUpcomingRounds({
    fires,
    prescriptions,
    doneByTrack: doneByTrack(entries),
    firedIds: firedSetIds(entries),
    now,
    graceMs: SET_GRACE_MS,
  });
  return {prescriptions, fires, upcoming: keep, redundant: drop};
}

const movesKey = (rx?: SetPrescription) =>
  JSON.stringify((rx?.moves ?? []).map(m => [m.trackId, m.amount]));

let enqueuedDay = '';
let enqueuedIds = new Set<string>();

export function reconcileSetsNow(now: number = Date.now()): void {
  const day = localDayKey(now);
  if (day !== enqueuedDay) {
    enqueuedDay = day;
    enqueuedIds = new Set();
  }
  const {upcoming, redundant} = setsToday(now);
  const waiting = new Map(queuedPulses().map(p => [p.id, p]));
  for (const fire of upcoming) {
    const queued = waiting.get(fire.id);
    if (queued) {
      if (movesKey(queued.prescription) === movesKey(fire.prescription)) {
        continue;
      }
      // Sets were logged since it was queued: re-queue with what's left,
      // keeping any snooze or +5 it was given.
      cancelQueued([fire.id]);
    } else if (enqueuedIds.has(fire.id) || hasPulse(fire.id)) {
      continue;
    }
    enqueue({
      id: fire.id,
      fireAt: queued?.fireAt ?? fire.ts,
      element: fire.element,
      windowId: SETS_WINDOW_ID,
      exerciseId: fire.exerciseId,
      prescription: fire.prescription,
    });
    enqueuedIds.add(fire.id);
  }
  cancelQueued(redundant);
}

/** Program or plan changed: round times may have moved, so re-lay the day. */
function relay(): void {
  const queued = queuedPulseIds(SETS_WINDOW_ID);
  cancelQueued(queued);
  for (const id of queued) {
    enqueuedIds.delete(id);
  }
  reconcileSetsNow();
}

let timer: ReturnType<typeof setInterval> | null = null;
let unsubs: Array<() => void> = [];

/** Start the sets scheduler. Idempotent; call once after hydration. */
export function startSetScheduler(): void {
  if (timer !== null) {
    return;
  }
  reconcileSetsNow();
  timer = setInterval(() => reconcileSetsNow(), SET_RECONCILE_MS);
  unsubs = [
    subscribeProgram(relay),
    subscribePlan(relay),
    // A set logged anywhere (drill tap, "+ set", a chime) trims the rounds
    // it made redundant. Deferred so a runtime seal that is still writing
    // its entry finishes before the queue changes under it.
    subscribeJournal(e => {
      if (e.kind === 'completion' && (e.trackId || e.moves)) {
        setTimeout(() => reconcileSetsNow(), 0);
      }
    }),
  ];
}

export function stopSetScheduler(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  unsubs.forEach(u => u());
  unsubs = [];
}

/** Test-only inspection. */
export const __test = {
  reset: () => {
    stopSetScheduler();
    enqueuedDay = '';
    enqueuedIds = new Set();
  },
  getEnqueuedIds: () => new Set(enqueuedIds),
};
