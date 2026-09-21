/**
 * The gap Phase 1 left: it taught the program to ask the room what it can
 * do, but every track still seeded one person's starting numbers. Three
 * pull-ups is not a beginner's starting point, it is a wall.
 */
import {
  DEFAULT_STARTING,
  STARTING_POINTS,
  seededMax,
  startingFactor,
} from '../starting';
import {__resetProfileCache, loadStarting} from '../repository';
import {chooseStarting} from '../setup';
import {loadProgram} from '../../program/repository';
import {TRACKS} from '../../program/tracks';
import {addEntry} from '../../training/repository';
import {store} from '../../../storage';

const MONDAY = new Date(2026, 8, 21);

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

it('leaves an install that was never asked exactly where it was', () => {
  const untouched = loadProgram(MONDAY);
  for (const track of TRACKS) {
    expect(untouched.tracks[track.id].testMax).toBe(track.defaultMax);
  }
  expect(startingFactor(undefined)).toBe(1);
  expect(startingFactor(DEFAULT_STARTING)).toBe(1);
});

it('seeds a beginner lower and someone training higher', () => {
  chooseStarting('new');
  const beginner = loadProgram(MONDAY);
  const pullups = TRACKS.find(t => t.id === 'pull')!;
  expect(beginner.tracks.pull.testMax).toBeLessThan(pullups.defaultMax);

  store.clearAll();
  __resetProfileCache();
  chooseStarting('training');
  const trained = loadProgram(MONDAY);
  expect(trained.tracks.pull.testMax).toBeGreaterThan(pullups.defaultMax);
});

it('never seeds a track that asks for nothing', () => {
  for (const option of STARTING_POINTS) {
    store.clearAll();
    __resetProfileCache();
    chooseStarting(option.id);
    const program = loadProgram(MONDAY);
    for (const track of TRACKS) {
      expect(program.tracks[track.id].testMax).toBeGreaterThanOrEqual(1);
    }
  }
});

it('rounds to numbers a person would say out loud', () => {
  // Reps stay whole; second-scale numbers land on fives.
  expect(seededMax(3, 0.5)).toBe(2);
  expect(seededMax(10, 1.5)).toBe(15);
  expect(seededMax(40, 0.5)).toBe(20);
  expect(seededMax(120, 1.5)).toBe(180);
  expect(seededMax(1, 0.5)).toBe(1);
  expect(seededMax(7, 1)).toBe(7);
});

it('still applies when the program was only read, not trained against', () => {
  // The setup preview reads the program on its first render, which seeds
  // it. If that counted as "already started", the question could never
  // take effect at all.
  const seeded = loadProgram(MONDAY);
  expect(seeded.tracks.pull.testMax).toBe(3);

  expect(chooseStarting('new')).toBe(true);
  __resetProfileCache();
  expect(loadProgram(MONDAY).tracks.pull.testMax).toBeLessThan(3);
});

it('will not rewrite numbers that have been trained against', () => {
  loadProgram(MONDAY);
  addEntry({at: MONDAY.getTime(), kindId: 'builtin.run-2mi', value: 1040});
  const before = loadProgram(MONDAY).tracks.pull.testMax;

  expect(chooseStarting('new')).toBe(false);
  __resetProfileCache();
  expect(loadStarting()).toBeUndefined();
  expect(loadProgram(MONDAY).tracks.pull.testMax).toBe(before);
});
