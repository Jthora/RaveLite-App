import React from 'react';
import {Modal} from 'react-native';
import renderer, {act} from 'react-test-renderer';

import {store} from '../../../storage';
import {DailySetsSheet} from '../DailySetsSheet';
import {Goals} from '../Goals';

beforeEach(() => store.clearAll());

it('shows Goals in the same sheet; Back returns to Daily Sets, then closes', () => {
  const onClose = jest.fn();
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={onClose} />);
  });
  const goalsShown = () => tree!.root.findAllByType(Goals).length > 0;
  const back = () => tree!.root.findAllByType(Modal)[0].props.onRequestClose();
  expect(goalsShown()).toBe(false);
  act(() => {
    tree!.root
      .findAll(node => node.props.testID === 'goals-open')[0]
      .props.onPress();
  });
  expect(goalsShown()).toBe(true);
  act(() => back());
  expect(goalsShown()).toBe(false);
  expect(onClose).not.toHaveBeenCalled();
  act(() => back());
  expect(onClose).toHaveBeenCalledTimes(1);
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
