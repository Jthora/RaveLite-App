import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';

import {SettingsSheet} from '../SettingsSheet';
import {__resetDemo, enterDemo, isDemo} from '../../../domain/demo/demo';
import {store} from '../../../storage';

beforeEach(() => {
  __resetDemo();
  store.clearAll();
});

afterEach(() => __resetDemo());

it('says in Settings when demo mode is on, and leaves it', () => {
  enterDemo();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <SettingsSheet visible onClose={() => {}} permission="granted" />,
    );
  });
  const find = (id: string) =>
    tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];
  expect(find('demo-banner')).toBeDefined();
  act(() => find('demo-leave').props.onPress());
  expect(isDemo()).toBe(false);
  expect(find('demo-banner')).toBeUndefined();
  act(() => tree.unmount());
});
