import React from 'react';
import renderer, {act} from 'react-test-renderer';

import {store} from '../../../storage';
import {DailySetsSheet} from '../DailySetsSheet';
import {GoalsSheet} from '../GoalsSheet';

beforeEach(() => store.clearAll());

it('opens Goals', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={() => {}} />);
  });
  const goals = () => tree!.root.findByType(GoalsSheet);
  expect(goals().props.visible).toBe(false);
  act(() => {
    tree!.root
      .findAll(node => node.props.testID === 'goals-open')[0]
      .props.onPress();
  });
  expect(goals().props.visible).toBe(true);
  act(() => tree!.unmount());
});
