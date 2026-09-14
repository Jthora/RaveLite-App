/**
 * Daily Sets scheduler — turns today's program into set chimes inside the
 * pulse runtime, alongside the plan scheduler.
 *
 * Every minute (and whenever the program, plan, or a set is logged):
 *   1. Prescribe today's sets and spread them across the set window,
 *      keeping clear of the plan's own chimes.
 *   2. Compare against today's journal: sets already done (from a chime,
 *      a notification button, or a manual "+ set") reduce how many
 *      upcoming chimes are still needed.
 *   3. Enqueue needed chimes not yet enqueued; cancel queued chimes that
 *      are no longer needed.
 */
import {entriesForDay} from '../journal/journal';
import {expandPlanToFires} from '../reminders/expandPlan';
import {loadPlan, subscribePlan} from '../reminders/repository';
import {doneByTrack, firedSetIds} from '../program/progress';
import {
  loadProgram,
  prescriptionsFor,
  subscribeProgram,
} from '../program/repository';
import {distributeSets, selectUpcomingSets} from '../program/schedule';
import {
  SETS_WINDOW_ID,
  type DayPrescription,
  type SetFire,
} from '../program/types';
import {localDayKey} from '../training/grading';
import {cancelQueued, enqueue, hasPulse, queuedPulseIds} from './pulseRuntime';

/** Sets up to a minute late still get enqueued (reconcile granularity). */
export const SET_GRACE_MS = 60_000;
export const SET_RECONCILE_MS = 60_000;

export interface SetsToday {
  prescriptions: DayPrescription[];
  /** The full roster, including sets already fired or no longer needed. */
  fires: SetFire[];
  /** Upcoming chimes still needed. */
  upcoming: SetFire[];
  /** Upcoming chimes made redundant by sets already done. */
  redundant: string[];
}

/** Today's sets, computed from current storage. Safe to call from UI. */
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
  const fires = distributeSets({
    date,
    dayStart: program.dayStart,
    dayEnd: program.dayEnd,
    prescriptions,
    blockedTs,
  });
  const entries = entriesForDay(date);
  const {keep, drop} = selectUpcomingSets({
    fires,
    prescriptions,
    doneByTrack: doneByTrack(entries),
    firedIds: firedSetIds(entries),
    now,
    graceMs: SET_GRACE_MS,
  });
  return {prescriptions, fires, upcoming: keep, redundant: drop};
}

let enqueuedDay = '';
let enqueuedIds = new Set<string>();

export function reconcileSetsNow(now: number = Date.now()): void {
  const day = localDayKey(now);
  if (day !== enqueuedDay) {
    enqueuedDay = day;
    enqueuedIds = new Set();
  }
  const {upcoming, redundant} = setsToday(now);
  for (const fire of upcoming) {
    if (enqueuedIds.has(fire.id) || hasPulse(fire.id)) {
      continue;
    }
    enqueue({
      id: fire.id,
      fireAt: fire.ts,
      element: fire.element,
      windowId: SETS_WINDOW_ID,
      exerciseId: fire.exerciseId,
      prescription: fire.prescription,
    });
    enqueuedIds.add(fire.id);
  }
  cancelQueued(redundant);
}

/** Program or plan changed: set times may have moved, so re-lay the day. */
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
  unsubs = [subscribeProgram(relay), subscribePlan(relay)];
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
