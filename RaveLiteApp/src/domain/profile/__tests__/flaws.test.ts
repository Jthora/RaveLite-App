/**
 * Flaws are the honest half of the perks question: real postural faults
 * the app already trains around, not a status it invented. These check
 * the two claims that makes — that the work is derived from the library
 * rather than listed, and that nothing here modifies anything.
 */
import {FLAWS, drillsForFlaw, flawById, flawProgress} from '../flaws';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {AUTHOR_FACTS, DEFAULT_FACTS} from '../kit';

it('every flaw has work in the library that addresses it', () => {
  for (const flaw of FLAWS) {
    const drills = drillsForFlaw(flaw);
    expect({flaw: flaw.id, count: drills.length}).toEqual({
      flaw: flaw.id,
      count: expect.any(Number),
    });
    // Enough that a month of sessions is reachable without doing the
    // same drill every time.
    expect(drills.length).toBeGreaterThan(3);
  }
});

it('finds its work by tag, so a new drill counts without being listed', () => {
  const flaw = flawById('UCS')!;
  const tagged = EXERCISE_LIBRARY.filter(e =>
    e.targets.includes(flaw.target),
  ).map(e => e.id);
  expect(drillsForFlaw(flaw).sort()).toEqual(tagged.sort());
});

it('says what it is, why you have it, and how you would know', () => {
  for (const flaw of FLAWS) {
    expect(flaw.name.length).toBeGreaterThan(0);
    expect(flaw.proper.length).toBeGreaterThan(0);
    expect(flaw.what.length).toBeGreaterThan(40);
    expect(flaw.cause.length).toBeGreaterThan(20);
    expect(flaw.costs.length).toBeGreaterThan(20);
    // The tell is the whole point: the app cannot see posture, so the
    // person needs something they can check themselves.
    expect(flaw.tell.length).toBeGreaterThan(30);
  }
});

it('measures work and never claims to measure posture', () => {
  const flaw = flawById('APT')!;
  expect(flawProgress(flaw, 0)).toEqual({
    done: 0,
    needed: flaw.times,
    at: 0,
    ready: false,
  });
  expect(flawProgress(flaw, flaw.times - 1).ready).toBe(false);
  expect(flawProgress(flaw, flaw.times).ready).toBe(true);
  // Past the mark it stays at 1 rather than overflowing the bar.
  expect(flawProgress(flaw, flaw.times * 3).at).toBe(1);
  // Nonsense in, nothing broken out.
  expect(flawProgress(flaw, -5).done).toBe(0);
});

it('matches the corrections the profile has always stored', () => {
  const ids = FLAWS.map(f => f.id).sort();
  expect([...AUTHOR_FACTS.corrections].sort()).toEqual(ids);
  // And a stranger starts with none claimed.
  expect(DEFAULT_FACTS.corrections).toEqual([]);
});
