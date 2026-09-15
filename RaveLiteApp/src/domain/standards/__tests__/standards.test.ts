import {METERS_PER_MILE} from '../../../lib/constants';
import {store} from '../../../storage';
import {BUILTIN_METRICS} from '../../training/builtinMetrics';
import {
  STANDARD_EVENTS,
  bestResult,
  getPrimarySex,
  hasOwnTarget,
  progressToward,
  setPrimarySex,
  setTarget,
  targetFor,
} from '../standards';

const event = (id: string) => STANDARD_EVENTS.find(e => e.id === id)!;
const metricFor = (id: string) => BUILTIN_METRICS.find(m => m.id === id);

beforeEach(() => store.clearAll());

it('leads with the male table, and a target can be changed and reset', () => {
  const pullups = event('pullups');
  expect(getPrimarySex()).toBe('male');
  expect(targetFor(pullups)).toBe(21);
  setPrimarySex('female');
  expect(targetFor(pullups)).toBe(10);
  setPrimarySex('male');
  setTarget('pullups', 17);
  expect(targetFor(pullups)).toBe(17);
  expect(hasOwnTarget(pullups)).toBe(true);
  setTarget('pullups', undefined);
  expect(targetFor(pullups)).toBe(21);
});

it('every event has a Train log kind to hold its tests', () => {
  for (const e of STANDARD_EVENTS) {
    expect(metricFor(e.kindId)).toBeDefined();
  }
});

it('picks the most reps, or the fastest time counting longer runs at the same pace', () => {
  expect(
    bestResult(
      event('pullups'),
      [
        {id: 'a', at: 1, kindId: 'builtin.pullups-amrap', value: 6},
        {id: 'b', at: 2, kindId: 'builtin.pullups-amrap', value: 8},
      ],
      metricFor,
    ),
  ).toEqual({value: 8, at: 2});

  // 3.2 miles in 27:00 is 25:18.75 over 3 miles.
  const loop = bestResult(
    event('run-3mi'),
    [
      {
        id: 'c',
        at: 3,
        kindId: 'builtin.run-custom',
        value: 27 * 60,
        distanceMeters: 3.2 * METERS_PER_MILE,
      },
      {id: 'd', at: 4, kindId: 'builtin.run-3mi', value: 26 * 60},
      {id: 'e', at: 5, kindId: 'builtin.run-1.5mi', value: 10 * 60},
    ],
    metricFor,
  );
  expect(loop?.value).toBeCloseTo(1518.75, 2);
  expect(loop?.from).toBe('Run (custom distance)');
});

it('measures progress both ways', () => {
  expect(progressToward(event('pullups'), 7, 21)).toBeCloseTo(1 / 3);
  expect(progressToward(event('run-3mi'), 1518.75, 1080)).toBeCloseTo(
    1080 / 1518.75,
  );
  expect(progressToward(event('run-3mi'), 1000, 1080)).toBe(1);
});
