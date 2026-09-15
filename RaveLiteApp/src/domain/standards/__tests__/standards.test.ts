import {METERS_PER_MILE} from '../../../lib/constants';
import {store} from '../../../storage';
import {BUILTIN_METRICS} from '../../training/builtinMetrics';
import {
  GOAL_GROUPS,
  STANDARD_EVENTS,
  bestResult,
  formatGrades,
  getPrimarySex,
  goalFor,
  gradeOn,
  gradesFor,
  hasOwnTarget,
  progressToward,
  setPrimarySex,
  setTarget,
  targetFor,
} from '../standards';

const event = (id: string) => STANDARD_EVENTS.find(e => e.id === id)!;
const metricFor = (id: string) => BUILTIN_METRICS.find(m => m.id === id);

beforeEach(() => store.clearAll());

it('leads with the male table, aims for a B+, and a target can be changed and reset', () => {
  const pullups = event('pullups');
  expect(getPrimarySex()).toBe('male');
  expect(targetFor(pullups)).toBe(17);
  setPrimarySex('female');
  expect(targetFor(pullups)).toBe(9);
  setPrimarySex('male');
  setTarget('pullups', 20);
  expect(targetFor(pullups)).toBe(20);
  expect(hasOwnTarget(pullups)).toBe(true);
  setTarget('pullups', undefined);
  expect(targetFor(pullups)).toBe(17);
});

it('every logged goal has a Train log kind; only sets done is measured', () => {
  for (const e of STANDARD_EVENTS.filter(goal => goal.kindId)) {
    expect(metricFor(e.kindId!)).toBeDefined();
  }
  expect(STANDARD_EVENTS.filter(e => !e.kindId).map(e => e.id)).toEqual([
    'sets-done',
  ]);
  expect(new Set(STANDARD_EVENTS.map(e => e.group))).toEqual(
    new Set(GOAL_GROUPS),
  );
});

it('grades evenly from the passing minimum (D−) to the max (A+)', () => {
  const pullups = event('pullups');
  const usmc = pullups.scales![0];
  const grade = (value: number) => gradeOn(pullups, usmc, 'male', value);
  expect([21, 17, 16, 5, 4, 3].map(grade)).toEqual([
    'A+',
    'B+',
    'B',
    'D−',
    'F+',
    'F',
  ]);

  const run = event('run-3mi');
  const time = (m: number, s = 0) =>
    gradeOn(run, run.scales![0], 'male', m * 60 + s);
  expect([
    time(18),
    time(20, 54),
    time(20, 55),
    time(28, 40),
    time(29, 30),
    time(30),
  ]).toEqual(['A+', 'B+', 'B', 'D−', 'F+', 'F']);
});

it('targets the hardest B+ of every test that uses the event', () => {
  const goals = Object.fromEntries(
    STANDARD_EVENTS.filter(e => e.group === 'tests').map(e => [
      e.id,
      goalFor(e, 'male'),
    ]),
  );
  expect(goals).toEqual({
    'pushups-1min': 47,
    'pushups-2min': 65,
    pullups: 17,
    // USMC 3:03 beats USAF 2:51 and USSF 2:40.
    plank: 183,
    // USSF 48 beats USAF 46.
    'situps-1min': 48,
    'run-2mi': 15 * 60 + 56,
    'run-3mi': 20 * 60 + 54,
    'cft-mtc': undefined,
    'cft-acl': undefined,
    'cft-manuf': undefined,
  });
  // The combat fitness test has no published minimum: its top score.
  expect(targetFor(event('cft-acl'))).toBe(110);
});

it('grades element goals on RaveLite marks, aiming for a B+', () => {
  const goals = Object.fromEntries(
    STANDARD_EVENTS.filter(e => e.group !== 'tests').map(e => [
      e.id,
      goalFor(e, 'male'),
    ]),
  );
  expect(goals).toEqual({
    'breath-hold': 118,
    'exhale-hold': 48,
    'rope-skips': 251,
    'still-sit': 140,
    'sets-done': 87,
    squats: 64,
    'wall-sit': 144,
    'dead-hang': 96,
    'side-plank': 96,
    balance: 47,
    'deep-squat-hold': 227,
    'staff-flow': 890,
  });
  expect(formatGrades(gradesFor(event('squats'), 'male', 40))).toBe('C−');
});

it('names the grade on each test, grouping tests that agree', () => {
  expect(formatGrades(gradesFor(event('run-2mi'), 'male', 17 * 60 + 20))).toBe(
    'C+ USAF · USSF',
  );
  expect(formatGrades(gradesFor(event('plank'), 'male', 150))).toBe(
    'C+ USMC · B− USAF · B USSF',
  );
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
