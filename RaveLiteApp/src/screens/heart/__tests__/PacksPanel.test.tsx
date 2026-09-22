import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it} from '@jest/globals';

import {PacksPanel} from '../PacksPanel';
import {beginSetup} from '../../../domain/profile/setup';
import {
  __resetProfileCache,
  gradingTable,
  setPacks,
} from '../../../domain/profile/repository';
import {store} from '../../../storage';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];

it('asks for the charts as the tests pack is turned on', () => {
  beginSetup();
  setPacks([]);
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<PacksPanel />);
  });
  expect(byTestId(tree!, 'table-picker')).toBeUndefined();
  act(() => byTestId(tree!, 'pack-military-tests').props.onPress());
  expect(byTestId(tree!, 'table-picker')).toBeDefined();
  act(() => byTestId(tree!, 'table-male').props.onPress());
  expect(gradingTable()).toBe('male');
  // Answered: the question goes; the choice lives in Goals from here.
  expect(byTestId(tree!, 'table-picker')).toBeUndefined();
  act(() => tree!.unmount());
});
