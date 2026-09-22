/**
 * Density scales the ask; the ramp reads the share done. So a month of
 * changing day shapes — a desk day, then a shift, then a weekend — must
 * leave the ladder exactly where a month of steady days does. Anyone
 * whose weeks are not all alike would otherwise be held back for it.
 */
import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {append} from '../../journal/journal';
import {
  __resetProfileCache,
  authorProfile,
  saveProfile,
  setShape,
} from '../../profile/repository';
import type {DayShapeId} from '../types';
import {
  defaultProgram,
  loadProgram,
  prescriptionsFor,
  recordPrescribed,
  reviewProgram,
} from '../repository';
import {TRACKS} from '../tracks';

// Four weeks from Monday 7 Sep 2026.
const DAYS = 28;
const noon = (i: number) => new Date(2026, 8, 7 + i, 12);
const dayKey = (i: number) =>
  `${noon(i).getFullYear()}-${String(noon(i).getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(noon(i).getDate()).padStart(2, '0')}`;

/** A month of days, each one done in full, under `shapeOn`. */
function aMonth(shapeOn: (day: number) => DayShapeId) {
  store.clearAll();
  __resetProfileCache();
  saveProfile(authorProfile());
  store.set(KEYS.programState, JSON.stringify(defaultProgram(noon(0))));
  for (let i = 0; i < DAYS; i++) {
    setShape(shapeOn(i));
    const asks = prescriptionsFor(loadProgram(noon(i)), noon(i));
    recordPrescribed(dayKey(i), asks);
    for (const ask of asks) {
      append({
        kind: 'completion',
        at: noon(i).getTime(),
        exerciseId: ask.exerciseId,
        element: ask.element,
        source: 'manual',
        trackId: ask.trackId,
        amount: ask.setSize * ask.sets,
      });
    }
    reviewProgram(noon(i + 1).getTime());
  }
  const program = loadProgram(noon(DAYS));
  return Object.fromEntries(
    TRACKS.map(t => [
      t.id,
      {sets: program.tracks[t.id].sets, rung: program.tracks[t.id].rung},
    ]),
  );
}

const SHAPES: DayShapeId[] = ['desk', 'office', 'shift', 'weekend'];

it('ends a month of mixed days exactly where a month of steady days ends', () => {
  const steady = aMonth(() => 'desk');
  const mixed = aMonth(day => SHAPES[day % SHAPES.length]);
  expect(mixed).toEqual(steady);
  // And the month did move the ladder, so this is not two stuck programs:
  // a fresh track has no sets of its own until a review gives it some.
  expect(defaultProgram(noon(0)).tracks.push.sets).toBeUndefined();
  expect(steady.push.sets).toBeGreaterThan(0);
});
