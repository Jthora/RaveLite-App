import React from 'react';
import {Modal} from 'react-native';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {TargetFilterStrip} from '../../../components/TargetFilterStrip';
import {TrainingLogSheet} from '../../../components/training/TrainingLogSheet';
import {activityForDay} from '../../../domain/activity/activity';
import {getElementPrefs} from '../../../domain/settings/elementPrefs';
import {addEntry} from '../../../domain/training/repository';
import {store} from '../../../storage';
import {ELEMENTS, type ElementId} from '../../../theme/elements';
import {ElementPage} from '../ElementPage';
import {subscribePracticeRequest} from '../../../shell/practiceRequest';

const DAY = 86_400_000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 14, 10, 0));
  store.clearAll();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderPage(id: Exclude<ElementId, 'heart'> = 'earth') {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<ElementPage element={ELEMENTS[id]} />);
  });
  return tree!;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((node: ReactTestInstance) => node.props.testID === id)[0];

const trainRows = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAll(
    (node: ReactTestInstance) =>
      typeof node.props.testID === 'string' &&
      node.props.testID.startsWith('day-row-train:'),
  );

it('opens one sheet at a time, and says so when the entry is gone', () => {
  // Same two faults Today had: two sheets open at once, and a Train row
  // whose entry was deleted doing nothing at all.
  const tree = renderPage();
  const rows = tree.root
    .findAll(
      (n: ReactTestInstance) =>
        typeof n.props?.testID === 'string' &&
        n.props.testID.startsWith('day-row-'),
    )
    .filter(
      (n, i2, all) =>
        all.findIndex(o => o.props.testID === n.props.testID) === i2,
    );
  const openSheets = () =>
    tree.root.findAllByType(Modal).filter(m => m.props.visible !== false)
      .length;
  for (const row of rows) {
    act(() => row.props.onPress());
    expect({row: row.props.testID, open: openSheets()}).toEqual({
      row: row.props.testID,
      open: 1,
    });
  }
  act(() => tree.unmount());
});

it('keeps the focus areas chosen in the library', () => {
  const tree = renderPage();
  act(() => {
    byTestId(tree, 'library-open').props.onPress();
  });
  act(() => {
    tree.root.findByType(TargetFilterStrip).props.onChange(['Core']);
  });
  expect(getElementPrefs('earth')).toEqual({
    focusTargets: ['Core'],
    focusLocked: true,
  });
  act(() => tree.unmount());
});

it('Swap offers a different drill; Done logs it and the stats follow', () => {
  const tree = renderPage();
  const pickName = () => byTestId(tree, 'pick-name').props.children;
  const first = pickName();
  act(() => {
    byTestId(tree, 'pick-swap').props.onPress();
  });
  expect(pickName()).not.toEqual(first);
  act(() => {
    byTestId(tree, 'pick-done').props.onPress();
  });
  expect(activityForDay()).toHaveLength(1);
  expect(byTestId(tree, 'element-stats').props.children).toBe(
    '2/20 today · 2 this week · 1-day streak',
  );
  act(() => tree.unmount());
});

it('opens a Train entry from the day log for edit', () => {
  const entry = addEntry({
    at: Date.now() - 60_000,
    kindId: 'builtin.run-2mi',
    value: 1093,
  });
  const tree = renderPage('fire');
  act(() => {
    byTestId(tree, `day-row-train:${entry.id}`).props.onPress();
  });
  expect(tree.root.findByType(TrainingLogSheet).props.editing?.id).toBe(
    entry.id,
  );
  act(() => tree.unmount());
});

it('a tap on the ribbon shows the day under the finger', () => {
  addEntry({at: Date.now() - 2 * DAY, kindId: 'builtin.run-2mi', value: 1093});
  const tree = renderPage('fire');
  expect(trainRows(tree)).toHaveLength(0);
  act(() => {
    byTestId(tree, 'day-ribbon').props.onLayout({
      nativeEvent: {layout: {width: 280}},
    });
  });
  // 14 days across 280 dp: two days back is the 12th column, 220–240 dp.
  act(() => {
    byTestId(tree, 'day-ribbon').props.onPress({
      nativeEvent: {locationX: 230},
    });
  });
  expect(trainRows(tree)).not.toHaveLength(0);
  act(() => tree.unmount());
});

it('points the Water page at the paths in Practice', () => {
  const asked: Array<string | undefined> = [];
  const off = subscribePracticeRequest(path => asked.push(path));
  const onBack = jest.fn();
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <ElementPage element={ELEMENTS.water} onBack={onBack} />,
    );
  });
  expect(byTestId(tree!, 'water-paths')).toBeDefined();
  act(() => byTestId(tree!, 'discipline-dance').props.onPress());
  // Practice belongs to Today: the page asks for it and goes back.
  expect(asked).toEqual(['dance']);
  expect(onBack).toHaveBeenCalled();
  off();
  act(() => tree!.unmount());
  // Only Water carries them.
  const fire = renderPage('fire');
  expect(byTestId(fire, 'water-paths')).toBeUndefined();
  act(() => fire.unmount());
});
