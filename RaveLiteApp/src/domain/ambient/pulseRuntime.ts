/**
 * Slice 5 — pulse runtime singleton.
 *
 * Wraps the pure `pulseQueue` reducer with:
 *   - in-memory `QueueState`,
 *   - a 1Hz tick (driven by AlwaysOnPanel's existing poll, no new
 *     interval),
 *   - automatic journal commit for every emitted write,
 *   - automatic notifee fireNow for every `reminder.fired` write so the
 *     OS actually buzzes when a queued pulse promotes to active,
 *   - a thin observer API (`subscribe`) so React can re-render on state
 *     changes without manually polling the runtime.
 *
 * Scope: the smallest plumbing layer that lets the Ribbon receive a
 * real `ActivePulseSummary`. The runtime does NOT (yet) auto-enqueue
 * from the Plan — that's Phase B of the scheduler. For now, callers
 * (Test Pulse, Plan-driven scheduler when it lands) call `enqueue()`
 * directly.
 */
import {EXERCISE_LIBRARY} from '../exercises/library';
import {append} from '../journal/journal';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {notifeeScheduler} from '../reminders/notifeeScheduler';
import {
  emptyQueue,
  enqueue as queueEnqueue,
  resolve as queueResolve,
  snooze as queueSnooze,
  tick as queueTick,
  type PulseSpec,
  type QueueState,
} from './pulseQueue';
import {pagingAllowedAt} from './activeHours';
import type {ActivePulseSummary} from './ribbon';
import type {PulseOutcome} from './types';

let state: QueueState = emptyQueue();
const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) {
    l();
  }
}

/** Subscribe to runtime state changes. Returns an unsubscribe fn. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Read the active pulse, expanded to the shape the Ribbon needs. */
export function getActivePulseSummary(): ActivePulseSummary | undefined {
  const active = state.pulses.find(p => p.state === 'active');
  if (!active) {
    return undefined;
  }
  const drill = active.exerciseId
    ? EXERCISE_LIBRARY.find(e => e.id === active.exerciseId)
    : undefined;
  return {
    pulseId: active.id,
    fireAt: active.fireAt,
    expiresAt: active.expiresAt,
    element: active.element,
    drillId: drill?.id ?? active.exerciseId ?? 'unknown',
    drillName: drill?.name ?? 'Pulse',
    durationSec: drill?.approxSeconds ?? 60,
    cuesShort: drill?.cues?.slice(0, 4) ?? [],
  };
}

function commit(writes: ReturnType<typeof queueTick>['writes']): void {
  for (const w of writes) {
    append(w);
    if (w.kind === 'reminder.fired') {
      const el = ELEMENTS[w.element as ElementId];
      const drill = w.exerciseId
        ? EXERCISE_LIBRARY.find(e => e.id === w.exerciseId)
        : undefined;
      // Fire-and-forget; failure must not abort the queue advance.
      notifeeScheduler
        .fireNow({
          element: w.element as ElementId,
          color: el.color,
          title: drill?.name ?? `${el.name} pulse`,
          body: drill?.cues?.[0] ?? `Time for ${el.name}.`,
          exerciseId: drill?.id ?? 'unknown',
        })
        .catch(err =>
          // eslint-disable-next-line no-console
          console.warn('[pulseRuntime] fireNow failed', err),
        );
    }
  }
}

/** Add a pulse. `fireAt` may be `now` (or earlier) — `tickNow` will promote it. */
export function enqueue(spec: PulseSpec): void {
  const result = queueEnqueue(state, spec);
  state = result.state;
  commit(result.writes);
  notify();
}

/** Convenience: enqueue a pulse that fires at `now`. */
export function enqueueNow(opts: {
  element: ElementId;
  exerciseId?: string;
  windowId?: string;
  expiresAt?: number;
}): void {
  const now = Date.now();
  enqueue({
    id: `tp.${now}`,
    fireAt: now,
    element: opts.element,
    exerciseId: opts.exerciseId,
    windowId: opts.windowId,
    expiresAt: opts.expiresAt,
  });
  tickNow(now);
}

/** Drive the reducer one step at the given epoch ms. */
export function tickNow(now: number = Date.now()): void {
  const result = queueTick(state, now, t =>
    pagingAllowedAt(new Date(t)),
  );
  if (result.writes.length === 0 && result.state === state) {
    return;
  }
  state = result.state;
  commit(result.writes);
  notify();
}

/** Operator resolution of the currently-active pulse. */
export function resolveActive(
  outcome: PulseOutcome,
  at: number = Date.now(),
): void {
  const active = state.pulses.find(p => p.state === 'active');
  if (!active) {
    return;
  }
  const result = queueResolve(state, active.id, outcome, at);
  state = result.state;
  commit(result.writes);
  notify();
}

/** Operator snooze of the currently-active pulse. */
export function snoozeActive(at: number = Date.now()): void {
  const active = state.pulses.find(p => p.state === 'active');
  if (!active) {
    return;
  }
  const result = queueSnooze(state, active.id, at);
  state = result.state;
  commit(result.writes);
  notify();
}

/** Test-only state accessors. */
export const __test = {
  reset: () => {
    state = emptyQueue();
    listeners.clear();
    stopPulseRuntime();
  },
  getState: () => state,
};

let tickTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the runtime's self-ticker. Idempotent. Call once at app boot
 * (after persistence hydration). Drives `tickNow()` every second so
 * queued pulses promote to active without depending on any particular
 * screen being mounted.
 */
export function startPulseRuntime(): void {
  if (tickTimer !== null) {
    return;
  }
  tickTimer = setInterval(() => tickNow(), 1000);
}

/** Stop the self-ticker. Useful for tests + hot-reload. */
export function stopPulseRuntime(): void {
  if (tickTimer !== null) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}
