import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {activityForDay} from '../../domain/activity/activity';
import {logWaterGlass} from '../../domain/activity/record';
import {store} from '../../storage';
import {UNDO_MS, UndoBar} from '../UndoBar';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 14, 12, 0));
  store.clearAll();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderBar() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<UndoBar />);
  });
  return tree!;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((node: ReactTestInstance) => node.props.testID === id)[0];

it('offers Undo after something is logged, and Undo takes it back', () => {
  const tree = renderBar();
  expect(byTestId(tree, 'undo-bar')).toBeUndefined();
  act(() => {
    logWaterGlass();
  });
  expect(byTestId(tree, 'undo-bar')).toBeDefined();
  act(() => {
    byTestId(tree, 'undo-action').props.onPress();
  });
  expect(activityForDay()).toEqual([]);
  expect(byTestId(tree, 'undo-bar')).toBeUndefined();
  act(() => tree.unmount());
});

it('leaves on its own after a few seconds, keeping the log', () => {
  const tree = renderBar();
  act(() => {
    logWaterGlass();
  });
  act(() => {
    jest.advanceTimersByTime(UNDO_MS);
  });
  expect(byTestId(tree, 'undo-bar')).toBeUndefined();
  expect(activityForDay()).toHaveLength(1);
  act(() => tree.unmount());
});

/** Bars on screen: host views only, so each bar counts once. */
const shown = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAll(
    (node: ReactTestInstance) =>
      typeof node.type === 'string' && node.props?.testID === 'undo-bar',
  );

it('shows on the top sheet only, and Undo there clears the page below too', () => {
  // A sheet is a window over the page, so the page's bar is hidden under
  // it. The sheet carries its own bar; the newest one mounted shows.
  let tree: renderer.ReactTestRenderer | undefined;
  const render = (sheet: boolean) => (
    <>
      <UndoBar />
      {sheet ? <UndoBar /> : null}
    </>
  );
  act(() => {
    tree = renderer.create(render(true));
  });
  act(() => {
    logWaterGlass();
  });
  expect(shown(tree!)).toHaveLength(1);
  act(() => {
    shown(tree!)[0]
      .findAll(
        (node: ReactTestInstance) => node.props.testID === 'undo-action',
      )[0]
      .props.onPress();
  });
  expect(activityForDay()).toEqual([]);
  act(() => tree!.update(render(false)));
  expect(shown(tree!)).toHaveLength(0);
  act(() => tree!.unmount());
});

it('hands the notice to the page when the sheet closes', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  const render = (sheet: boolean) => (
    <>
      <UndoBar />
      {sheet ? <UndoBar /> : null}
    </>
  );
  act(() => {
    tree = renderer.create(render(true));
  });
  act(() => {
    logWaterGlass();
  });
  act(() => tree!.update(render(false)));
  expect(shown(tree!)).toHaveLength(1);
  act(() => tree!.unmount());
});
