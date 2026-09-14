/**
 * Slice 5 — pulse runtime singleton.
 *
 * Wraps the pure `pulseQueue` reducer with:
 *   - in-memory `QueueState`,
 *   - a 1Hz self-tick started at app boot,
 *   - automatic journal commit for every emitted write,
 *   - automatic notifee fireNow for every `reminder.fired` write so the
 *     OS actually chimes when a queued pulse promotes to active,
 *   - operator answers (seal / snooze / skip) that also dismiss the
 *     pulse's notification,
 *   - a thin observer API (`subscribe`) so React can re-render on state
 *     changes without manually polling the runtime.
 *
 * Producers: `planScheduler` (element cadence from the Plan),
 * `setScheduler` (Daily Sets), and Test Pulse.
 */
import {EXERCISE_LIBRARY} from '../exercises/library';
import {append} from '../journal/journal';
import type {CompletionEntry} from '../journal/types';
import {formatSetAmount} from '../program/progress';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {
  cancelPulseNotification,
  notifeeScheduler,
  type NotificationActionId,
} from '../reminders/notifeeScheduler';
import {
  cancel as queueCancel,
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
import type {Pulse, PulseOutcome} from './types';

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

function drillFor(p: Pick<Pulse, 'exerciseId'>) {
  return p.exerciseId
    ? EXERCISE_LIBRARY.find(e => e.id === p.exerciseId)
    : undefined;
}

function findActive(): Pulse | undefined {
  return state.pulses.find(p => p.state === 'active');
}

/** Read the active pulse, expanded to the shape the Ribbon needs. */
export function getActivePulseSummary(): ActivePulseSummary | undefined {
  const active = findActive();
  if (!active) {
    return undefined;
  }
  const drill = drillFor(active);
  return {
    pulseId: active.id,
    fireAt: active.fireAt,
    expiresAt: active.expiresAt,
    element: active.element,
    drillId: drill?.id ?? active.exerciseId ?? 'unknown',
    drillName: active.prescription?.label ?? drill?.name ?? 'Pulse',
    durationSec: drill?.approxSeconds ?? 60,
    cuesShort: drill?.cues?.slice(0, 4) ?? [],
    prescription: active.prescription,
  };
}

/** True while the runtime holds a pulse with this id (queued or active). */
export function hasPulse(id: string): boolean {
  return state.pulses.some(p => p.id === id);
}

/** Ids of queued (not yet fired) pulses from one plan window / producer. */
export function queuedPulseIds(windowId: string): string[] {
  return state.pulses
    .filter(p => p.state === 'queued' && p.windowId === windowId)
    .map(p => p.id);
}

function dismiss(pulseId: string): void {
  cancelPulseNotification(pulseId).catch(() => {});
}

function commit(writes: ReturnType<typeof queueTick>['writes']): void {
  for (const w of writes) {
    append(w);
    if (w.kind !== 'reminder.fired') {
      continue;
    }
    const el = ELEMENTS[w.element as ElementId];
    const pulse = state.pulses.find(p => p.id === w.pulseId);
    const drill = drillFor(w);
    const rx = pulse?.prescription;
    const cue = drill?.cues?.[0];
    // Fire-and-forget; failure must not abort the queue advance.
    notifeeScheduler
      .fireNow({
        element: w.element as ElementId,
        color: el.color,
        title: rx
          ? `${rx.label} · ${formatSetAmount(rx.amount, rx.unit)}`
          : drill?.name ?? `${el.name} pulse`,
        body: rx
          ? `Set ${rx.setIndex} of ${rx.sets}${cue ? ` · ${cue}` : ''}`
          : cue ?? `Time for ${el.name}.`,
        exerciseId: drill?.id ?? 'unknown',
        pulseId: w.pulseId,
        data: rx
          ? {trackId: rx.trackId, amount: String(rx.amount), unit: rx.unit}
          : undefined,
      })
      .catch(err =>
        // eslint-disable-next-line no-console
        console.warn('[pulseRuntime] fireNow failed', err),
      );
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

/** Drop queued pulses by id. Active pulses are left alone. */
export function cancelQueued(ids: readonly string[]): void {
  let next = state;
  for (const id of ids) {
    if (next.pulses.some(p => p.id === id && p.state === 'queued')) {
      next = queueCancel(next, id).state;
    }
  }
  if (next !== state) {
    state = next;
    notify();
  }
}

/**
 * Push a queued pulse later by `byMs` (e.g. "+5" on the next chime). Its
 * answer window moves with it. Active pulses are left alone.
 */
export function deferQueued(id: string, byMs: number): void {
  const idx = state.pulses.findIndex(p => p.id === id && p.state === 'queued');
  if (idx < 0) {
    return;
  }
  const pulse = state.pulses[idx];
  const pulses = [...state.pulses];
  pulses[idx] = {
    ...pulse,
    fireAt: pulse.fireAt + byMs,
    expiresAt: pulse.expiresAt + byMs,
  };
  state = {pulses};
  notify();
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

/**
 * Seal the active pulse: resolve it and write the CompletionEntry. For a
 * Daily Sets pulse the entry carries `trackId` + `amount` (the prescribed
 * amount unless the operator adjusted it).
 */
export function sealActive(
  opts: {
    amount?: number;
    source?: CompletionEntry['source'];
    at?: number;
  } = {},
): CompletionEntry | undefined {
  const active = findActive();
  if (!active) {
    return undefined;
  }
  const at = opts.at ?? Date.now();
  const drill = drillFor(active);
  const rx = active.prescription;
  const result = queueResolve(state, active.id, 'completed', at);
  state = result.state;
  commit(result.writes);
  const entry = append({
    kind: 'completion',
    at,
    exerciseId: drill?.id ?? active.exerciseId ?? 'unknown',
    element: active.element,
    source: opts.source ?? 'always-on',
    pulseId: active.id,
    respondedAfterMs: Math.max(0, at - active.fireAt),
    durationSec: drill?.approxSeconds,
    ...(rx ? {trackId: rx.trackId, amount: opts.amount ?? rx.amount} : {}),
  }) as CompletionEntry;
  dismiss(active.id);
  notify();
  return entry;
}

/** Operator resolution (skip / ignore) of the currently-active pulse. */
export function resolveActive(
  outcome: PulseOutcome,
  at: number = Date.now(),
): void {
  const active = findActive();
  if (!active) {
    return;
  }
  const result = queueResolve(state, active.id, outcome, at);
  state = result.state;
  commit(result.writes);
  dismiss(active.id);
  notify();
}

/** Operator snooze of the currently-active pulse. */
export function snoozeActive(at: number = Date.now()): void {
  const active = findActive();
  if (!active) {
    return;
  }
  const result = queueSnooze(state, active.id, at);
  state = result.state;
  commit(result.writes);
  dismiss(active.id);
  notify();
}

/**
 * Answer a pulse from its notification buttons. Returns false when the
 * runtime isn't holding that pulse as active (expired, or the process
 * restarted) so the caller can record the answer directly.
 */
export function answerActivePulse(
  pulseId: string,
  action: NotificationActionId,
  at: number = Date.now(),
): boolean {
  if (findActive()?.id !== pulseId) {
    return false;
  }
  if (action === 'seal') {
    sealActive({source: 'notification', at});
  } else if (action === 'snooze') {
    snoozeActive(at);
  } else {
    resolveActive('skipped', at);
  }
  return true;
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
