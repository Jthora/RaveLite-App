import {EXERCISE_LIBRARY} from '../../exercises/library';
import {moveForExercise} from '../../exercises/moves';
import {newPlace, type Facts} from '../../profile/kit';
import {BASEMENT, canGoInside, indoorRoom} from '../adapt';

const firstOf = (move: string) =>
  EXERCISE_LIBRARY.find(
    d =>
      moveForExercise(d.id) === move &&
      d.venues.includes('yard') &&
      d.venues.some(v => v === 'standing' || v === 'mat' || v === 'house'),
  )!;

const facts = (kinds: Parameters<typeof newPlace>[0][]): Facts => ({
  kit: ['floor'],
  noise: 'normal',
  corrections: [],
  places: kinds.map(k => newPlace(k, [])),
});

it('keeps the basement for an install from before places were asked about', () => {
  expect(indoorRoom(facts(['room']), true)).toEqual(BASEMENT);
});

it('lets a jump inside a room with height, not a basement', () => {
  const jump = firstOf('jump');
  expect(canGoInside(jump, indoorRoom(facts(['room', 'yard']), false))).toBe(
    true,
  );
  expect(
    canGoInside(jump, indoorRoom(facts(['basement', 'yard']), false)),
  ).toBe(false);
});

it('never moves a run or a staff inside', () => {
  const room = indoorRoom(facts(['room']), false);
  for (const move of ['run', 'staff']) {
    const drill = EXERCISE_LIBRARY.find(d => moveForExercise(d.id) === move)!;
    expect([move, canGoInside(drill, room)]).toEqual([move, false]);
  }
});
