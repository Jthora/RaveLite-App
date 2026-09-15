import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {CatchUpSheet} from '../../../components/today/CatchUpSheet';
import {LateLogSheet} from '../../../components/today/LateLogSheet';
import {LoggedSheet} from '../../../components/today/LoggedSheet';
import {activityForDay} from '../../../domain/activity/activity';
import {store} from '../../../storage';
import * as runtime from '../../../domain/ambient/pulseRuntime';
import {DailySetsSheet} from '../DailySetsSheet';
import {SettingsSheet} from '../SettingsSheet';
import {StandardsSheet} from '../StandardsSheet';
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
        permission="granted"
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
  expect(byTestId(tree, 'today-header').props.children).toBe('Today');
  act(() => tree.unmount());
});

it('+1 logs a glass; the count and the streak follow', () => {
  const tree = renderToday();
  act(() => {
    byTestId(tree, 'water-add').props.onPress();
  });
  expect(byTestId(tree, 'water-count').props.children).toEqual([1, '/', 8]);
  expect(byTestId(tree, 'today-header').props.children).toBe(
    'Today · 1-day streak',
  );
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

it('the gear opens Settings and the meters open Daily Sets', () => {
  const tree = renderToday();
  expect(tree.root.findByType(SettingsSheet).props.visible).toBe(false);
  expect(tree.root.findByType(DailySetsSheet).props.visible).toBe(false);
  act(() => {
    byTestId(tree, 'settings-open').props.onPress();
  });
  expect(tree.root.findByType(SettingsSheet).props.visible).toBe(true);
  act(() => {
    byTestId(tree, 'sets-open').props.onPress();
  });
  expect(tree.root.findByType(DailySetsSheet).props.visible).toBe(true);
  act(() => tree.unmount());
});

it('the push-up row opens Standards, apart from the Daily Sets card', () => {
  const tree = renderToday();
  const row = byTestId(tree, 'pushups-open');
  // Its own button, not nested in the card's (a nested one loses the tap).
  expect(
    tree.root
      .findAll((node: ReactTestInstance) => node.props.testID === 'sets-open')
      .some(card => card.findAll(n => n === row).length > 0),
  ).toBe(false);
  act(() => {
    row.props.onPress();
  });
  expect(tree.root.findByType(StandardsSheet).props.visible).toBe(true);
  expect(tree.root.findByType(DailySetsSheet).props.visible).toBe(false);
  act(() => tree.unmount());
});

it('a missed chime opens to be logged, and Done marks it done', () => {
  const tree = renderToday();
  const missed = tree.root.findAll(
    (node: ReactTestInstance) =>
      typeof node.props.testID === 'string' &&
      node.props.testID.startsWith('day-row-') &&
      !node.props.testID.startsWith('day-row-train:') &&
      !node.props.testID.startsWith('day-row-journal:'),
  )[0];
  expect(missed).toBeDefined();
  const pulseId = missed.props.testID.replace('day-row-', '');
  act(() => {
    missed.props.onPress();
  });
  expect(tree.root.findByType(LateLogSheet).props.row?.id).toBe(pulseId);
  act(() => {
    byTestId(tree, 'late-done').props.onPress();
  });
  expect(activityForDay().some(item => item.pulseId === pulseId)).toBe(true);
  expect(tree.root.findByType(LateLogSheet).props.row).toBeUndefined();
  act(() => tree.unmount());
});

it('a logged row can be removed, and stops counting', () => {
  const tree = renderToday();
  act(() => {
    byTestId(tree, 'water-add').props.onPress();
  });
  const row = tree.root.findAll(
    (node: ReactTestInstance) =>
      typeof node.props.testID === 'string' &&
      node.props.testID.startsWith('day-row-journal:'),
  )[0];
  act(() => {
    row.props.onPress();
  });
  expect(tree.root.findByType(LoggedSheet).props.row).toBeDefined();
  act(() => {
    byTestId(tree, 'logged-remove').props.onPress();
  });
  expect(activityForDay()).toEqual([]);
  expect(byTestId(tree, 'water-count').props.children).toEqual([0, '/', 8]);
  act(() => tree.unmount());
});

it('catch up logs several missed chimes at once', () => {
  jest.setSystemTime(new Date(2026, 8, 14, 13, 0));
  const tree = renderToday();
  act(() => {
    byTestId(tree, 'catch-up-open').props.onPress();
  });
  expect(tree.root.findByType(CatchUpSheet).props.visible).toBe(true);
  const ids: string[] = [
    ...new Set(
      tree.root
        .findAll(
          (node: ReactTestInstance) =>
            typeof node.props.testID === 'string' &&
            node.props.testID.startsWith('catch-up-row-'),
        )
        .map(node => node.props.testID.replace('catch-up-row-', '')),
    ),
  ];
  expect(ids.length).toBeGreaterThanOrEqual(2);
  for (const id of ids.slice(0, 2)) {
    act(() => {
      byTestId(tree, `catch-up-row-${id}`).props.onPress();
    });
  }
  act(() => {
    byTestId(tree, 'catch-up-log').props.onPress();
  });
  const pulseIds = activityForDay().map(item => item.pulseId);
  expect(pulseIds).toEqual(expect.arrayContaining(ids.slice(0, 2)));
  expect(tree.root.findByType(CatchUpSheet).props.visible).toBe(false);
  act(() => tree.unmount());
});
