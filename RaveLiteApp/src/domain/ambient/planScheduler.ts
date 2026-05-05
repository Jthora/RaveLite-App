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
 *   - GC's enqueued IDs whose ts is older than `now - retainMs` so the
 *     set doesn't grow unbounded across an all-day session.
 */
import {expandPlanToFires, type FireSpec} from '../reminders/expandPlan';
import {pickDrillForSlotSeeded} from '../reminders/scheduler';
import {loadPlan, subscribePlan} from '../reminders/repository';
import type {Plan} from '../reminders/types';
import {enqueue as runtimeEnqueue} from './pulseRuntime';

/** Default rolling horizon — 24h ahead. */
export const DEFAULT_HORIZON_MS = 24 * 60 * 60_000;
/** Don't enqueue fires more than 60s in the past. */
export const DEFAULT_GRACE_MS = 60_000;
/** Forget enqueued IDs older than 6h so the set stays bounded. */
export const DEFAULT_RETAIN_MS = 6 * 60 * 60_000;
/** Run the impure reconciler at most once per minute. */
export const DEFAULT_RECONCILE_MS = 60_000;

/** Stable id for a plan-derived pulse. */
export function planPulseId(fire: FireSpec): string {
  return `plan:${fire.windowId}:${fire.slotIndex}:${fire.ts}`;
}

export interface ReconcileInput {
  now: number;
  plan: Plan;
  alreadyEnqueued: ReadonlySet<string>;
  horizonMs?: number;
  graceMs?: number;
  retainMs?: number;
}

export interface ReconcileResult {
  /** Fires to hand to `pulseRuntime.enqueue`. Already filtered + tagged. */
  toEnqueue: FireSpec[];
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
    horizonMs = DEFAULT_HORIZON_MS,
    graceMs = DEFAULT_GRACE_MS,
    retainMs = DEFAULT_RETAIN_MS,
  } = input;

  const fires = expandPlanToFires(plan, now - graceMs, now + horizonMs);
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

  for (const fire of fires) {
    if (fire.ts < now - graceMs) {
      continue; // too late; ribbon will absorb it
    }
    const id = planPulseId(fire);
    if (nextEnqueued.has(id)) {
      continue;
    }
    toEnqueue.push(fire);
    nextEnqueued.add(id);
  }

  return {toEnqueue, nextEnqueued};
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

/**
 * Reconcile-and-enqueue once. Safe to call frequently; the dedup set
 * makes repeated calls cheap.
 */
export function reconcileNow(now: number = Date.now()): void {
  const plan = loadPlan();
  const {toEnqueue, nextEnqueued} = reconcilePlan({
    now,
    plan,
    alreadyEnqueued: enqueuedIds,
  });
  enqueuedIds = nextEnqueued;
  for (const fire of toEnqueue) {
    const window = plan.windows.find(w => w.id === fire.windowId);
    const slot = window?.slots[fire.slotIndex];
    const id = planPulseId(fire);
    const drill = slot ? pickDrillForSlotSeeded(slot, id) : undefined;
    runtimeEnqueue({
      id,
      fireAt: fire.ts,
      element: fire.element,
      windowId: fire.windowId,
      exerciseId: drill?.id,
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
