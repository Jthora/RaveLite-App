import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {localDayKey} from '../training/grading';

/**
 * Which days were rest, written down as they happen.
 *
 * A mode, an injury or a day My day is switched off is the app's own
 * instruction to do less. The ramp, the streak and attribute decay all
 * read days after the fact, and asking "is a mode on now?" the morning
 * after a festival reads the festival as quitting. So each day is marked
 * while it is rest, and anything reading the past asks this log instead.
 *
 * Only ever added to: a day that was rest stays rest, even if the mode is
 * ended early. Erring toward mercy costs a day's judgement; erring the
 * other way cost people sets they had earned.
 */

export type RestReason =
  | 'rest'
  | 'festival'
  | 'travelling'
  | 'injured'
  | 'day-off';

/** Days kept: longer than any window that reads them. */
const KEEP_DAYS = 60;
const DAY_MS = 86_400_000;

type RestLog = Record<string, RestReason[]>;

function load(): RestLog {
  const raw = store.getString(KEYS.restDays);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as RestLog;
  } catch {
    return {};
  }
}

export function restReasons(day: string): readonly RestReason[] {
  return load()[day] ?? [];
}

export function isRestDay(day: string): boolean {
  return restReasons(day).length > 0;
}

/** Every rest day on record, for readers that walk many days at once. */
export function restDaySet(): Set<string> {
  return new Set(Object.keys(load()));
}

/** Mark every local day from `from` to `to` (epoch ms, inclusive). */
export function markRest(reason: RestReason, from: number, to: number): void {
  const log = load();
  let changed = false;
  const start = Math.max(from, to - KEEP_DAYS * DAY_MS);
  const cursor = new Date(start);
  cursor.setHours(12, 0, 0, 0);
  const last = localDayKey(to);
  for (let day = localDayKey(start); day <= last; ) {
    const reasons = log[day] ?? [];
    if (!reasons.includes(reason)) {
      log[day] = [...reasons, reason];
      changed = true;
    }
    cursor.setDate(cursor.getDate() + 1);
    day = localDayKey(cursor.getTime());
  }
  if (!changed) {
    return;
  }
  const kept = Object.keys(log).sort().slice(-KEEP_DAYS);
  store.set(
    KEYS.restDays,
    JSON.stringify(Object.fromEntries(kept.map(k => [k, log[k]]))),
  );
}
