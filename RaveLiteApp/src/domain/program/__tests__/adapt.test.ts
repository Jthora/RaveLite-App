import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {append} from '../../journal/journal';
import {reviewTrack, type DayWork} from '../adapt';
import {
  defaultProgram,
  prescriptionsFor,
  recordPrescribed,
  reviewProgram,
} from '../repository';
import {trackById} from '../tracks';
import type {TrackState} from '../types';

// Push: a base of 4 sets a day, at most 12.
const push = trackById('push');
const fresh: TrackState = {enabled: true, rung: 1, testMax: 20};

/** Training days asking `asked` each, done as given, oldest first. */
const days = (done: number[], asked = 40): DayWork[] =>
  done.map((amount, i) => ({
    day: `2026-10-${String(i + 1).padStart(2, '0')}`,
    prescribed: asked,
    done: amount,
  }));

const review = (
  state: TrackState,
  work: DayWork[],
  today = '2026-10-08',
  deload = false,
) => reviewTrack({track: push, state, days: work, today, deload});

it('starts at the week-1 base, then waits a week before moving', () => {
  const first = review(fresh, []);
  expect(first).toMatchObject({
    sets: 4,
    steppedOn: '2026-10-08',
    lastReview: {change: 'new', sets: 4},
  });
  const early = review(first, days([40, 40, 40, 40]), '2026-10-12');
  expect(early).toMatchObject({sets: 4, lastReview: {change: 'hold'}});
});

it('adds a set after a week at 85% or more', () => {
  const state = {...fresh, sets: 4, steppedOn: '2026-10-01'};
  const next = review(state, days([40, 36, 34, 40, 40, 38, 35]));
  expect(next).toMatchObject({
    sets: 5,
    steppedOn: '2026-10-08',
    lastReview: {change: 'up', sets: 5},
  });
  expect(next.lastReview?.ratio).toBeCloseTo(263 / 280);
});

it('holds between 60% and 85%, and eases off a set under 60%', () => {
  const state = {...fresh, sets: 6, steppedOn: '2026-10-01'};
  expect(review(state, days([30, 30, 30, 30, 30, 30, 30]))).toMatchObject({
    sets: 6,
    lastReview: {change: 'hold'},
  });
  expect(review(state, days([10, 20, 10, 20, 10, 20, 10]))).toMatchObject({
    sets: 5,
    lastReview: {change: 'down'},
  });
});

it('counts a day as done at most in full, so a big day cannot cover a missed one', () => {
  const state = {...fresh, sets: 6, steppedOn: '2026-10-01'};
  const next = review(state, days([120, 0, 40, 40, 40, 40, 0]));
  expect(next.lastReview?.ratio).toBeCloseTo(200 / 280);
  expect(next.sets).toBe(6);
});

it('never goes past the most sets, or under two', () => {
  const top = {...fresh, sets: 12, steppedOn: '2026-10-01'};
  expect(review(top, days([40, 40, 40, 40, 40, 40, 40]))).toMatchObject({
    sets: 12,
    lastReview: {change: 'top'},
  });
  const low = {...fresh, sets: 2, steppedOn: '2026-10-01'};
  expect(review(low, days([5, 0, 5, 0, 5, 5, 5])).sets).toBe(2);
});

it('holds through a deload week', () => {
  const state = {...fresh, sets: 6, steppedOn: '2026-10-01'};
  const all = days([40, 40, 40, 40, 40, 40, 40]);
  expect(review(state, all, '2026-10-08', true)).toMatchObject({
    sets: 6,
    lastReview: {change: 'deload'},
  });
});

it('a break brings the track back at 80%, then climbs back a set every three good days', () => {
  const state = {...fresh, sets: 10, steppedOn: '2026-09-20'};
  const cut = review(state, days([40, 40, 40, 40, 0, 0, 0]));
  expect(cut).toMatchObject({
    sets: 8,
    peakSets: 10,
    steppedOn: '2026-10-08',
    lastReview: {change: 'rebuild'},
  });
  // Still off the next day: no second cut within the week.
  expect(review(cut, days([40, 40, 40, 0, 0, 0, 0]), '2026-10-09').sets).toBe(
    8,
  );
  const back = review(cut, days([40, 40, 0, 0, 32, 32, 32], 32), '2026-10-11');
  expect(back).toMatchObject({sets: 9, peakSets: 10, steppedOn: '2026-10-11'});
  const home = review(
    back,
    days([0, 32, 32, 36, 36, 36, 36], 36),
    '2026-10-14',
  );
  expect(home.sets).toBe(10);
  expect(home.peakSets).toBeUndefined();
});

it('needs three training days before it judges', () => {
  const state = {...fresh, sets: 6, steppedOn: '2026-09-01'};
  expect(review(state, days([0, 0]))).toMatchObject({
    sets: 6,
    lastReview: {change: 'hold'},
  });
});

describe('the daily review over storage', () => {
  beforeEach(() => store.clearAll());

  it('reads a week of asks and sets done, moves the sets once a day, and says why', () => {
    // Started Monday 7 Sep 2026; push already at its base, stepped that day.
    const start = new Date(2026, 8, 7, 9);
    const program = defaultProgram(start);
    program.tracks.push = {
      ...program.tracks.push,
      sets: 4,
      steppedOn: '2026-09-07',
    };
    store.set(KEYS.programState, JSON.stringify(program));
    for (let i = 0; i < 7; i++) {
      const day = new Date(2026, 8, 7 + i, 12);
      const asks = prescriptionsFor(program, day);
      recordPrescribed(`2026-09-${String(7 + i).padStart(2, '0')}`, asks);
      const ask = asks.find(p => p.trackId === 'push')!;
      append({
        kind: 'completion',
        at: day.getTime(),
        exerciseId: ask.exerciseId,
        element: 'fire',
        source: 'manual',
        trackId: 'push',
        amount: ask.setSize * ask.sets,
      });
    }
    const monday = new Date(2026, 8, 14, 6).getTime();
    const reviewed = reviewProgram(monday);
    expect(reviewed.reviewedThrough).toBe('2026-09-13');
    expect(reviewed.tracks.push).toMatchObject({
      sets: 5,
      steppedOn: '2026-09-14',
      lastReview: {change: 'up', ratio: 1, sets: 5},
    });
    // Nothing logged for rows all week: never reviewed before, so it starts.
    expect(reviewed.tracks.row.lastReview).toMatchObject({change: 'new'});
    // A second look the same day changes nothing.
    expect(reviewProgram(monday + 3_600_000)).toEqual(reviewed);
  });
});
