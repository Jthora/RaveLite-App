import type {MoveId} from '../exercises/moves';
import {SESSION_KIND_IDS} from '../training/session';
import {EXERCISE_LIBRARY} from '../exercises/library';
import type {ActivityItem} from './activity';

/**
 * Active minutes — how much of the day went to moving, toward 2.5 hours.
 *
 * Sessions and runs from the Train log count in full; drills, sets and
 * partners count their time. Water, eye breaks, breathing, stillness and
 * check-ins don't: they matter, but they aren't movement. (A tai chi
 * session still counts: it's a session.)
 */

/** The ideal day: two and a half hours. */
export const ACTIVE_GOAL_MINUTES = 150;
/** Enough, on a busy day, to keep losing weight and staying fit. */
export const ACTIVE_FLOOR_MINUTES = 45;

const STILL_MOVES: ReadonlySet<MoveId> = new Set<MoveId>([
  'breath',
  'drink',
  'fuel',
  'presence',
  'intent',
  'evening',
  'pulse',
]);

const SESSIONS: ReadonlySet<string> = new Set(SESSION_KIND_IDS);

/** Seconds of movement an item adds to the day. */
export function activeSeconds(item: ActivityItem): number {
  const seconds = item.seconds ?? 0;
  if (seconds <= 0) {
    return 0;
  }
  if (item.kindId && SESSIONS.has(item.kindId)) {
    return seconds;
  }
  if (item.hydration || (item.move && STILL_MOVES.has(item.move))) {
    return 0;
  }
  return seconds;
}

/** Whole minutes of movement across `items`. */
export function activeMinutes(items: readonly ActivityItem[]): number {
  return Math.round(
    items.reduce((sum, item) => sum + activeSeconds(item), 0) / 60,
  );
}

const EXERCISES = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));
const exerciseById = (id: string) => EXERCISES.get(id);

/** Venues that put you out in the weather. */
const OUTDOOR = new Set(['yard', 'porch', 'neighborhood']);

/**
 * Minutes spent outside today, as far as the log can tell: drills whose
 * venues are all outdoors, plus runs and rucks. It decides how much of a
 * hot day actually costs you water (see `conditions/heatWater.ts`).
 */
export function outdoorMinutes(items: readonly ActivityItem[]): number {
  let seconds = 0;
  for (const item of items) {
    const drill = item.exerciseId ? exerciseById(item.exerciseId) : undefined;
    const outdoorOnly =
      drill !== undefined && drill.venues.every(v => OUTDOOR.has(v));
    const isRun = item.kindId
      ? [
          'builtin.run-3mi',
          'builtin.run-2mi',
          'builtin.run-1.5mi',
          'builtin.run-custom',
          'builtin.ruck',
          'builtin.walk-session',
          'builtin.bike-ride',
        ].includes(item.kindId)
      : false;
    if (outdoorOnly || isRun) {
      seconds += item.seconds ?? 0;
    }
  }
  return Math.round(seconds / 60);
}
