/**
 * Pass 4: day one thousand. The app has only ever been used by somebody
 * with eleven weeks of data. This is five years of it — about 27,000
 * logged things — and the rule is that opening the app costs a day, not
 * a life.
 *
 * The budgets are ratios against the work a full scan would do, fastest
 * of several interleaved trials, so a busy machine cannot fail them.
 */
import {setsToday} from '../../ambient/setScheduler';
import {entriesForDay, entriesInRange} from '../../journal/journal';
import {
  __resetProfileCache,
  authorProfile,
  hasAnyHistory,
  saveProfile,
} from '../../profile/repository';
import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {activityForDay, buildActivity} from '../activity';
import {streakDays} from '../stats';

const YEARS = 5;
const PER_DAY = 15;
const NOW = new Date(2026, 8, 14, 18);
const DAY_MS = 86_400_000;

/** Five years of training, written the way the app writes it. */
function aLongLife(): number {
  let written = 0;
  for (let back = 0; back < YEARS * 365; back++) {
    const day = new Date(NOW.getTime() - back * DAY_MS);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(day.getDate()).padStart(2, '0')}`;
    for (let i = 0; i < PER_DAY; i++) {
      store.set(
        `${KEYS.journalPrefix}${key}.${i}`,
        JSON.stringify({
          id: `${key}.${i}`,
          kind: 'completion',
          at: day.getTime() - i * 60_000,
          exerciseId: 'fire.pushups',
          element: 'fire',
          source: 'manual',
          trackId: 'push',
          amount: 10,
        }),
      );
      written++;
    }
  }
  return written;
}

/** Fastest of `trials` runs, so another process cannot fail this. */
function fastest(trials: number, run: () => void): number {
  let best = Infinity;
  for (let i = 0; i < trials; i++) {
    const at = performance.now();
    run();
    best = Math.min(best, performance.now() - at);
  }
  return best;
}

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
  saveProfile(authorProfile());
});

it('opens on a life of five years without reading all of it', () => {
  const written = aLongLife();
  expect(written).toBe(YEARS * 365 * PER_DAY);

  // What a full scan costs: every entry parsed, which is what the day
  // list must never do.
  const all = () =>
    buildActivity({
      journal: entriesInRange(
        new Date(NOW.getTime() - YEARS * 365 * DAY_MS),
        NOW,
      ),
      train: [],
    });

  const day = fastest(5, () => activityForDay(NOW));
  const scan = fastest(2, all);
  expect(activityForDay(NOW)).toHaveLength(PER_DAY);
  // A day is a day's work, not a life's: an order of magnitude apart.
  expect(scan / Math.max(day, 0.01)).toBeGreaterThan(10);

  // The streak reads its lookback, not the whole log.
  const streak = fastest(3, () => streakDays(NOW));
  expect(scan / Math.max(streak, 0.01)).toBeGreaterThan(5);

  // And the question Today asks first is instant either way.
  expect(hasAnyHistory()).toBe(true);
  const history = fastest(5, () => hasAnyHistory());
  expect(scan / Math.max(history, 0.01)).toBeGreaterThan(10);
});

it('builds today on a life of five years', () => {
  aLongLife();
  const today = fastest(3, () => setsToday(NOW.getTime()));
  const scan = fastest(2, () =>
    buildActivity({
      journal: entriesInRange(
        new Date(NOW.getTime() - YEARS * 365 * DAY_MS),
        NOW,
      ),
      train: [],
    }),
  );
  expect(setsToday(NOW.getTime()).fires.length).toBeGreaterThan(0);
  // Rounds read the week behind them, not the years.
  expect(scan / Math.max(today, 0.01)).toBeGreaterThan(3);
  // And the day it reads is the right one.
  expect(entriesForDay(NOW)).toHaveLength(PER_DAY);
});
