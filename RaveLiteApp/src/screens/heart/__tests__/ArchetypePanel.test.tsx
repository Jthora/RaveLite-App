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
import {MARKS} from '../../../components/icons/elementMarks';

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
  expect(label).toMatch(/\d+ rounds? of sets/);
  expect(label).toMatch(/goal \d+ points/);
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

/**
 * The Knight wears the Starcom mark, not a stock shape. Lucide has no
 * wing, and the Starcom mark already exists in this app — so this row is
 * the one place the archetype list draws an element mark instead of an
 * icon, and it is worth holding: a silent fallback to the shield would
 * look deliberate and be wrong.
 */
it('draws the Archangel Knight with the Starcom mark, in cyan', () => {
  const tree = renderPanel();
  const row = tree.root
    .findAll((n: ReactTestInstance) => n.props.testID === 'archetype-archangel-knight')[0];
  expect(row).toBeDefined();

  const drawn = JSON.stringify(tree.toJSON());

  // The colour alone proves nothing: the badge tint behind the icon is
  // the same hue, so a silent fall back to the shield would still paint
  // this row cyan. The mark is identified by its own path data.
  for (const shape of MARKS.commander) {
    expect(drawn).toContain(shape.d);
  }
  act(() => tree.unmount());
});
