/**
 * Plan-driven scheduling — pure reconciler.
 *
 * Phase B of the reminders pipeline. The previous phase let the
 * operator manually fire pulses (Test Pulse). This module turns the
 * persisted Plan into a rolling 24h queue of pulses inside
 * `pulseRuntime`, with no native deps and no new persisted state.
 *
 * Design:
 *   - Pure reducer here decides *which* fires to push.
 *   - Side-effecting runtime adapter (also in this file: `start()` /
 *     `reconcileNow()`) owns the singletons (ID set, interval handle).
 *
 * Invariants enforced by the pure reducer:
 *   - Stable pulse id `plan:${windowId}:${slotIndex}:${ts}` — same
 *     shape the Ribbon uses for synthetic rows, so journal-entry
 *     dedup just works.
 *   - Idempotent: re-running with the same `now`+`enqueued` set yields
 *     `toEnqueue: []`.
 *   - Skips fires whose ts is more than `graceMs` in the past — those
 *     are already lost; the journal will eventually classify them as
 *     past-absorbed.
 *   - Cancels queued pulses the plan no longer produces, so a removed or
 *     retimed window stops chiming. A pulse already waiting behind an
 *     active one (past grace) is left to play out.
 *   - Skips water calls that ride along with a Daily Sets round
 *     (`skipIds`), and cancels them if they were already queued.
 *   - GC's enqueued IDs whose ts is older than `now - retainMs` so the
 *     set doesn't grow unbounded across an all-day session.
 */
import {
  drillForPlanChime,
  planWithWeather,
  subscribeWeather,
} from '../conditions/weather';
import {entriesForDay, handledPulseIds} from '../journal/journal';
import {
  expandPlanToFires,
  planPulseId,
  type FireSpec,
} from '../reminders/expandPlan';
import {loadPlan, subscribePlan} from '../reminders/repository';
import type {Plan} from '../reminders/types';
import {
  cancelQueued,
  enqueue as runtimeEnqueue,
  queuedPulses,
} from './pulseRuntime';
import {absorbedWaterCalls} from './setScheduler';

export {planPulseId};

/** Default rolling horizon — 24h ahead. */
export const DEFAULT_HORIZON_MS = 24 * 60 * 60_000;
/** Don't enqueue fires more than 60s in the past. */
export const DEFAULT_GRACE_MS = 60_000;
/** Forget enqueued IDs older than 6h so the set stays bounded. */
export const DEFAULT_RETAIN_MS = 6 * 60 * 60_000;
/** Run the impure reconciler at most once per minute. */
export const DEFAULT_RECONCILE_MS = 60_000;

export interface ReconcileInput {
  now: number;
  plan: Plan;
  alreadyEnqueued: ReadonlySet<string>;
  /** Pulse ids that already fired today — never re-enqueued, so an app
   *  restart inside the grace window can't chime the same pulse twice. */
  firedIds?: ReadonlySet<string>;
  /** Plan pulse ids waiting in the runtime queue (not active). */
  queuedPlanIds?: ReadonlySet<string>;
  /** Plan pulse ids another chime already covers (water riding along). */
  skipIds?: ReadonlySet<string>;
  horizonMs?: number;
  graceMs?: number;
  retainMs?: number;
}

export interface ReconcileResult {
  /** Fires to hand to `pulseRuntime.enqueue`. Already filtered + tagged. */
  toEnqueue: FireSpec[];
  /** Queued plan pulses the plan no longer produces — cancel them. */
  toCancel: string[];
  /** Updated id set after this reconcile cycle. */
  nextEnqueued: Set<string>;
}

/**
 * Pure reconcile. Returns the set of fires the caller should enqueue
 * plus the new `enqueued` id set. Caller is responsible for resolving
 * the drill (via `pickDrillForSlot`) and committing through the
 * runtime — those steps are impure and live below.
 */
export function reconcilePlan(input: ReconcileInput): ReconcileResult {
  const {
    now,
    plan,
    alreadyEnqueued,
    firedIds = new Set<string>(),
    queuedPlanIds = new Set<string>(),
    skipIds = new Set<string>(),
    horizonMs = DEFAULT_HORIZON_MS,
    graceMs = DEFAULT_GRACE_MS,
    retainMs = DEFAULT_RETAIN_MS,
  } = input;

  const fires = expandPlanToFires(plan, now - graceMs, now + horizonMs).filter(
    fire => !skipIds.has(planPulseId(fire)),
  );
  const expandedIds = new Set(fires.map(planPulseId));
  const toEnqueue: FireSpec[] = [];
  const nextEnqueued = new Set<string>();

  // Retain recently-enqueued ids so we don't double-fire if a pulse
  // is still in-flight (queued/active) but its ts has passed.
  for (const id of alreadyEnqueued) {
    const ts = parsePlanIdTs(id);
    if (ts === null || ts >= now - retainMs) {
      nextEnqueued.add(id);
    }
  }

  // Queued pulses the plan no longer produces (window removed or
  // retimed, or now riding along with a round). Ones already past grace
  // are waiting behind an active pulse and were legitimately due, so
  // they stay.
  const toCancel: string[] = [];
  for (const id of queuedPlanIds) {
    const ts = parsePlanIdTs(id);
    if (ts === null || ts < now - graceMs || expandedIds.has(id)) {
      continue;
    }
    toCancel.push(id);
    nextEnqueued.delete(id);
  }

  for (const fire of fires) {
    if (fire.ts < now - graceMs) {
      continue; // too late; ribbon will absorb it
    }
    const id = planPulseId(fire);
    if (nextEnqueued.has(id) || firedIds.has(id)) {
      continue;
    }
    toEnqueue.push(fire);
    nextEnqueued.add(id);
  }

  return {toEnqueue, toCancel, nextEnqueued};
}

function parsePlanIdTs(id: string): number | null {
  // `plan:${windowId}:${slotIndex}:${ts}` — windowId may itself contain
  // hyphens but not colons (newWindowId uses base36+hyphens).
  const lastColon = id.lastIndexOf(':');
  if (lastColon < 0) {
    return null;
  }
  const ts = Number(id.slice(lastColon + 1));
  return Number.isFinite(ts) ? ts : null;
}

// ── Impure runtime adapter ───────────────────────────────────────────

let enqueuedIds = new Set<string>();
let timer: ReturnType<typeof setInterval> | null = null;
let planUnsub: (() => void) | null = null;
let weatherUnsub: (() => void) | null = null;

/**
 * Reconcile-and-enqueue once. Safe to call frequently; the dedup set
 * makes repeated calls cheap.
 */
export function reconcileNow(now: number = Date.now()): void {
  const plan = planWithWeather(loadPlan(), now);
  const queuedPlanIds = new Set(
    queuedPulses()
      .map(p => p.id)
      .filter(id => id.startsWith('plan:')),
  );
  const {toEnqueue, toCancel, nextEnqueued} = reconcilePlan({
    now,
    plan,
    alreadyEnqueued: enqueuedIds,
    firedIds: handledPulseIds(entriesForDay(new Date(now))),
    queuedPlanIds,
    skipIds: absorbedWaterCalls(now),
  });
  enqueuedIds = nextEnqueued;
  if (toCancel.length > 0) {
    cancelQueued(toCancel);
  }
  for (const fire of toEnqueue) {
    const window = plan.windows.find(w => w.id === fire.windowId);
    const slot = window?.slots[fire.slotIndex];
    const id = planPulseId(fire);
    const {drill, note, detail} = drillForPlanChime(slot, id, fire.ts, window);
    runtimeEnqueue({
      id,
      fireAt: fire.ts,
      // A morning block piece chimes in its own element.
      element: drill?.element ?? fire.element,
      windowId: fire.windowId,
      exerciseId: drill?.id,
      note: note ?? detail,
    });
  }

  // The forecast moved on: a waiting chime whose weather call changed is
  // queued again with its new drill, keeping any +5 it was given.
  const fresh = new Set(toEnqueue.map(planPulseId));
  for (const pulse of queuedPulses()) {
    if (
      !pulse.id.startsWith('plan:') ||
      fresh.has(pulse.id) ||
      pulse.fireAt < now
    ) {
      continue;
    }
    const [, windowId, slotIndex] = pulse.id.split(':');
    const window = plan.windows.find(w => w.id === windowId);
    const slot = window?.slots[Number(slotIndex)];
    if (!slot) {
      continue;
    }
    const planned = drillForPlanChime(slot, pulse.id, pulse.fireAt, window);
    const note = planned.note ?? planned.detail;
    if (planned.drill?.id === pulse.exerciseId && note === pulse.note) {
      continue;
    }
    cancelQueued([pulse.id]);
    runtimeEnqueue({
      id: pulse.id,
      fireAt: pulse.fireAt,
      element: planned.drill?.element ?? pulse.element,
      windowId: pulse.windowId,
      exerciseId: planned.drill?.id,
      note,
    });
  }
}

/**
 * Start the plan-driven scheduler. Idempotent. Call once after
 * persistence has hydrated. Reconciles immediately, then on a 60s
 * interval, plus whenever the plan is saved.
 */
export function startPlanScheduler(): void {
  if (timer !== null) {
    return;
  }
  reconcileNow();
  timer = setInterval(() => reconcileNow(), DEFAULT_RECONCILE_MS);
  planUnsub = subscribePlan(() => reconcileNow());
  weatherUnsub = subscribeWeather(() => reconcileNow());
}

/** Stop the scheduler. Useful for tests + hot-reload. */
export function stopPlanScheduler(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  if (planUnsub !== null) {
    planUnsub();
    planUnsub = null;
  }
  if (weatherUnsub !== null) {
    weatherUnsub();
    weatherUnsub = null;
  }
}

/** Test-only inspection. */
export const __test = {
  reset: () => {
    stopPlanScheduler();
    enqueuedIds = new Set();
  },
  getEnqueuedIds: () => new Set(enqueuedIds),
  setEnqueuedIds: (ids: Iterable<string>) => {
    enqueuedIds = new Set(ids);
  },
};
