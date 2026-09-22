/**
 * Every door on Today, and the doors inside those, opened in the real
 * shell — Today with element pages over it, sheets, and the layers that
 * replaced the sheets that used to open over sheets.
 *
 * Unit tests render one panel at a time, so a piece that only breaks in
 * composition breaks nowhere. This is the walk the phone check does, in
 * jest: open it, see something, come back, and never two windows at once.
 */
import React from 'react';
import {Modal} from 'react-native';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {ElementShell} from '../ElementShell';
import {
  __resetProfileCache,
  authorProfile,
  finishSetup,
  saveProfile,
} from '../../domain/profile/repository';
import * as runtime from '../../domain/ambient/pulseRuntime';
import {store} from '../../storage';

// Monday 14 Sep 2026, 10:00 — inside My day, with the day ahead.
const TEN_AM = new Date(2026, 8, 14, 10, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TEN_AM);
  store.clearAll();
  __resetProfileCache();
  runtime.__test.reset();
  saveProfile(authorProfile());
  finishSetup(TEN_AM.getTime());
});

afterEach(() => {
  jest.useRealTimers();
});

function renderShell() {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<ElementShell />);
  });
  return tree;
}

const find = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll(
    (n: ReactTestInstance) =>
      n.props.testID === id && typeof n.props.onPress === 'function',
  )[0];

const press = (tree: renderer.ReactTestRenderer, id: string) => {
  const door = find(tree, id);
  expect({id, found: door !== undefined}).toEqual({id, found: true});
  act(() => door.props.onPress());
};

const has = (tree: renderer.ReactTestRenderer, text: string) =>
  JSON.stringify(tree.toJSON()).includes(text);

/** Windows on screen. Two at once is the bug this walk looks for. */
const windows = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAllByType(Modal).filter(m => m.props.visible !== false);

/** Android Back, as the top window receives it. */
const back = (tree: renderer.ReactTestRenderer) =>
  act(() => {
    const open = windows(tree);
    open[open.length - 1].props.onRequestClose();
  });

it('opens every door on Today, one window at a time', () => {
  const tree = renderShell();
  const doors: [string, string][] = [
    ['settings-open', 'The program'],
    ['sets-open', 'Daily Sets'],
    ['practice-open', 'Pick a skill and count it'],
    ['log-open', 'Manage'],
    ['session-open', 'Session'],
  ];
  for (const [door, shows] of doors) {
    press(tree, door);
    expect({door, seen: has(tree, shows)}).toEqual({door, seen: true});
    expect({door, open: windows(tree).length}).toEqual({door, open: 1});
    back(tree);
    expect({door, open: windows(tree).length}).toEqual({door, open: 0});
  }
  act(() => tree.unmount());
});

it('opens the doors inside Daily Sets without stacking a window', () => {
  const tree = renderShell();
  press(tree, 'sets-open');
  press(tree, 'goals-open');
  press(tree, 'height-open');
  expect(windows(tree)).toHaveLength(1);
  back(tree);
  press(tree, 'log-pullups');
  expect(windows(tree)).toHaveLength(1);
  back(tree);
  // Back out of Goals, then out of Daily Sets.
  back(tree);
  back(tree);
  expect(windows(tree)).toHaveLength(0);
  act(() => tree.unmount());
});

it('opens an element page, its library and its paths', () => {
  const tree = renderShell();
  press(tree, 'strip-water');
  expect(has(tree, 'PATHS IN PRACTICE')).toBe(true);
  press(tree, 'library-open');
  expect(windows(tree)).toHaveLength(1);
  back(tree);
  // A path hands Today's Practice the page, and comes back to Today.
  press(tree, 'discipline-dance');
  expect(windows(tree)).toHaveLength(1);
  back(tree);
  act(() => tree.unmount());
});
