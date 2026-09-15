import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {addEntry, getMetric} from './repository';
import type {TrainingLogEntry} from './types';

/**
 * Session timer — for a staff session, a ride, a ruck, a walk, or a yoga,
 * tai chi or quiet cardio video played on another device. Start it and
 * RaveLite keeps the clock; only the start time is stored, so it keeps
 * running if the app closes. Stop logs the minutes to the Train log, dated
 * when the session began.
 */

/** The session kinds the timer offers, in the order it lists them. */
export const SESSION_KIND_IDS: readonly string[] = [
  'builtin.staff-session',
  'builtin.bike-ride',
  'builtin.ruck',
  'builtin.walk-session',
  'builtin.yoga-video',
  'builtin.tai-chi-video',
  'builtin.quiet-cardio-video',
];

/** Under this, Stop discards: a slip of the thumb isn't a session. */
export const MIN_SESSION_SECONDS = 60;

export interface RunningSession {
  kindId: string;
  startedAt: number;
}

const KEY = KEYS.setting('session.running');
const listeners = new Set<() => void>();

/** Fires when a session starts, stops or is discarded. */
export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getRunningSession(): RunningSession | undefined {
  const raw = store.getString(KEY);
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as RunningSession;
  } catch {
    return undefined;
  }
}

export function startSession(
  kindId: string,
  now: number = Date.now(),
): RunningSession {
  const session = {kindId, startedAt: now};
  store.set(KEY, JSON.stringify(session));
  notify();
  return session;
}

/** Whole seconds a session has run. */
export function sessionSeconds(
  session: RunningSession,
  now: number = Date.now(),
): number {
  return Math.max(0, Math.floor((now - session.startedAt) / 1000));
}

/**
 * Stop the running session and log it, dated when it began. Returns the
 * entry, or undefined when nothing ran or it ran under a minute.
 */
export function stopSession(
  now: number = Date.now(),
): TrainingLogEntry | undefined {
  const session = getRunningSession();
  if (!session) {
    return undefined;
  }
  store.delete(KEY);
  notify();
  const seconds = sessionSeconds(session, now);
  if (seconds < MIN_SESSION_SECONDS) {
    return undefined;
  }
  const kind = getMetric(session.kindId);
  return addEntry({
    at: session.startedAt,
    kindId: session.kindId,
    value: seconds,
    ...(kind && kind.element !== 'any' ? {element: kind.element} : {}),
  });
}

/** Stop without logging. */
export function discardSession(): void {
  store.delete(KEY);
  notify();
}
