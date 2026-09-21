/**
 * Density end to end: a shorter day must ask for less work, fewer chimes
 * and a lower par — and the author's desk day must not move at all.
 */
import {loadProgram, prescriptionsFor} from '../repository';
import {groupIntoRounds} from '../rounds';
import {
  __resetProfileCache,
  dailyPar,
  dayRounds,
  setShape,
} from '../../profile/repository';
import {DAILY_PAR} from '../../activity/par';
import {store} from '../../../storage';
import type {DayShapeId} from '../types';

// A Monday, well into a program so the tracks have earned some volume.
const MONDAY = new Date(2026, 8, 14);

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

function aDay(shape?: DayShapeId) {
  if (shape) {
    setShape(shape);
  }
  const program = loadProgram(MONDAY);
  const prescriptions = prescriptionsFor(program, MONDAY);
  return {
    sets: prescriptions.reduce((sum, p) => sum + p.sets, 0),
    tracks: prescriptions.length,
    rounds: groupIntoRounds(prescriptions, {rounds: dayRounds()}).length,
    par: dailyPar(),
  };
}

it('leaves an install that was never asked exactly where it was', () => {
  const untouched = aDay();
  const desk = aDay('desk');
  expect(desk).toEqual(untouched);
  expect(desk.par).toBe(DAILY_PAR);
  expect(dayRounds()).toBe(9);
});

it('shrinks the whole day together, not just one part of it', () => {
  const desk = aDay('desk');
  const office = aDay('office');
  const shift = aDay('shift');
  const weekend = aDay('weekend');

  // Par bottoms out at MIN_PAR, so the last two shapes share one; the
  // work and the chimes keep coming down regardless.
  expect(desk.par).toBeGreaterThan(office.par);
  expect(office.par).toBeGreaterThan(shift.par);

  for (const [shorter, longer] of [
    [office, desk],
    [shift, office],
    [weekend, shift],
  ]) {
    expect(shorter.sets).toBeLessThan(longer.sets);
    expect(shorter.rounds).toBeLessThanOrEqual(longer.rounds);
    expect(shorter.par).toBeLessThanOrEqual(longer.par);
  }
});

it('still asks for every track, and for real work, on the shortest day', () => {
  const desk = aDay('desk');
  const weekend = aDay('weekend');

  // A short day is a smaller day, not a narrower one: balance is the
  // point of the app, so no element may be dropped to save room.
  expect(weekend.tracks).toBe(desk.tracks);
  expect(weekend.sets).toBeGreaterThanOrEqual(weekend.tracks);
  expect(weekend.rounds).toBeGreaterThan(0);
});

it('hands back the full day the moment the day is full again', () => {
  const before = aDay('desk');
  aDay('weekend');
  const after = aDay('desk');

  // Density is applied when prescribing, never to the stored ladder, so a
  // stretch of short days costs nothing that was earned.
  expect(after).toEqual(before);
});
