/**
 * Daily Sets scheduler — turns today's program into round chimes inside
 * the pulse runtime, alongside the plan scheduler.
 *
 * Every minute (and whenever the program, plan, My day, or a set is
 * logged):
 *   1. Prescribe today's sets, group them into rounds and spread the
 *      rounds across My day, keeping clear of the plan's chimes.
 *   2. Compare against today's journal: sets already done (from a chime,
 *      a notification button, a drill tap, or a manual "+ set") trim the
 *      upcoming rounds.
 *   3. Fold nearby plan water calls into rounds as a ride-along glass.
 *   4. Enqueue needed rounds not yet enqueued, re-queue a waiting round
 *      whose contents changed, and cancel rounds no longer needed.
 */
import type {ElementId} from '../../theme/elements';
import {activityInRange} from '../activity/activity';
import {countsByElement} from '../activity/stats';
import {entriesForDay, subscribeJournal} from '../journal/journal';
import {
  expandPlanToFires,
  planPulseId,
  type FireSpec,
} from '../reminders/expandPlan';
import {loadPlan, subscribePlan} from '../reminders/repository';
import type {Plan} from '../reminders/types';
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
import {getActiveHours, subscribeActiveHours} from './activeHours';
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
/** Rounds stop this long before My day ends, leaving the evening quiet. */
export const ROUND_END_MARGIN_MS = 90 * 60_000;
/** A plan water call this close to a round rides along with it. */
export const WATER_RIDE_ALONG_MS = 20 * 60_000;

export interface SetsToday {
  prescriptions: DayPrescription[];
  /** The full roster, including rounds already fired or no longer needed. */
  fires: SetFire[];
  /** Upcoming rounds still needed. */
  upcoming: SetFire[];
  /** Upcoming rounds made redundant by sets already done. */
  redundant: string[];
  /** Plan water calls folded into a round; the plan scheduler skips them. */
  absorbedPlanIds: string[];
}

function isWaterCall(plan: Plan, fire: FireSpec): boolean {
  const slot = plan.windows.find(w => w.id === fire.windowId)?.slots[
    fire.slotIndex
  ];
  return slot?.requiredTags?.includes('Hydration') ?? false;
}

let balanceCache: {day: string; counts: Record<ElementId, number>} | undefined;

/**
 * Things done per element over the seven days before today, for smart
 * partners. Past days only, so a round's partner holds steady all day and
 * its chime is never re-queued for a partner change.
 */
function partnerBalance(date: Date): Record<ElementId, number> {
  const day = localDayKey(date.getTime());
  if (balanceCache?.day !== day) {
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - 7);
    const to = new Date(date);
    to.setHours(0, 0, 0, 0);
    to.setDate(to.getDate() - 1);
    balanceCache = {day, counts: countsByElement(activityInRange(from, to))};
  }
  return balanceCache.counts;
}

/** Today's rounds, computed from current storage. Safe to call from UI. */
export function setsToday(now: number = Date.now()): SetsToday {
  const date = new Date(now);
  const program = loadProgram(date);
  const plan = loadPlan();
  const myDay = getActiveHours();
  const prescriptions = prescriptionsFor(program, date);
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const planFires = expandPlanToFires(
    plan,
    midnight.getTime(),
    midnight.getTime() + 86_399_999,
  );
  const fires = placeRounds({
    date,
    dayStart: myDay.start,
    dayEnd: myDay.end,
    endMarginMs: ROUND_END_MARGIN_MS,
    rounds: groupIntoRounds(prescriptions, {balance: partnerBalance(date)}),
    blockedTs: planFires.map(f => f.ts),
  });
  const entries = entriesForDay(date);
  const firedIds = firedSetIds(entries);
  const {keep, drop} = selectUpcomingRounds({
    fires,
    prescriptions,
    doneByTrack: doneByTrack(entries),
    firedIds,
    now,
    graceMs: SET_GRACE_MS,
  });

  // A water call near a round that still chimes (or already did) becomes
  // that round's glass instead of a chime of its own.
  const live = [...keep, ...fires.filter(f => firedIds.has(f.id))];
  const withWater = new Set<string>();
  const absorbedPlanIds: string[] = [];
  for (const call of planFires.filter(f => isWaterCall(plan, f))) {
    const nearest = live
      .filter(
        r =>
          !withWater.has(r.id) &&
          Math.abs(r.ts - call.ts) <= WATER_RIDE_ALONG_MS,
      )
      .sort((a, b) => Math.abs(a.ts - call.ts) - Math.abs(b.ts - call.ts))[0];
    if (nearest) {
      withWater.add(nearest.id);
      absorbedPlanIds.push(planPulseId(call));
    }
  }
  const addWater = (f: SetFire): SetFire =>
    withWater.has(f.id)
      ? {...f, prescription: {...f.prescription, water: true}}
      : f;

  return {
    prescriptions,
    fires: fires.map(addWater),
    upcoming: keep.map(addWater),
    redundant: drop,
    absorbedPlanIds,
  };
}

/** Plan water calls riding along with a round today or tomorrow. */
export function absorbedWaterCalls(now: number = Date.now()): Set<string> {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return new Set([
    ...setsToday(now).absorbedPlanIds,
    ...setsToday(tomorrow.getTime()).absorbedPlanIds,
  ]);
}

const contentsKey = (rx?: SetPrescription) =>
  JSON.stringify([
    (rx?.moves ?? []).map(m => [m.trackId, m.amount]),
    rx?.water ?? false,
  ]);

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
      if (contentsKey(queued.prescription) === contentsKey(fire.prescription)) {
        continue;
      }
      // Sets were logged (or a glass joined) since it was queued: re-queue
      // with the new contents, keeping any snooze or +5 it was given.
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

/** Program, plan or My day changed: round times may have moved. */
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
    subscribeActiveHours(relay),
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
