import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {CharacterSheet} from '../CharacterSheet';
import {addEntry} from '../../../domain/training/repository';
import {store} from '../../../storage';

// Mid-morning, so a day's logging lands on the day it says.
const TEN_AM = new Date(2026, 8, 21, 10, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TEN_AM);
  store.clearAll();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderSheet() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<CharacterSheet />);
  });
  return tree!;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];

/** A day with something on it, `ago` days back. */
function trained(ago: number): void {
  addEntry({
    at: TEN_AM.getTime() - ago * 86_400_000,
    kindId: 'builtin.staff-session',
    value: 10 * 60,
  });
}

it('does not open on a grid of zeroes', () => {
  const tree = renderSheet();
  expect(byTestId(tree, 'sheet-locked')).toBeDefined();
  // No attribute cells while it is closed.
  expect(byTestId(tree, 'cell-power')).toBeUndefined();
  act(() => tree.unmount());
});

it('opens after a week of training, not a week of owning the app', () => {
  for (let ago = 0; ago < 7; ago += 1) {
    trained(ago);
  }
  const tree = renderSheet();
  expect(byTestId(tree, 'sheet-locked')).toBeUndefined();
  act(() => tree.unmount());
});

it('stays closed on six days, however much is in them', () => {
  for (let ago = 0; ago < 6; ago += 1) {
    trained(ago);
    trained(ago);
    trained(ago);
  }
  const tree = renderSheet();
  expect(byTestId(tree, 'sheet-locked')).toBeDefined();
  act(() => tree.unmount());
});

it('counts the days so far rather than saying nothing', () => {
  trained(0);
  trained(1);
  const tree = renderSheet();
  const text = JSON.stringify(tree.toJSON());
  expect(text).toContain('2 days in.');
  act(() => tree.unmount());
});
