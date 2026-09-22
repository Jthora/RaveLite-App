import {ElementId} from '../../theme/elements';
import {
  DistributiveOmit,
  JournalEntry,
  SuppressionReason,
} from '../journal/types';
import {Pulse, PulseOutcome} from './types';
import type {SetPrescription} from '../program/types';

/**
 * Always-On pulse queue — pure reducer.
 *
 * Every operation is a function `(state, ...args) => { state, writes }`
 * with no side effects. The caller (Slice 4 surface UI / Slice 5 native
 * shell) is responsible for committing `writes` to the journal via
 * `append()` and persisting the new `state` if it cares to.
 *
 * Invariants enforced here (see
 * `docs/always-on-screen/initial-development/01-requirements/interaction-states.md`):
 *
 *  - At most one pulse is in the `active` state at any moment.
 *  - A `queued` pulse whose `fireAt` arrives while another pulse is
 *    already `active` waits — it does **not** preempt.
 *  - `queued → suppressed` bypasses `active` entirely.
 *  - `suppressed` pulses never play audio and never demand interaction.
 *  - A pulse can be snoozed at most once (`SNOOZE_CAP = 1`).
 *  - A pulse never transitions to `completed` automatically; the
 *    only auto-transition is `active → resolved.ignored` on expiry.
 *  - `resolved`, `suppressed`, and `cancelled` pulses are dropped from
 *    the in-memory list once their journal write is emitted.
 */

/** Default plan-window timeout — 8 min — per FR + interaction-states. */
export const DEFAULT_ACTIVE_WINDOW_MS = 8 * 60 * 1000;
/** Default snooze duration — 5 min. */
export const DEFAULT_SNOOZE_MS = 5 * 60 * 1000;
/** Snooze attempts allowed per pulse. OQ-2 default. */
export const SNOOZE_CAP = 1;

/** Inputs the caller hands to `enqueue`. */
export interface PulseSpec {
  id: string;
  fireAt: number;
  element: ElementId;
  /** Defaults to `fireAt + DEFAULT_ACTIVE_WINDOW_MS`. */
  expiresAt?: number;
  windowId?: string;
  exerciseId?: string;
  prescription?: SetPrescription;
  /** Why the chime changed with the weather, when it did. */
  note?: string;
}

/**
 * Decision function for whether the surface may page right now.
 * Returns the suppression reason to use, or `null` to allow paging.
 *
 * In production this is `pagingAllowedAt(new Date(now))`. Tests pass
 * a deterministic mock.
 */
export type PagingPolicy = (now: number) => SuppressionReason | null;

/** A queued pulse this far past its time is not rung. */
export const STALE_AFTER_MS = 30 * 60_000;

/** Default policy — always allow. Useful for unit tests. */
export const ALWAYS_PAGE: PagingPolicy = () => null;

/**
 * A journal entry the caller should commit. Mirrors `JournalEntry`
 * minus the storage-side fields the journal layer fills in.
 */
export type PendingJournalEntry = DistributiveOmit<JournalEntry, 'id'>;

export interface QueueState {
  pulses: Pulse[];
}

export interface QueueResult {
  state: QueueState;
  writes: PendingJournalEntry[];
}

/** Empty starting state. */
export function emptyQueue(): QueueState {
  return {pulses: []};
}

// ── helpers ──────────────────────────────────────────────────────────

function clonePulse(p: Pulse): Pulse {
  return {...p};
}

function findActive(state: QueueState): Pulse | undefined {
  return state.pulses.find(p => p.state === 'active');
}

function withPulses(pulses: Pulse[]): QueueState {
  return {pulses};
}

// ── operations ───────────────────────────────────────────────────────

/**
 * Add a freshly-scheduled pulse to the queue. Always lands in
 * `queued`. Doesn't try to fire immediately even if `fireAt <= now`;
 * call `tick` for that.
 */
export function enqueue(state: QueueState, spec: PulseSpec): QueueResult {
  const pulse: Pulse = {
    id: spec.id,
    state: 'queued',
    fireAt: spec.fireAt,
    expiresAt: spec.expiresAt ?? spec.fireAt + DEFAULT_ACTIVE_WINDOW_MS,
    element: spec.element,
    windowId: spec.windowId,
    exerciseId: spec.exerciseId,
    prescription: spec.prescription,
    note: spec.note,
  };
  return {state: withPulses([...state.pulses, pulse]), writes: []};
}

/**
 * Advance time. Performs, in order:
 *   1. Expire any `active` pulse whose `expiresAt <= now`
 *      → `resolved` + emit `reminder.ignored`.
 *   2. For each `queued` pulse with `fireAt <= now`, in fire-time
 *      order: if paging is suppressed, transition to `suppressed`
 *      and emit `reminder.suppressed`. Otherwise, if no `active`
 *      pulse exists, transition the *earliest* pending one to
 *      `active` and emit `reminder.fired`. Subsequent ready pulses
 *      stay `queued` (at-most-one-active).
 *
 * Returns the new state with terminal pulses dropped, plus the list
 * of journal writes the caller should commit.
 */
export function tick(
  state: QueueState,
  now: number,
  policy: PagingPolicy = ALWAYS_PAGE,
): QueueResult {
  const writes: PendingJournalEntry[] = [];
  let pulses = state.pulses.map(clonePulse);

  // 1. Expire active pulses whose window has elapsed.
  for (const p of pulses) {
    if (p.state === 'active' && p.expiresAt <= now) {
      p.state = 'resolved';
      p.resolution = {
        outcome: 'ignored',
        at: now,
        respondedAfterMs: null,
      };
      writes.push({
        kind: 'reminder.ignored',
        at: now,
        pulseId: p.id,
        respondedAfterMs: null,
      });
    }
  }

  // 2. Walk queued pulses in fire-time order. Decide one-at-a-time.
  const queuedReady = pulses
    .filter(p => p.state === 'queued' && p.fireAt <= now)
    .sort((a, b) => a.fireAt - b.fireAt);

  for (const p of queuedReady) {
    // Long overdue: the app was closed or frozen when it was due. Ringing
    // it now — one stale chime after another on resume — is worse than
    // saying it never sounded.
    const reason: SuppressionReason | null =
      now - p.fireAt > STALE_AFTER_MS ? 'app-closed' : policy(now);
    if (reason !== null) {
      p.state = 'suppressed';
      p.suppression = {at: now, reason};
      writes.push({
        kind: 'reminder.suppressed',
        at: now,
        pulseId: p.id,
        reason,
      });
      continue;
    }
    // Paging allowed. Promote only if no other pulse is active.
    if (findActive({pulses}) !== undefined) {
      // Stays queued. A future `tick` after the active one resolves
      // will pick it up.
      continue;
    }
    p.state = 'active';
    // A pulse that waited behind another gets its full answer window from
    // the moment it actually chimes; otherwise it could chime and be
    // ignored a second later. `fireAt` stays put: backup-chime
    // cancellation keys off it.
    p.expiresAt = Math.max(p.expiresAt, now + (p.expiresAt - p.fireAt));
    writes.push({
      kind: 'reminder.fired',
      at: now,
      pulseId: p.id,
      element: p.element,
      windowId: p.windowId,
      exerciseId: p.exerciseId,
      trackId: p.prescription?.trackId,
    });
  }

  // Drop terminal pulses.
  pulses = pulses.filter(
    p =>
      p.state !== 'resolved' &&
      p.state !== 'suppressed' &&
      p.state !== 'cancelled',
  );

  return {state: withPulses(pulses), writes};
}

/**
 * Operator-driven resolution of the currently-active pulse.
 *
 * - `'completed'` updates queue state but emits **no** journal entry —
 *   the caller writes a `CompletionEntry` separately (it carries
 *   exercise-specific fields the queue doesn't know about).
 *   The caller should pass `respondedAfterMs` for symmetry; we
 *   record it on the pulse but don't write it.
 * - `'skipped'` emits `reminder.skipped`.
 * - `'ignored'` is reserved for the `tick` window-expiry path; calling
 *   `resolve(..., 'ignored', ...)` is allowed (e.g. for forced
 *   close-out paths) and emits `reminder.ignored`.
 *
 * No-op + empty writes if the pulse isn't found or isn't active.
 */
export function resolve(
  state: QueueState,
  pulseId: string,
  outcome: PulseOutcome,
  now: number,
  /** Why, when the person said: 'hurt' for a skip that was pain. */
  reason?: string,
): QueueResult {
  if (outcome === 'snoozed') {
    // Snoozes go through `snooze()`, not `resolve()`.
    return {state, writes: []};
  }
  const idx = state.pulses.findIndex(
    p => p.id === pulseId && p.state === 'active',
  );
  if (idx < 0) {
    return {state, writes: []};
  }
  const target = clonePulse(state.pulses[idx]);
  const respondedAfterMs = Math.max(0, now - timeOfFireFor(target));
  target.state = 'resolved';
  target.resolution = {
    outcome,
    at: now,
    respondedAfterMs,
  };

  const writes: PendingJournalEntry[] = [];
  if (outcome === 'skipped') {
    writes.push({
      kind: 'reminder.skipped',
      at: now,
      pulseId: target.id,
      respondedAfterMs,
      ...(reason ? {reason} : {}),
    });
  } else if (outcome === 'ignored') {
    writes.push({
      kind: 'reminder.ignored',
      at: now,
      pulseId: target.id,
      respondedAfterMs,
    });
  }
  // 'completed' → no journal write here; caller posts CompletionEntry.

  const nextPulses = [...state.pulses];
  nextPulses.splice(idx, 1); // drop terminal
  return {state: withPulses(nextPulses), writes};
}

/**
 * Snooze the currently-active pulse. Re-queues with `fireAt = now +
 * durationMs` and a fresh window. Caps at `SNOOZE_CAP` snoozes per
 * pulse — second-snooze attempts no-op with empty writes.
 */
export function snooze(
  state: QueueState,
  pulseId: string,
  now: number,
  durationMs: number = DEFAULT_SNOOZE_MS,
): QueueResult {
  const idx = state.pulses.findIndex(
    p => p.id === pulseId && p.state === 'active',
  );
  if (idx < 0) {
    return {state, writes: []};
  }
  const target = clonePulse(state.pulses[idx]);
  if (target.snoozedFrom !== undefined) {
    // Already snoozed once — cap reached.
    return {state, writes: []};
  }
  const respondedAfterMs = Math.max(0, now - timeOfFireFor(target));
  target.snoozedFrom = target.fireAt;
  target.state = 'queued';
  target.fireAt = now + durationMs;
  target.expiresAt = target.fireAt + DEFAULT_ACTIVE_WINDOW_MS;

  const writes: PendingJournalEntry[] = [
    {
      kind: 'reminder.snoozed',
      at: now,
      pulseId: target.id,
      respondedAfterMs,
    },
  ];

  const nextPulses = [...state.pulses];
  nextPulses[idx] = target;
  return {state: withPulses(nextPulses), writes};
}

/**
 * Cancel a pulse (e.g. plan-edit removed it). Drops it from the list
 * with no journal writes. Cancelling an `active` pulse is allowed but
 * not expected during normal operation.
 */
export function cancel(state: QueueState, pulseId: string): QueueResult {
  const idx = state.pulses.findIndex(p => p.id === pulseId);
  if (idx < 0) {
    return {state, writes: []};
  }
  const nextPulses = [...state.pulses];
  nextPulses.splice(idx, 1);
  return {state: withPulses(nextPulses), writes: []};
}

/**
 * Resolve "what time did this pulse most recently start being
 * actionable?" — for snoozed-then-fired pulses, that's the
 * post-snooze fireAt; otherwise it's the original.
 */
function timeOfFireFor(p: Pulse): number {
  return p.fireAt;
}
