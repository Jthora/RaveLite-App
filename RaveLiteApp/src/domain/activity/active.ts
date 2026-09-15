import type {MoveId} from '../exercises/moves';
import {SESSION_KIND_IDS} from '../training/session';
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
