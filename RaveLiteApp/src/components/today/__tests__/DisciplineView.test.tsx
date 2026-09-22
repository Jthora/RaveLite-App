import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it, jest} from '@jest/globals';

import {DisciplineView} from '../DisciplineView';
import {disciplineById} from '../../../domain/exercises/disciplines';
import {
  clearsFor,
  levelFor,
  recordPractice,
} from '../../../domain/activity/practice';
import {
  __resetProfileCache,
  authorProfile,
  saveProfile,
} from '../../../domain/profile/repository';
import {store} from '../../../storage';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
  saveProfile(authorProfile());
});

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];

function render(onPick = jest.fn()) {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <DisciplineView
        discipline={disciplineById('staff')!}
        version={0}
        onPick={onPick}
        onBack={() => {}}
      />,
    );
  });
  return {tree: tree!, onPick};
}

it('opens on Basic at Standard, and plays a move at the chosen chart', () => {
  const {tree, onPick} = render();
  expect(byTestId(tree, 'move-water.figure-8')).toBeDefined();
  expect(byTestId(tree, 'move-water.beat-locks')).toBeUndefined();

  act(() => byTestId(tree, 'chart-heavy').props.onPress());
  act(() => byTestId(tree, 'move-water.figure-8').props.onPress());
  const [exercise, chart, dose] = onPick.mock.calls[0] as [
    {id: string},
    string,
    string,
  ];
  expect(exercise.id).toBe('water.figure-8');
  expect(chart).toBe('heavy');
  expect(dose).toMatch(/weak side first/);
  act(() => tree.unmount());
});

it('remembers the tier and chart a path was left on', () => {
  const {tree} = render();
  act(() => byTestId(tree, 'tier-intermediate').props.onPress());
  act(() => byTestId(tree, 'chart-challenge').props.onPress());
  expect(byTestId(tree, 'move-water.beat-locks')).toBeDefined();
  expect(levelFor('staff')).toEqual({tier: 'intermediate', chart: 'challenge'});
  act(() => tree.unmount());
});

it('counts a practice at a chart as that chart cleared', () => {
  const drill = {
    id: 'water.figure-8',
    element: 'water' as const,
    name: 'Staff Figure-8',
    purpose: '',
    dose: '3 × 1 min',
    targets: [],
    venues: [],
    approxSeconds: 60,
  };
  recordPractice({
    exercise: drill,
    amount: 60,
    unit: 'sec',
    seconds: 60,
    chart: 'light',
  });
  expect(clearsFor('water.figure-8')).toEqual(['light']);
});
