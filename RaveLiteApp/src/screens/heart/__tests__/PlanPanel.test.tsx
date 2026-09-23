/**
 * The plan is the one thing in Settings a person builds by hand — the
 * hours their chimes come from. Deleting it is not undoable, and it used
 * to happen on a single tap of a row labelled "Reset to factory
 * defaults": no confirmation, no statement of what went, straight to
 * disk. These tests hold the arming, because the cost of losing it is
 * somebody's whole plan and there is nothing to restore it from.
 */
import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it} from '@jest/globals';

import {PlanPanel} from '../PlanPanel';
import {loadPlan, savePlan} from '../../../domain/reminders/repository';
import {addWindow, makeWindow} from '../../../domain/reminders/planMutations';
import {store} from '../../../storage';

beforeEach(() => {
  store.clearAll();
});

function render() {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<PlanPanel />);
  });
  return tree;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];

const textOf = (tree: renderer.ReactTestRenderer) =>
  JSON.stringify(tree.toJSON());

/** A plan with a window the default does not have. */
function aPlanOfMyOwn() {
  const mine = addWindow(loadPlan(), makeWindow());
  savePlan(mine);
  return mine;
}

it('does not delete the plan on one tap', () => {
  const mine = aPlanOfMyOwn();
  const tree = render();

  act(() => byTestId(tree, 'plan-reset').props.onPress());

  expect(loadPlan().windows.length).toBe(mine.windows.length);
  act(() => tree.unmount());
});

it('says what it is about to delete, before it deletes it', () => {
  aPlanOfMyOwn();
  const tree = render();
  expect(textOf(tree)).not.toContain('Tap to confirm');

  act(() => byTestId(tree, 'plan-reset').props.onPress());

  // Not "factory defaults" — the words name what goes.
  expect(textOf(tree)).toContain('deletes every chime time you made');
  act(() => tree.unmount());
});

it('deletes on the second tap', () => {
  const mine = aPlanOfMyOwn();
  const tree = render();

  act(() => byTestId(tree, 'plan-reset').props.onPress());
  act(() => byTestId(tree, 'plan-reset').props.onPress());

  expect(loadPlan().windows.length).toBeLessThan(mine.windows.length);
  act(() => tree.unmount());
});
