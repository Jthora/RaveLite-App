/**
 * The point of this file is that the long tail gets a turn. Burpees sat
 * at rank 27 of 67 reachable Fire drills and never moved, because
 * ranking is deterministic and nothing counted having been *shown* —
 * only having been completed. So these tests check the thing that was
 * actually broken: does a drill the app has already offered sink, and
 * does it come back.
 */
import {beforeEach, describe, expect, it} from '@jest/globals';

import {
  __resetShown,
  noteShown,
  noteSwapped,
  shownPenalties,
  shownPenalty,
  SHOWN_WINDOW_DAYS,
} from '../shown';
import {rankDrillsFor} from '../scoring';
import {AUTHOR_FACTS} from '../../profile/kit';
import {store} from '../../../storage';

const NOW = new Date(2026, 9, 7, 14, 0).getTime();
const DAY = 86_400_000;

beforeEach(() => {
  store.clearAll();
  __resetShown();
});

const fire = (now: number) =>
  rankDrillsFor({
    element: 'fire',
    facts: AUTHOR_FACTS,
    loggedTodayIds: new Set<string>(),
    hour: 14,
    preferredTargets: [],
    shownPenalties: shownPenalties(now),
  }).map(r => r.exercise.id);

describe('a drill that was offered', () => {
  it('sinks, and is not simply hidden', () => {
    const before = fire(NOW);
    const top = before[0];

    noteShown(top, NOW);
    const after = fire(NOW);

    expect(after.indexOf(top)).toBeGreaterThan(before.indexOf(top));
    // Still reachable: this is variety pressure, not a blocklist.
    expect(after).toContain(top);
    expect(after.length).toBe(before.length);
  });

  it('sinks further when it was swapped past than when it was only seen', () => {
    const top = fire(NOW)[0];

    noteShown(top, NOW);
    const seen = shownPenalty(top, NOW);
    noteSwapped(top, NOW);
    const swapped = shownPenalty(top, NOW);

    expect(swapped).toBeGreaterThan(seen);
  });

  it('climbs back out once the window has passed', () => {
    const before = fire(NOW);
    const top = before[0];
    noteShown(top, NOW);

    const later = NOW + (SHOWN_WINDOW_DAYS + 1) * DAY;
    expect(shownPenalty(top, later)).toBe(0);
    expect(fire(later)[0]).toBe(top);
  });

  it('fades rather than snapping back', () => {
    const top = fire(NOW)[0];
    noteShown(top, NOW);
    const fresh = shownPenalty(top, NOW);
    const halfway = shownPenalty(top, NOW + (SHOWN_WINDOW_DAYS / 2) * DAY);
    expect(halfway).toBeLessThan(fresh);
    expect(halfway).toBeGreaterThan(0);
  });
});

describe('the pool actually rotates', () => {
  it('reaches well beyond the top handful over a fortnight', () => {
    // One pick a day, each one remembered. Without this module the same
    // drill is offered every single day; the count below was 1.
    const seen = new Set<string>();
    for (let day = 0; day < 14; day++) {
      const now = NOW + day * DAY;
      const pick = fire(now)[0];
      seen.add(pick);
      noteShown(pick, now);
    }
    // Twelve to fourteen in practice. Not sixty-seven, and it should not
    // be: the top of the list is there on merit. The failure being fixed
    // is that this number was 1.
    expect(seen.size).toBeGreaterThan(10);
  });
});

describe('the store', () => {
  it('prunes marks older than the window', () => {
    noteShown('fire.burpee', NOW - (SHOWN_WINDOW_DAYS + 2) * DAY);
    // Any write prunes; this one also proves an old mark does not count.
    noteShown('fire.jump-squats', NOW);
    expect(shownPenalties(NOW).has('fire.burpee')).toBe(false);
    expect(shownPenalties(NOW).has('fire.jump-squats')).toBe(true);
  });

  it('survives a corrupt blob without taking the app with it', () => {
    store.set('exercises.shown', '{not json');
    expect(() => shownPenalties(NOW)).not.toThrow();
    expect(shownPenalties(NOW).size).toBe(0);
  });

  it('does not let a re-render downgrade a swap to a glance', () => {
    noteSwapped('fire.burpee', NOW);
    const swapped = shownPenalty('fire.burpee', NOW);
    noteShown('fire.burpee', NOW);
    expect(shownPenalty('fire.burpee', NOW)).toBe(swapped);
  });
});
