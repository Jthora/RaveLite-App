import type {ElementId} from '../../theme/elements';
import {dayKey, entriesForDay} from '../journal/journal';
import {localDayKey} from '../training/grading';
import {loadEntries} from '../training/repository';
import {activityInRange, buildActivity, type ActivityItem} from './activity';

/** Streaks stop counting back after a year. */
const STREAK_LOOKBACK_DAYS = 365;
const MS_PER_DAY = 86_400_000;

export function emptyElementCounts(): Record<ElementId, number> {
  return {fire: 0, air: 0, earth: 0, water: 0, heart: 0};
}

export function countsByElement(
  items: readonly ActivityItem[],
): Record<ElementId, number> {
  const out = emptyElementCounts();
  for (const item of items) {
    out[item.element]++;
  }
  return out;
}

/** Effort points per element (see `POINTS` in activity.ts). */
export function pointsByElement(
  items: readonly ActivityItem[],
): Record<ElementId, number> {
  const out = emptyElementCounts();
  for (const item of items) {
    out[item.element] += item.points;
  }
  return out;
}

/** Glasses of water: water calls, the +1 counter, and ride-along glasses. */
export function hydrationGlasses(items: readonly ActivityItem[]): number {
  return items.filter(i => i.hydration).length;
}

/** Local midnight that starts the last `n` days ending on `now`'s day. */
export function windowStart(n: number, now: Date = new Date()): Date {
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (n - 1));
  return from;
}

/** Index of the day `at` falls on, counting from `from` (a local midnight). */
function dayIndex(at: number, from: Date): number {
  const day = new Date(at);
  day.setHours(0, 0, 0, 0);
  // Round so a 23 or 25 hour DST day still lands on its own index.
  return Math.round((day.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Activity counts per day for the last `n` days, oldest → newest. */
export function countsByDay(
  n: number,
  now: Date = new Date(),
  element?: ElementId,
): number[] {
  const from = windowStart(n, now);
  const out: number[] = new Array(n).fill(0);
  for (const item of activityInRange(from, now)) {
    if (element && item.element !== element) {
      continue;
    }
    const idx = dayIndex(item.at, from);
    if (idx >= 0 && idx < n) {
      out[idx]++;
    }
  }
  return out;
}

/**
 * Pure: per-element counts for the last `n` days, oldest → newest. Pass the
 * items of that window, e.g. `activityInRange(windowStart(n, now), now)`,
 * so a whole week costs one read.
 */
export function countsByElementByDay(
  items: readonly ActivityItem[],
  n: number,
  now: Date = new Date(),
): Record<ElementId, number[]> {
  return tallyByElementByDay(items, n, now, () => 1);
}

/** Pure: per-element effort points for the last `n` days, oldest → newest. */
export function pointsByElementByDay(
  items: readonly ActivityItem[],
  n: number,
  now: Date = new Date(),
): Record<ElementId, number[]> {
  return tallyByElementByDay(items, n, now, item => item.points);
}

function tallyByElementByDay(
  items: readonly ActivityItem[],
  n: number,
  now: Date,
  valueOf: (item: ActivityItem) => number,
): Record<ElementId, number[]> {
  const from = windowStart(n, now);
  const out = {} as Record<ElementId, number[]>;
  for (const id of Object.keys(emptyElementCounts()) as ElementId[]) {
    out[id] = new Array(n).fill(0);
  }
  for (const item of items) {
    const idx = dayIndex(item.at, from);
    if (idx >= 0 && idx < n) {
      out[item.element][idx] += valueOf(item);
    }
  }
  return out;
}

/** Consecutive days, ending today, with at least one thing done. */
export function streakDays(
  now: Date = new Date(),
  element?: ElementId,
): number {
  const matches = (item: ActivityItem) => !element || item.element === element;
  // The Train log is one array: index its days once, not per day.
  const trainDays = new Set(
    buildActivity({journal: [], train: loadEntries()})
      .filter(matches)
      .map(item => localDayKey(item.at)),
  );
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    const has =
      trainDays.has(dayKey(cursor)) ||
      buildActivity({journal: entriesForDay(cursor), train: []}).some(matches);
    if (!has) {
      break;
    }
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
