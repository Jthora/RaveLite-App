import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {ActiveHours, DEFAULT_ACTIVE_HOURS} from './types';

/**
 * Active hours — the operator's "My day" window — plus the paging rule.
 *
 * My day is the single window everything keys off: chimes page only inside
 * it, Daily Sets rounds spread across it, and the screen dims for the night
 * outside it. Saving it notifies subscribers so schedules and the screen
 * follow straight away.
 *
 * See `docs/always-on-screen/initial-development/01-requirements/active-hours.md`.
 */

const HHMM_RE = /^(\d{2}):(\d{2})$/;

/** Parse "HH:MM" into minutes-since-midnight. Throws if malformed. */
function parseHHMM(value: string): number {
  const m = HHMM_RE.exec(value);
  if (!m) {
    throw new Error(`Invalid HH:MM string: ${value}`);
  }
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Out-of-range HH:MM: ${value}`);
  }
  return hours * 60 + minutes;
}

/**
 * Convert a `Date` to "minutes since local midnight" using the host
 * timezone. The active-hours config is operator-local by definition.
 */
function localMinutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * 0 = Monday ... 6 = Sunday. Aligns with `ActiveHours.daysMask` bit
 * order (bit 0 = Monday).
 */
function localDayOfWeekMonFirst(d: Date): number {
  // JS getDay(): 0 = Sunday ... 6 = Saturday. Shift to Mon-first.
  const sundayFirst = d.getDay();
  return (sundayFirst + 6) % 7;
}

/** Whether the day-of-week of `d` is enabled in the mask. */
function dayEnabled(d: Date, daysMask: number): boolean {
  const dow = localDayOfWeekMonFirst(d);
  return (daysMask & (1 << dow)) !== 0;
}

/**
 * Whether `now` falls inside the operator's active-hours window.
 *
 * Handles three cases:
 * - Forward window (start < end), e.g. 09:00–23:00 — same calendar day.
 * - Wrapped window (start > end), e.g. 22:00–02:00 — spans midnight.
 *   The `daysMask` is checked against the *start* of the window, not
 *   the moment `now` sits in. Practically: a wrapped window enabled
 *   for Monday includes Mon-22:00 through Tue-02:00.
 * - Identity window (start == end) — degenerate; always inactive.
 *
 * Returns `false` if the day-of-week is masked off.
 */
export function withinActiveHours(now: Date, config: ActiveHours): boolean {
  if (config.daysMask === 0) {
    return false;
  }
  const startMin = parseHHMM(config.start);
  const endMin = parseHHMM(config.end);
  const nowMin = localMinutesOfDay(now);

  if (startMin === endMin) {
    return false;
  }

  if (startMin < endMin) {
    // Forward window — single calendar day.
    return (
      dayEnabled(now, config.daysMask) && nowMin >= startMin && nowMin < endMin
    );
  }

  // Wrapped window — spans midnight. We're inside if either:
  //   (a) now is at-or-after start, on a day enabled by the mask, OR
  //   (b) now is before end, on a day whose *previous* day is enabled.
  if (nowMin >= startMin) {
    return dayEnabled(now, config.daysMask);
  }
  if (nowMin < endMin) {
    const yesterday = new Date(now.getTime());
    yesterday.setDate(yesterday.getDate() - 1);
    return dayEnabled(yesterday, config.daysMask);
  }
  return false;
}

/** Whether My day runs on `date`'s weekday at all. */
export function myDayRunsOn(
  date: Date,
  config: ActiveHours = getActiveHours(),
): boolean {
  return dayEnabled(date, config.daysMask);
}

/** Read the operator's active-hours config; default if unset/invalid. */
export function getActiveHours(): ActiveHours {
  const raw = store.getString(KEYS.activeHours);
  if (!raw) {
    return DEFAULT_ACTIVE_HOURS;
  }
  try {
    const parsed = JSON.parse(raw) as ActiveHours;
    // Validate the shape; on any failure, fall back to default.
    parseHHMM(parsed.start);
    parseHHMM(parsed.end);
    if (typeof parsed.daysMask !== 'number') {
      return DEFAULT_ACTIVE_HOURS;
    }
    return parsed;
  } catch {
    return DEFAULT_ACTIVE_HOURS;
  }
}

type ActiveHoursListener = (next: ActiveHours) => void;
const listeners = new Set<ActiveHoursListener>();

/** Fires after My day is saved. Returns an unsubscribe function. */
export function subscribeActiveHours(
  listener: ActiveHoursListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Persist the operator's active-hours config. Validates before write. */
export function setActiveHours(next: ActiveHours): void {
  parseHHMM(next.start);
  parseHHMM(next.end);
  if (typeof next.daysMask !== 'number') {
    throw new Error('daysMask must be a number');
  }
  store.set(KEYS.activeHours, JSON.stringify(next));
  for (const listener of listeners) {
    try {
      listener(next);
    } catch (e) {
      console.warn('[activeHours] listener threw', e);
    }
  }
}

/**
 * Whether the operator currently has a manual pause in effect.
 * Auto-clears expired pauses as a side effect.
 */
export function isManuallyPaused(now: Date = new Date()): boolean {
  const raw = store.getString(KEYS.manualPauseUntil);
  if (!raw) {
    return false;
  }
  const until = Number(raw);
  if (!Number.isFinite(until)) {
    store.delete(KEYS.manualPauseUntil);
    return false;
  }
  if (until <= now.getTime()) {
    store.delete(KEYS.manualPauseUntil);
    return false;
  }
  return true;
}

/** Current manual-pause end (epoch ms), without clearing an expired one. */
export function readPauseUntil(): number | undefined {
  const raw = store.getString(KEYS.manualPauseUntil);
  const until = raw ? Number(raw) : NaN;
  return Number.isFinite(until) ? until : undefined;
}

/**
 * Pure paging decision for any instant — no storage reads or writes.
 * Planners use this to ask about *future* times (e.g. backup chimes)
 * without `isManuallyPaused`'s side effect of clearing the pause key.
 */
export function pagingAllowedAtPure(
  ts: number,
  config: ActiveHours,
  pauseUntil?: number,
): null | 'outside-active-hours' | 'manual-pause' {
  if (pauseUntil !== undefined && ts < pauseUntil) {
    return 'manual-pause';
  }
  if (!withinActiveHours(new Date(ts), config)) {
    return 'outside-active-hours';
  }
  return null;
}

/**
 * High-level decision: is the surface allowed to page right now?
 * Returns the suppression reason if not, or `null` if it may page.
 * Clears an expired manual pause as a side effect.
 */
export function pagingAllowedAt(
  now: Date = new Date(),
  config: ActiveHours = getActiveHours(),
): null | 'outside-active-hours' | 'manual-pause' {
  isManuallyPaused(now);
  return pagingAllowedAtPure(now.getTime(), config, readPauseUntil());
}
