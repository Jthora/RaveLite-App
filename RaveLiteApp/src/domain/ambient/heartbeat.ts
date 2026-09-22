import {store} from '../../storage';
import {KEYS} from '../../storage/keys';

/**
 * A heartbeat, so the app can say when chimes did not sound.
 *
 * The chime runtime beats about once a minute while it runs. When it
 * starts again after a long silence — Android closed the app, the phone
 * froze it, it was restarted — the silence is written down as a gap.
 * A chime due inside a gap sounded only if the OS held a backup for it
 * (`backupScheduler`), and those do fire with the app closed. So a chime
 * with a backup is an ordinary chime — answered or missed — and only one
 * without is shown as never sounded, with its sets let go. Stay alive says
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

const BACKUP_KEEP_MS = 2 * 86_400_000;

function loadBackups(): Record<string, number> {
  const raw = store.getString(KEYS.ambientBackups);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

/**
 * Remember the backups the OS holds. Kept for two days, and added to
 * rather than replaced: after a gap, the backups that fired inside it are
 * gone from the OS, and this is the only record they existed.
 */
export function rememberBackups(
  held: ReadonlyMap<string, number>,
  now: number = Date.now(),
): void {
  const before = loadBackups();
  const next: Record<string, number> = {};
  for (const [id, at] of Object.entries(before)) {
    if (at > now - BACKUP_KEEP_MS) {
      next[id] = at;
    }
  }
  for (const [id, at] of held) {
    next[id] = at;
  }
  if (JSON.stringify(next) !== JSON.stringify(before)) {
    store.set(KEYS.ambientBackups, JSON.stringify(next));
  }
}

/** Chimes the OS held a backup for: they could sound with the app closed. */
export function backedUpIds(): ReadonlySet<string> {
  return new Set(Object.keys(loadBackups()));
}

/** Only for tests. */
export function __resetHeartbeat(): void {
  lastWritten = 0;
  listeners.clear();
}
