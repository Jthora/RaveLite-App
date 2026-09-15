import type {StandardEvent, StandardResult} from './standards';

/**
 * Projected dates — pure. When a goal's straight-line trend through recent
 * tests reaches its target.
 *
 * It stays honest: it needs two tests at least a week apart, reads only
 * the last four months, and says "not on pace yet" rather than promising a
 * date more than three years out or from a trend going the wrong way.
 * Progress usually slows near the top, so a date is a guide, not a promise.
 */

export const PROJECTION_WINDOW_DAYS = 120;
export const MIN_SPAN_DAYS = 7;
export const MAX_PROJECTION_DAYS = 3 * 365;
const DAY_MS = 86_400_000;

export type Projection =
  /** A test already reached the target. */
  | {kind: 'reached'}
  /** The trend reaches the target around `at`. */
  | {kind: 'on-pace'; at: number}
  /** The trend is at the target, but no test has reached it yet. */
  | {kind: 'close'}
  /** Improving too slowly, or not improving. */
  | {kind: 'not-yet'}
  /** Too few recent tests, or too close together. */
  | {kind: 'need-more'};

const mean = (xs: readonly number[]) =>
  xs.reduce((sum, x) => sum + x, 0) / xs.length;

/** Where `results` (oldest first) are heading against `target`. */
export function projectGoal(
  event: StandardEvent,
  results: readonly StandardResult[],
  target: number,
  now: number,
): Projection {
  const meets = (value: number) =>
    event.better === 'higher' ? value >= target : value <= target;
  if (results.some(r => meets(r.value))) {
    return {kind: 'reached'};
  }
  const recent = results.filter(
    r => r.at >= now - PROJECTION_WINDOW_DAYS * DAY_MS && r.at <= now,
  );
  if (
    recent.length < 2 ||
    recent[recent.length - 1].at - recent[0].at < MIN_SPAN_DAYS * DAY_MS
  ) {
    return {kind: 'need-more'};
  }

  // Least squares through (days from now, value).
  const xs = recent.map(r => (r.at - now) / DAY_MS);
  const ys = recent.map(r => r.value);
  const mx = mean(xs);
  const my = mean(ys);
  const sxx = xs.reduce((sum, x) => sum + (x - mx) ** 2, 0);
  const sxy = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0);
  const slope = sxy / sxx;
  const improving = event.better === 'higher' ? slope > 0 : slope < 0;
  if (!improving) {
    return {kind: 'not-yet'};
  }
  const trendNow = my - slope * mx;
  const days = (target - trendNow) / slope;
  if (days <= 0) {
    return {kind: 'close'};
  }
  if (days > MAX_PROJECTION_DAYS) {
    return {kind: 'not-yet'};
  }
  return {kind: 'on-pace', at: now + days * DAY_MS};
}
