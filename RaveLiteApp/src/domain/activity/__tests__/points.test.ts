import type {JournalEntry} from '../../journal/types';
import type {MetricKind} from '../../training/types';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {buildActivity, chimePoints, trainPoints} from '../activity';
import {
  DAILY_PAR,
  POINTS,
  averageShortfall,
  isHarmony,
  scoredPoints,
} from '../par';
import {pointsByElement} from '../stats';

let seq = 0;
const completion = (over: Record<string, unknown>): JournalEntry =>
  ({
    id: `c${seq++}`,
    at: 1,
    kind: 'completion',
    element: 'fire',
    source: 'always-on',
    exerciseId: 'fire.pushups',
    ...over,
  } as JournalEntry);

it('weighs a round: two a set, two for the partner, one each for the glass and eye break', () => {
  const items = buildActivity({
    journal: [
      completion({
        moves: [
          {trackId: 'push', amount: 5},
          {trackId: 'posture', amount: 10},
        ],
        partnerExerciseId: 'water.side-line-stretch',
        partnerSec: 30,
        water: true,
      }),
    ],
    train: [],
  });
  expect(pointsByElement(items)).toEqual({
    fire: 2,
    air: 3,
    earth: 0,
    water: 3,
    heart: 0,
  });
});

it('a glass is one, a check-in three, a short drill two, a long one its minutes', () => {
  const items = buildActivity({
    journal: [
      completion({exerciseId: 'water.sip', element: 'water'}),
      completion({exerciseId: 'heart.fuel-check', element: 'heart'}),
      completion({exerciseId: 'heart.morning-intent', element: 'heart'}),
      completion({exerciseId: 'heart.evening-review', element: 'heart'}),
      completion({exerciseId: 'air.box-breath', element: 'air'}),
      completion({exerciseId: 'fire.zone2-run'}),
      completion({exerciseId: 'fire.zone2-run', durationSec: 3600}),
    ],
    train: [],
  });
  expect(items.map(item => item.points)).toEqual([1, 3, 3, 5, 2, 30, 30]);
});

it('an answered water call brings an eye break; the +1 counter does not', () => {
  const items = buildActivity({
    journal: [
      completion({exerciseId: 'water.sip', element: 'water'}),
      completion({
        exerciseId: 'water.refill',
        element: 'water',
        pulseId: 'plan:hydration:0:1',
      }),
    ],
    train: [],
  });
  expect(pointsByElement(items)).toMatchObject({water: 2, air: 1});
  expect(items.map(item => item.label)).toContain('Eye break');
});

it('a max test is five; a timed session is its minutes, up to thirty', () => {
  const run: MetricKind = {
    id: 'custom.run',
    label: 'Run',
    category: 'run',
    unit: 'seconds',
    inputMode: 'mmss',
    element: 'fire',
    builtIn: false,
  };
  const hold: MetricKind = {...run, id: 'custom.hold', category: 'hold'};
  const entry = {id: 'e', at: 0, kindId: run.id, value: 1093};
  expect(trainPoints(entry, run)).toBe(18);
  expect(trainPoints({...entry, value: 3600}, run)).toBe(
    POINTS.sessionMinutesMax,
  );
  expect(trainPoints({...entry, kindId: hold.id, value: 90}, hold)).toBe(
    POINTS.test,
  );
  const [test] = buildActivity({
    journal: [
      {
        id: 't',
        at: 1,
        kind: 'program.test',
        trackId: 'push',
        max: 14,
        rung: 1,
        element: 'fire',
      } as JournalEntry,
    ],
    train: [],
  });
  expect(test.points).toBe(POINTS.test);
});

it('par counts in full, then half, then not at all; Harmony needs all five', () => {
  expect(DAILY_PAR).toBe(20);
  expect(scoredPoints(12)).toBe(12);
  expect(scoredPoints(30)).toBe(25);
  expect(scoredPoints(60)).toBe(30);
  expect(isHarmony({fire: 20, air: 21, earth: 30, water: 20, heart: 20})).toBe(
    true,
  );
  expect(isHarmony({fire: 40, air: 19, earth: 40, water: 40, heart: 40})).toBe(
    false,
  );
});

it('shortfall: how far under par each element averaged', () => {
  expect(
    averageShortfall({
      fire: [20, 30],
      air: [10, 20],
      earth: [0, 0],
      water: [25, 15],
      heart: [],
    }),
  ).toEqual({fire: 0, air: 5, earth: 20, water: 2.5, heart: 0});
});

it('projects a chime: a water call is a glass and an eye break', () => {
  const drill = (id: string) => EXERCISE_LIBRARY.find(e => e.id === id)!;
  expect(chimePoints(drill('water.refill'))).toEqual({water: 1, air: 1});
  expect(chimePoints(drill('heart.evening-review'))).toEqual({heart: 5});
  expect(chimePoints(drill('heart.fuel-check'))).toEqual({heart: 3});
});
