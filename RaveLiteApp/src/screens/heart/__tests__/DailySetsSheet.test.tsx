import React from 'react';
import renderer, {act} from 'react-test-renderer';

import {store} from '../../../storage';
import {DailySetsSheet} from '../DailySetsSheet';
import {StandardsSheet} from '../StandardsSheet';

beforeEach(() => store.clearAll());

it('opens the fitness standards', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={() => {}} />);
  });
  const standards = () => tree!.root.findByType(StandardsSheet);
  expect(standards().props.visible).toBe(false);
  act(() => {
    tree!.root
      .findAll(node => node.props.testID === 'standards-open')[0]
      .props.onPress();
  });
  expect(standards().props.visible).toBe(true);
  act(() => tree!.unmount());
});
