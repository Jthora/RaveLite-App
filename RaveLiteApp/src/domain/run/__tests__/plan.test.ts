import {METERS_PER_MILE} from '../../../lib/constants';
import {BUILTIN_METRICS} from '../../training/builtinMetrics';
import {
  ASSUMED_THREE_MILE,
  equivalentTime,
  nextCheckpoint,
  pacesFor,
  runDay,
  runFitness,
  splitTime,
  type RunFitness,
} from '../plan';

const metricFor = (id: string) => BUILTIN_METRICS.find(m => m.id === id);
const DAY = 86_400_000;
const NOW = new Date(2026, 8, 15, 12).getTime();
const mmss = (m: number, s = 0) => m * 60 + s;

describe('fitness', () => {
  it("carries a run to 3 miles at Riegel's rate", () => {
    // A 17:20 2-mile is about a 26:38 3-mile.
    expect(
      equivalentTime(mmss(17, 20), 2 * METERS_PER_MILE, 3 * METERS_PER_MILE),
    ).toBeCloseTo(1598.5, 0);
  });

  it('uses the best recent run, the best old one when nothing is recent, or assumes 27:00', () => {
    expect(runFitness([], metricFor, NOW)).toEqual({
      threeMile: ASSUMED_THREE_MILE,
      stale: true,
    });
    const old = {
      id: 'o',
      at: NOW - 200 * DAY,
      kindId: 'builtin.run-2mi',
      value: mmss(17, 20),
    };
    expect(runFitness([old], metricFor, NOW)).toMatchObject({
      stale: true,
      from: {label: '2-Mile Run', at: old.at},
      lastRunAt: old.at,
    });
    const loop = {
      id: 'l',
      at: NOW - 10 * DAY,
      kindId: 'builtin.run-custom',
      value: mmss(27),
      distanceMeters: 3.2 * METERS_PER_MILE,
    };
    const fitness = runFitness([old, loop], metricFor, NOW);
    expect(fitness.stale).toBe(false);
    // 3.2 miles in 27:00 carries to about 25:13.
    expect(fitness.threeMile).toBeCloseTo(1513, 0);
  });
});

describe('checkpoints and paces', () => {
  it('steps a minute at a time, then takes the milestone', () => {
    expect(nextCheckpoint(mmss(26, 39))).toEqual({
      seconds: mmss(25, 30),
      label: 'the next checkpoint',
    });
    expect(nextCheckpoint(mmss(21, 30)).label).toBe('B+');
    expect(nextCheckpoint(mmss(20, 50))).toEqual({
      seconds: mmss(19, 45),
      label: 'the next checkpoint',
    });
    expect(nextCheckpoint(mmss(19, 10)).label).toBe('an A');
    expect(nextCheckpoint(mmss(18)).label).toBe('an A+');
  });

  it('sets repeats at the checkpoint pace', () => {
    const paces = pacesFor(mmss(25), {seconds: mmss(24), label: ''});
    expect(paces.goal).toBe(480);
    expect(Math.round(splitTime(paces.goal, 400))).toBe(119);
    expect(paces.easy).toBe(625);
    expect(paces.tempo).toBe(540);
  });
});

describe('the week', () => {
  const fit: RunFitness = {threeMile: mmss(25), stale: false};
  // Program week 5 starts on a Monday; its Tuesday is day 2 of the week.
  const tuesday = new Date(2026, 9, 13, 6);
  const wednesday = new Date(2026, 9, 14, 6);
  const saturday = new Date(2026, 9, 17, 6);
  // A run three days before, unless a test says otherwise.
  const day = (
    date: Date,
    week: number,
    fitness: RunFitness = {...fit, lastRunAt: date.getTime() - 3 * DAY},
  ) => runDay({date, week, fitness, now: date.getTime() - DAY});

  it('rotates Tuesday through 400s, tempo, 800s and strides', () => {
    expect(day(tuesday, 5)).toMatchObject({
      kind: 'intervals',
      exerciseId: 'fire.interval-run',
      replaces: 'fire.backyard-strides',
      short: '6 × 400 m in 1:59',
    });
    expect(day(tuesday, 6)).toMatchObject({
      kind: 'tempo',
      short: '15 min at 9:00 a mile',
    });
    expect(day(tuesday, 7)).toMatchObject({short: '3 × 800 m in 3:59'});
    expect(day(tuesday, 8)?.kind).toBe('strides');
  });

  it('rebuilds in the first block, or after two weeks without a run', () => {
    expect(day(tuesday, 2)?.kind).toBe('strides');
    const lapsed = {...fit, lastRunAt: tuesday.getTime() - 20 * DAY};
    expect(day(tuesday, 5, lapsed)?.kind).toBe('strides');
    expect(day(wednesday, 5, lapsed)?.detail).toContain('run/walk');
  });

  it('lengthens the easy run and sets the Saturday goals', () => {
    expect(day(wednesday, 5)?.short).toBe('35 min easy');
    expect(day(wednesday, 7)?.short).toBe('45 min easy');
    expect(day(saturday, 5)).toMatchObject({
      kind: 'test',
      exerciseId: 'fire.run-2mi',
    });
    expect(day(saturday, 6)).toMatchObject({
      replaces: 'fire.run-3mi',
      short: 'goal 24:00',
    });
    expect(day(saturday, 7)).toBeUndefined();
    expect(day(saturday, 8)?.replaces).toBe('fire.zone2-run');
  });
});
