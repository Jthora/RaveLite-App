/**
 * Settings is one sheet with pages inside it. A sheet opened over it loses
 * Back on the phone once it has been touched, so nothing in Settings may
 * open one: every page, and every page below a page, stays in this Modal.
 */
import React from 'react';
import {Modal} from 'react-native';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';

import {SettingsSheet} from '../SettingsSheet';
import {getActiveHours} from '../../../domain/ambient/activeHours';
import {__resetProfileCache} from '../../../domain/profile/repository';
import {store} from '../../../storage';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

function render() {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <SettingsSheet visible onClose={() => {}} permission="granted" />,
    );
  });
  return tree;
}

const find = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll(
    (n: ReactTestInstance) =>
      n.props.testID === id && typeof n.props.onPress === 'function',
  )[0];

const press = (tree: renderer.ReactTestRenderer, id: string) =>
  act(() => find(tree, id).props.onPress());

const openModals = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAllByType(Modal).filter(m => m.props.visible !== false);

it('opens every page, and every page below one, inside the one sheet', () => {
  const tree = render();
  for (const group of ['you', 'day', 'program', 'app']) {
    press(tree, `settings-group-${group}`);
    expect(openModals(tree)).toHaveLength(1);
    press(tree, 'settings-back');
  }
  press(tree, 'settings-group-day');
  for (const sub of ['myday-edit', 'weather-open', 'plan-open']) {
    press(tree, sub);
    expect(openModals(tree)).toHaveLength(1);
    press(tree, 'settings-back');
  }
  act(() => tree.unmount());
});

it('edits My day on a page, and Save goes back to The day', () => {
  const tree = render();
  press(tree, 'settings-group-day');
  press(tree, 'myday-edit');
  const start = getActiveHours().start;
  press(tree, 'myday-save');
  expect(getActiveHours().start).toBe(start);
  // Back on The day: its Edit row is showing again.
  expect(find(tree, 'myday-edit')).toBeDefined();
  expect(openModals(tree)).toHaveLength(1);
  act(() => tree.unmount());
});
