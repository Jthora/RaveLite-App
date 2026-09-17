import type {ActivityItem} from '../../activity/activity';
import {attributesForItem, xpFromActivity} from '../trains';

const item = (extra: Partial<ActivityItem>): ActivityItem => ({
  id: 'x',
  at: 0,
  element: 'fire',
  source: 'chime',
  label: 'x',
  points: 2,
  ref: {store: 'journal', id: 'x'},
  ...extra,
});

const leads = (extra: Partial<ActivityItem>) =>
  attributesForItem(item(extra)).map(t => t.id);

it('gives a set to its track, the lead first', () => {
  expect(leads({trackId: 'push', exerciseId: 'fire.pushup-groove'})).toEqual([
    'strength',
    'power',
  ]);
  expect(leads({trackId: 'plank', exerciseId: 'earth.plank'})).toEqual([
    'toughness',
  ]);
  // Posture sets are Air's breath work; the drill alone would read as mobility.
  expect(leads({trackId: 'posture', exerciseId: 'air.chin-tuck'})).toEqual([
    'breath',
    'awareness',
  ]);
  expect(leads({exerciseId: 'air.chin-tuck', element: 'air'})).toEqual([
    'mobility',
  ]);
});

it('reads a measured thing as what it measured', () => {
  expect(leads({kindId: 'builtin.run-3mi', source: 'train'})).toEqual([
    'stamina',
  ]);
  expect(leads({kindId: 'builtin.staff-session', source: 'train'})).toEqual([
    'dexterity',
    'presence',
  ]);
  expect(leads({kindId: 'builtin.plank', source: 'train'})).toEqual([
    'toughness',
  ]);
});

it('puts named drills in the seat their tags would miss', () => {
  expect(leads({exerciseId: 'air.eye-break', element: 'air'})).toEqual([
    'awareness',
  ]);
  expect(leads({exerciseId: 'fire.jump-squat'})).toEqual(['power', 'agility']);
  expect(leads({exerciseId: 'fire.backyard-strides'})).toEqual([
    'speed',
    'stamina',
  ]);
  expect(leads({exerciseId: 'heart.still-sit', element: 'heart'})).toEqual([
    'focus',
  ]);
  expect(leads({exerciseId: 'heart.morning-intent', element: 'heart'})).toEqual(
    ['resolve'],
  );
  expect(leads({exerciseId: 'earth.wall-sit', element: 'earth'})).toEqual([
    'toughness',
  ]);
});

it('falls back to tags, then to the element, so nothing is worth nothing', () => {
  expect(leads({exerciseId: 'water.pigeon', element: 'water'})).toEqual([
    'mobility',
  ]);
  expect(leads({exerciseId: 'fire.fire-rounds'})).toEqual(['stamina']);
  expect(leads({hydration: true, element: 'water'})).toEqual(['recovery']);
  expect(leads({element: 'earth'})).toEqual(['strength']);
});

it('shares a thing done: the lead takes it all, the rider half', () => {
  expect(
    xpFromActivity([
      item({trackId: 'push', points: 2}),
      item({trackId: 'push', points: 2}),
      item({exerciseId: 'air.eye-break', element: 'air', points: 1}),
    ]),
  ).toEqual({strength: 4, power: 2, awareness: 1});
});
