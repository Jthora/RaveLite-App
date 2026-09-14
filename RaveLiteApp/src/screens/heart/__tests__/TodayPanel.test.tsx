import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {store} from '../../../storage';
import * as runtime from '../../../domain/ambient/pulseRuntime';
import {TodayPanel} from '../TodayPanel';

// Monday 14 Sep 2026, 10:00 — inside My day, so a chime can sound.
const TEN_AM = new Date(2026, 8, 14, 10, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TEN_AM);
  store.clearAll();
  runtime.__test.reset();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderToday() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <TodayPanel
        onOpenProgress={() => {}}
        onElementPress={() => {}}
        onEngageLegs={() => {}}
      />,
    );
  });
  return tree!;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((node: ReactTestInstance) => node.props.testID === id)[0];

it('shows today with an empty water count', () => {
  const tree = renderToday();
  expect(byTestId(tree, 'water-count').props.children).toEqual([0, '/', 8]);
  act(() => tree.unmount());
});

it('+1 logs a glass and the count follows', () => {
  const tree = renderToday();
  act(() => {
    byTestId(tree, 'water-add').props.onPress();
  });
  expect(byTestId(tree, 'water-count').props.children).toEqual([1, '/', 8]);
  act(() => tree.unmount());
});

it('Done answers the chime that is sounding', () => {
  act(() => {
    runtime.enqueueNow({element: 'air', exerciseId: 'air.physiological-sigh'});
  });
  expect(runtime.getActivePulseSummary()).toBeDefined();
  const tree = renderToday();
  act(() => {
    byTestId(tree, 'chime-done').props.onPress();
  });
  expect(runtime.getActivePulseSummary()).toBeUndefined();
  act(() => tree.unmount());
});
