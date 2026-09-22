import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it} from '@jest/globals';

import {ArchetypePanel} from '../ArchetypePanel';
import {
  __resetProfileCache,
  finishSetup,
  loadArchetype,
  loadPacks,
  loadShape,
} from '../../../domain/profile/repository';
import {store} from '../../../storage';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

function renderPanel() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<ArchetypePanel />);
  });
  return tree!;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];

it('will not replace a program on one tap', () => {
  finishSetup();
  const tree = renderPanel();

  act(() => {
    byTestId(tree, 'archetype-monk').props.onPress();
  });
  // Asked, not done.
  expect(loadArchetype()).toBeUndefined();
  expect(byTestId(tree, 'archetype-monk').props.accessibilityLabel).toContain(
    'Tap again',
  );

  act(() => {
    byTestId(tree, 'archetype-monk').props.onPress();
  });
  __resetProfileCache();
  expect(loadArchetype()).toBe('monk');
  expect(loadPacks()).toEqual(['yoga-taichi']);
  expect(loadShape()).toBe('office');
});

it('says what taking one would cost before it costs it', () => {
  const tree = renderPanel();
  const label = byTestId(tree, 'archetype-parent').props.accessibilityLabel;

  // The preview has to be concrete, or it is decoration.
  expect(label).toMatch(/\d+ chimes/);
  expect(label).toMatch(/par \d+/);
  expect(label).toContain('ten minutes at a time');
});

it('a second archetype replaces the first cleanly', () => {
  const tree = renderPanel();
  for (const id of ['archetype-raver', 'archetype-raver']) {
    act(() => byTestId(tree, id).props.onPress());
  }
  __resetProfileCache();
  expect(loadPacks()).toContain('dance');

  for (const id of ['archetype-guardian', 'archetype-guardian']) {
    act(() => byTestId(tree, id).props.onPress());
  }
  __resetProfileCache();
  expect(loadPacks()).toContain('martial');
  expect(loadPacks()).not.toContain('dance');
});
