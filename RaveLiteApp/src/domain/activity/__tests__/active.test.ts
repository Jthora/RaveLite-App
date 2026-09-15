import {store} from '../../../storage';
import type {CompletionEntry} from '../../journal/types';
import type {TrainingLogEntry} from '../../training/types';
import {activeMinutes, activeSeconds} from '../active';
import {buildActivity} from '../activity';

const AT = new Date(2026, 8, 15, 10).getTime();

beforeEach(() => store.clearAll());

const round: CompletionEntry = {
  id: 'r1',
  at: AT,
  kind: 'completion',
  exerciseId: 'fire.pushup-groove',
  element: 'fire',
  source: 'always-on',
  moves: [
    {trackId: 'push', amount: 10},
    {trackId: 'plank', amount: 30},
    {trackId: 'breath', amount: 60},
  ],
  partnerExerciseId: 'air.doorway-pec-stretch',
  partnerSec: 30,
};

const glass: CompletionEntry = {
  id: 'g1',
  at: AT,
  kind: 'completion',
  exerciseId: 'water.sip',
  element: 'water',
  source: 'manual',
};

const train: TrainingLogEntry[] = [
  {id: 's1', at: AT, kindId: 'builtin.staff-session', value: 45 * 60},
  {id: 's2', at: AT, kindId: 'builtin.tai-chi-video', value: 20 * 60},
  {id: 'b1', at: AT, kindId: 'builtin.breath-hold', value: 90},
];

it('counts sessions and movement by time, and not water or breathing', () => {
  const items = buildActivity({journal: [round, glass], train});
  const secondsOf = (id: string) =>
    activeSeconds(items.find(item => item.id === id)!);
  // Ten push-ups at about three seconds each, and a 30-second plank.
  expect(secondsOf('r1:push')).toBe(30);
  expect(secondsOf('r1:plank')).toBe(30);
  expect(secondsOf('r1:breath')).toBe(0);
  expect(secondsOf('r1:partner')).toBe(30);
  expect(secondsOf('g1')).toBe(0);
  expect(secondsOf('train:s2')).toBe(20 * 60);
  expect(secondsOf('train:b1')).toBe(0);
  // 90 s of the round, 45 min of staff and 20 of tai chi.
  expect(activeMinutes(items)).toBe(67);
});
