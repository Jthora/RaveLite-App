/**
 * Push-ups today — every rep toward the day's 200.
 *
 * Counts Daily Sets push-ups and variants (from rounds, "+ set" and drill
 * taps that count as a set), max tests, and push-up tests from the Train
 * log. Standard push-ups, the tested kind, are counted apart from the
 * variants; incline push-ups on the Push track count as standard.
 */
import type {ActivityItem} from '../activity/activity';
import type {DayPrescription, TrackId} from './types';

export const PUSHUP_GOAL = 200;

const STANDARD_TRACK: TrackId = 'push';
const VARIANT_TRACK: TrackId = 'push-variants';
/** Train log kinds whose value is a count of standard push-ups. */
const STANDARD_KINDS: ReadonlySet<string> = new Set([
  'builtin.pushups-amrap',
  'builtin.pushups-1min',
  'builtin.pushups-2min',
]);

export interface PushupDay {
  total: number;
  standard: number;
  variants: number;
  /** The biggest single set or test of standard push-ups today. */
  bestSet: number;
  /** What today's Push and Variants sets add up to. */
  planned: number;
}

export function pushupDay(
  items: readonly ActivityItem[],
  prescriptions: readonly DayPrescription[],
): PushupDay {
  let standard = 0;
  let variants = 0;
  let bestSet = 0;
  for (const item of items) {
    const amount = item.amount ?? 0;
    if (amount <= 0) {
      continue;
    }
    if (
      item.trackId === STANDARD_TRACK ||
      (item.kindId !== undefined && STANDARD_KINDS.has(item.kindId))
    ) {
      standard += amount;
      bestSet = Math.max(bestSet, amount);
    } else if (item.trackId === VARIANT_TRACK) {
      variants += amount;
    }
  }
  const planned = prescriptions
    .filter(p => p.trackId === STANDARD_TRACK || p.trackId === VARIANT_TRACK)
    .reduce((sum, p) => sum + p.setSize * p.sets, 0);
  return {total: standard + variants, standard, variants, bestSet, planned};
}
