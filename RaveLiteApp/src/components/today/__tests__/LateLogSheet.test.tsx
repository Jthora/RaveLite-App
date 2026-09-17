import React from 'react';
import {StyleSheet} from 'react-native';
import renderer, {act} from 'react-test-renderer';

import {store} from '../../../storage';
import type {SetPrescription} from '../../../domain/program/types';
import type {DayRow} from '../../../domain/today/dayList';
import {LateLogSheet} from '../LateLogSheet';

const row: DayRow = {
  id: 'sets:2026-09-17:round:6',
  at: new Date(2026, 8, 17, 13, 52).getTime(),
  element: 'fire',
  status: 'missed',
  label: 'Push-ups + Chin tucks',
  detail: 'Round 6 of 9',
  move: 'push',
};

const prescription: SetPrescription = {
  trackId: 'push',
  label: 'Push-ups',
  unit: 'reps',
  amount: 5,
  setIndex: 3,
  sets: 4,
  roundIndex: 6,
  rounds: 9,
  moves: [
    {
      trackId: 'push',
      exerciseId: 'fire.pushup-groove',
      element: 'fire',
      label: 'Push-ups',
      unit: 'reps',
      amount: 5,
      setIndex: 3,
      sets: 4,
    },
    {
      trackId: 'posture',
      exerciseId: 'air.chin-tuck',
      element: 'air',
      label: 'Chin tucks',
      unit: 'reps',
      amount: 10,
      setIndex: 3,
      sets: 4,
    },
  ],
};

beforeEach(() => store.clearAll());

/**
 * A Tap wraps its children in one column view, so a label styled with
 * `flex: 1` inside it collapses to nothing — which is exactly how the
 * missed-chime sheet lost every word it was meant to show.
 */
it('says what was missed, and names every move', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <LateLogSheet
        row={row}
        prescription={prescription}
        onDone={() => {}}
        onClose={() => {}}
      />,
    );
  });
  const json = JSON.stringify(tree!.toJSON());
  expect(json).toContain('Push-ups + Chin tucks');
  expect(json).toContain('MISSED');
  // Both move labels, each beside its own −/+.
  expect(json).toContain('Push-ups');
  expect(json).toContain('Chin tucks');
  expect(json).toContain('Did it but didn');

  // The invariant behind that bug: a Tap wraps its children in one column
  // view, so a direct child that relies on flex gets no size and vanishes.
  // The renderer cannot see the collapse, but it can see the flex.
  const taps = tree!.root.findAll(
    node =>
      typeof node.props.testID === 'string' &&
      /^(late-info|late-info-title|move-info-)/.test(node.props.testID) &&
      typeof node.props.onPress === 'function',
  );
  expect(taps.length).toBeGreaterThan(0);
  for (const tap of taps) {
    const [wrapper] = tap.findAll(n => n.props.pointerEvents === 'none');
    expect(wrapper).toBeDefined();
    for (const child of wrapper.children) {
      if (typeof child === 'string') {
        continue;
      }
      // flex: 0 is fine (don't grow); anything positive is the bug.
      const flat = StyleSheet.flatten(child.props.style) ?? {};
      expect(flat.flex ?? 0).toBeLessThanOrEqual(0);
    }
  }
  act(() => tree!.unmount());
});

it('opens what it asked for, whole and move by move', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <LateLogSheet
        row={row}
        prescription={prescription}
        onDone={() => {}}
        onClose={() => {}}
      />,
    );
  });
  const press = (id: string) =>
    act(() => {
      tree!.root
        .findAll(
          node =>
            node.props.testID === id &&
            typeof node.props.onPress === 'function',
        )[0]
        .props.onPress();
    });
  press('late-info');
  expect(JSON.stringify(tree!.toJSON())).toContain('Round 6 of 9');
  press('info-close');
  press('move-info-Chin tucks');
  expect(JSON.stringify(tree!.toJSON())).toContain('deep neck flexors');
  act(() => tree!.unmount());
});
