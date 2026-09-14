import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {TargetFilterStrip} from '../../../components/TargetFilterStrip';
import {activityForDay} from '../../../domain/activity/activity';
import {getElementPrefs} from '../../../domain/settings/elementPrefs';
import {store} from '../../../storage';
import {ELEMENTS} from '../../../theme/elements';
import {DrillsPanel} from '../DrillsPanel';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 14, 10, 0));
  store.clearAll();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderDrills() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DrillsPanel element={ELEMENTS.earth} />);
  });
  return tree!;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((node: ReactTestInstance) => node.props.testID === id)[0];

it('keeps the focus areas chosen on Drills', () => {
  const tree = renderDrills();
  act(() => {
    tree.root.findByType(TargetFilterStrip).props.onChange(['Core']);
  });
  expect(getElementPrefs('earth')).toEqual({
    focusTargets: ['Core'],
    focusLocked: true,
  });
  act(() => tree.unmount());
});

it('Swap offers a different drill and Done logs the pick', () => {
  const tree = renderDrills();
  const pickName = () => byTestId(tree, 'pick-name').props.children;
  const first = pickName();
  act(() => {
    byTestId(tree, 'pick-swap').props.onPress();
  });
  expect(pickName()).not.toEqual(first);
  act(() => {
    byTestId(tree, 'pick-done').props.onPress();
  });
  expect(activityForDay()).toHaveLength(1);
  act(() => tree.unmount());
});
