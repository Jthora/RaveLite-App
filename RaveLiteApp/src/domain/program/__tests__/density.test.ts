import {
  DAY_SHAPES,
  FULL_ROUNDS,
  densityFor,
  MIN_PAR,
  parFor,
  roundsFor,
  scaleSets,
} from '../density';
import {DAILY_PAR} from '../../activity/par';

it("leaves the author's day exactly as it was", () => {
  expect(roundsFor('desk')).toBe(FULL_ROUNDS);
  expect(densityFor('desk')).toBe(1);
  expect(scaleSets(4, densityFor('desk'))).toBe(4);
  expect(parFor(densityFor('desk'), DAILY_PAR)).toBe(DAILY_PAR);
});

it('asks a shorter day for less, in the same proportion', () => {
  expect(roundsFor('office')).toBe(6);
  expect(roundsFor('shift')).toBe(4);
  expect(roundsFor('weekend')).toBe(2);

  // A four-set track across the shapes.
  expect(scaleSets(4, densityFor('office'))).toBe(3);
  expect(scaleSets(4, densityFor('shift'))).toBe(2);
  expect(scaleSets(4, densityFor('weekend'))).toBe(1);
});

it('never asks for nothing', () => {
  for (const shape of DAY_SHAPES) {
    expect(scaleSets(1, densityFor(shape.id))).toBeGreaterThanOrEqual(1);
    expect(parFor(densityFor(shape.id), DAILY_PAR)).toBeGreaterThanOrEqual(
      MIN_PAR,
    );
  }
  expect(scaleSets(1, 0.01)).toBe(1);
});

it('keeps par above what the day already asks for anyway', () => {
  // Every track keeps at least one set, so the shortest day prescribes far
  // more than its density suggests. Par has to clear that, or Harmony
  // arrives just for doing as told.
  expect(parFor(densityFor('weekend'), DAILY_PAR)).toBe(MIN_PAR);
});

it('keeps par a round number, so Harmony stays reachable', () => {
  expect(parFor(densityFor('office'), 20)).toBe(15);
  expect(parFor(densityFor('shift'), 20)).toBe(10);
  expect(parFor(densityFor('weekend'), 20)).toBe(10);
});

it('a custom day is its own count, within reason', () => {
  expect(roundsFor('custom', 5)).toBe(5);
  expect(roundsFor('custom', 0)).toBe(1);
  expect(roundsFor('custom', 99)).toBe(FULL_ROUNDS);
  expect(roundsFor('custom')).toBe(FULL_ROUNDS);
});

it('every shape is a real day: fewer rounds than the last, and a name', () => {
  const rounds = DAY_SHAPES.map(s => s.rounds);
  expect(rounds).toEqual([...rounds].sort((a, b) => b - a));
  expect(new Set(rounds).size).toBe(rounds.length);
  for (const shape of DAY_SHAPES) {
    expect(shape.name.length).toBeGreaterThan(0);
    expect(shape.detail.length).toBeGreaterThan(10);
    expect(shape.rounds).toBeGreaterThanOrEqual(1);
    expect(shape.rounds).toBeLessThanOrEqual(FULL_ROUNDS);
  }
});
