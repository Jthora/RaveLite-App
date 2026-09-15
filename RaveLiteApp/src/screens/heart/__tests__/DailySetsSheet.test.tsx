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

it("shows today's focus, its morning block, and the week ahead", () => {
  jest.useFakeTimers();
  // Monday 14 Sep 2026: the program starts today.
  jest.setSystemTime(new Date(2026, 8, 14, 10));
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={() => {}} />);
  });
  const json = JSON.stringify(tree!.toJSON());
  expect(json).toContain('Kicks and jumps');
  expect(json).toContain('Kick-Flip Foundations');
  expect(json).toContain('This week');
  // Saturday of week 1 is the Air Force test.
  expect(json).toContain('Air Force test');
  act(() => tree!.unmount());
  jest.useRealTimers();
});
