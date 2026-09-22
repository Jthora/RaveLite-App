/**
 * The Train log's dialogs — Manage, a new exercise, the calendar — used
 * to be Modals over the log's Modal, three deep from Today and four from
 * Goals. On the phone a Modal over a Modal loses Back once touched. They
 * are drawn in the log's own window now, and Back closes the top one.
 */
import React from 'react';
import {Modal} from 'react-native';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';

import {TrainingLogSheet} from '../TrainingLogSheet';
import {DailySetsSheet} from '../../../screens/heart/DailySetsSheet';
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

const shown = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAllByType(Modal).filter(m => m.props.visible !== false);

const has = (tree: renderer.ReactTestRenderer, text: string) =>
  JSON.stringify(tree.toJSON()).includes(text);

const press = (tree: renderer.ReactTestRenderer, id: string) =>
  act(() => {
    tree.root
      .findAll(
        (n: ReactTestInstance) =>
          n.props.testID === id && typeof n.props.onPress === 'function',
      )[0]
      .props.onPress();
  });

it('opens Manage and New Exercise in its own window; Back closes the top one', () => {
  const onClose = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<TrainingLogSheet visible onClose={onClose} />);
  });
  const back = () => act(() => shown(tree)[0].props.onRequestClose());
  press(tree, 'log-manage');
  expect(has(tree, 'Manage Exercises')).toBe(true);
  press(tree, 'manage-add');
  expect(has(tree, 'New Exercise')).toBe(true);
  expect(shown(tree)).toHaveLength(1);
  back();
  expect(has(tree, 'New Exercise')).toBe(false);
  expect(has(tree, 'Manage Exercises')).toBe(true);
  back();
  expect(has(tree, 'Manage Exercises')).toBe(false);
  expect(onClose).not.toHaveBeenCalled();
  back();
  expect(onClose).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

it('logs a test from Goals inside Daily Sets, in the same window', () => {
  const onClose = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={onClose} />);
  });
  press(tree, 'goals-open');
  press(tree, 'log-pullups');
  expect(has(tree, 'log-selected-kind')).toBe(true);
  expect(shown(tree)).toHaveLength(1);
  // Back closes the log, not Daily Sets.
  act(() => shown(tree)[0].props.onRequestClose());
  expect(has(tree, 'log-selected-kind')).toBe(false);
  expect(onClose).not.toHaveBeenCalled();
  act(() => tree.unmount());
});
