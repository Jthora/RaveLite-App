import {store} from '../../../storage';
import {append} from '../../journal/journal';
import {
  __resetProfileCache,
  authorProfile,
  finishSetup,
  saveProfile,
} from '../../profile/repository';
import {summarizeSets} from '../../program/setsSummary';
import {doneByTrack} from '../../program/progress';
import {entriesForDay} from '../../journal/journal';
import {movesOf} from '../../program/rounds';
import * as runtime from '../pulseRuntime';
import {__test as setSchedulerTest, setsToday} from '../setScheduler';

// Monday 14 Sep 2026.
const at = (h: number, m = 0) => new Date(2026, 8, 14, h, m).getTime();

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
  runtime.__test.reset();
  setSchedulerTest.reset();
  saveProfile(authorProfile());
});

const owedOf = (now: number) => {
  const today = setsToday(now);
  return summarizeSets(
    today.prescriptions,
    doneByTrack(entriesForDay(new Date(now))),
    today.released,
  );
};

it('lets a skipped round go, instead of rolling it into later rounds', () => {
  const morning = setsToday(at(4));
  const first = morning.fires[0];
  const before = owedOf(at(4)).total;
  const later = (now: number) =>
    setsToday(now)
      .upcoming.flatMap(f => movesOf(f.prescription))
      .reduce((sum, m) => sum + m.amount, 0);
  const laterBefore = later(first.ts + 60_000);

  append({
    kind: 'reminder.skipped',
    at: first.ts,
    pulseId: first.id,
    respondedAfterMs: 1000,
  });

  // The day's total shrinks by the skipped round, so it can still be finished.
  const skippedSets = movesOf(first.prescription).length;
  expect(owedOf(first.ts + 60_000).total).toBe(before - skippedSets);
  // And nothing more is asked of the rounds still to come.
  expect(later(first.ts + 60_000)).toBeLessThanOrEqual(laterBefore);
});

it('lets a round that never sounded go too', () => {
  const first = setsToday(at(4)).fires[0];
  const before = owedOf(at(4)).total;
  append({
    kind: 'reminder.suppressed',
    at: first.ts,
    pulseId: first.id,
    reason: 'manual-pause',
  });
  expect(owedOf(first.ts + 60_000).total).toBeLessThan(before);
});

it('starts the day of setup at setup: Round 1, and nothing owed from before', () => {
  const all = setsToday(at(4)).fires;
  const wholeDay = owedOf(at(4)).total;
  finishSetup(at(14));
  const today = setsToday(at(14, 1));
  expect(today.fires.every(f => f.ts >= at(14))).toBe(true);
  expect(today.fires.length).toBeLessThan(all.length);
  expect(today.fires[0].prescription).toMatchObject({
    roundIndex: 1,
    rounds: today.fires.length,
  });
  // The sets of the rounds before setup are not owed.
  expect(owedOf(at(14, 1)).total).toBeLessThan(wholeDay);
});
