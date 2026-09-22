import {store} from '../../storage';
import {KEYS} from '../../storage/keys';

/**
 * A heartbeat, so the app can say when chimes did not sound.
 *
 * The chime runtime beats about once a minute while it runs. When it
 * starts again after a long silence — Android closed the app, the phone
 * froze it, it was restarted — the silence is written down as a gap.
 * Chimes due inside a gap never sounded: Today shows them as such, not as
 * missed, their sets are not held against the day, and Stay alive says
 * what happened instead of "all set".
 */

export interface Gap {
  from: number;
  to: number;
}

/** Beats are written at most this often. */
const BEAT_MS = 60_000;
/** Silence longer than this is a gap. */
export const GAP_MS = 10 * 60_000;
const KEEP_GAPS = 20;

let lastWritten = 0;
const listeners = new Set<(gap: Gap) => void>();

export function loadGaps(): Gap[] {
  const raw = store.getString(KEYS.ambientGaps);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as Gap[];
  } catch {
    return [];
  }
}

/** Gaps that overlap [from, to]. */
export function gapsBetween(from: number, to: number): Gap[] {
  return loadGaps().filter(g => g.to > from && g.from < to);
}

/** Whether `ts` fell inside a gap. */
export function inGap(ts: number, gaps: readonly Gap[]): boolean {
  return gaps.some(g => ts > g.from && ts < g.to);
}

/** Fires when a gap is found, on the first beat after it. */
export function onGap(listener: (gap: Gap) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The runtime is alive at `now`. Cheap to call every second. */
export function beat(now: number = Date.now()): void {
  if (now - lastWritten < BEAT_MS) {
    return;
  }
  lastWritten = now;
  const last = store.getNumber(KEYS.ambientHeartbeat);
  store.set(KEYS.ambientHeartbeat, now);
  if (typeof last !== 'number' || now - last <= GAP_MS) {
    return;
  }
  const gap: Gap = {from: last, to: now};
  store.set(
    KEYS.ambientGaps,
    JSON.stringify([...loadGaps(), gap].slice(-KEEP_GAPS)),
  );
  for (const listener of listeners) {
    try {
      listener(gap);
    } catch (e) {
      console.warn('[heartbeat] gap listener threw', e);
    }
  }
}

/** Only for tests. */
export function __resetHeartbeat(): void {
  lastWritten = 0;
  listeners.clear();
}
