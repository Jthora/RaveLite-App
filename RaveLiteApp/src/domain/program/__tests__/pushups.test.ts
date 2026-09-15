import type {JournalEntry} from '../../journal/types';
import {buildActivity} from '../../activity/activity';
import {PUSHUP_GOAL, pushupDay} from '../pushups';
import type {DayPrescription} from '../types';

const rx = (over: Partial<DayPrescription>) => over as DayPrescription;

it('adds every push-up toward 200, standard apart from variants', () => {
  const items = buildActivity({
    journal: [
      {
        id: 'r',
        at: 1,
        kind: 'completion',
        element: 'fire',
        source: 'always-on',
        exerciseId: 'fire.pushup-groove',
        moves: [
          {trackId: 'push', amount: 10},
          {trackId: 'row', amount: 6},
          {trackId: 'push-variants', amount: 4},
        ],
      },
      {
        id: 's',
        at: 2,
        kind: 'completion',
        element: 'fire',
        source: 'manual',
        exerciseId: 'fire.pushup-groove',
        trackId: 'push',
        amount: 12,
      },
      {
        id: 't',
        at: 3,
        kind: 'program.test',
        trackId: 'push',
        max: 25,
        rung: 1,
        element: 'fire',
      },
    ] as JournalEntry[],
    train: [
      {id: 'p', at: 4, kindId: 'builtin.pushups-1min', value: 30},
      {id: 'q', at: 5, kindId: 'builtin.pullups-amrap', value: 8},
    ],
  });
  const day = pushupDay(items, [
    rx({trackId: 'push', setSize: 12, sets: 10}),
    rx({trackId: 'push-variants', setSize: 4, sets: 2}),
    rx({trackId: 'row', setSize: 6, sets: 4}),
  ]);
  expect(day).toEqual({
    total: 81,
    standard: 77,
    variants: 4,
    bestSet: 30,
    planned: 128,
  });
  expect(PUSHUP_GOAL).toBe(200);
});
