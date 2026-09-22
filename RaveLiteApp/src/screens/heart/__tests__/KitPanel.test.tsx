import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it} from '@jest/globals';

import {KitPanel} from '../KitPanel';
import {AUTHOR_FACTS, toPlaces} from '../../../domain/profile/kit';
import {
  __resetProfileCache,
  authorProfile,
  baseFacts,
  saveProfile,
  setMode,
  setPacks,
} from '../../../domain/profile/repository';
import {store} from '../../../storage';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

function renderPanel() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<KitPanel />);
  });
  return tree!;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];

const press = (tree: renderer.ReactTestRenderer, id: string) =>
  act(() => byTestId(tree, id).props.onPress());

it('opens a new install on its one room, tiles first', () => {
  const tree = renderPanel();
  // One room, already open: setup shows tiles, not a list of one.
  expect(byTestId(tree, 'place-room-1')).toBeDefined();
  expect(byTestId(tree, 'kit-mat')).toBeDefined();
  // A room never asks about sand or a kerb.
  expect(byTestId(tree, 'kit-sand')).toBeUndefined();
  expect(byTestId(tree, 'kit-kerb')).toBeUndefined();
  act(() => tree.unmount());
});

it('ticks a tile onto the place it belongs to', () => {
  const tree = renderPanel();
  press(tree, 'kit-mat');
  const room = baseFacts().places![0];
  expect(room.kit).toContain('mat');
  // What you carry is not in any place.
  press(tree, 'kit-band');
  expect(baseFacts().kit).toContain('band');
  expect(baseFacts().places![0].kit).not.toContain('band');
  act(() => tree.unmount());
});

it('adds a place from a kind, pre-filled, and opens it', () => {
  const tree = renderPanel();
  press(tree, 'places-add');
  press(tree, 'kind-yard');
  const yard = baseFacts().places!.find(p => p.kind === 'yard')!;
  expect(yard.kit).toEqual(expect.arrayContaining(['yard', 'grass']));
  // It is the one open now, so its tiles are the ones showing.
  expect(byTestId(tree, 'kit-sand')).toBeDefined();
  expect(byTestId(tree, 'kit-mat')).toBeUndefined();
  act(() => tree.unmount());
});

it('asks about hanging instead of showing two tiles', () => {
  const tree = renderPanel();
  expect(byTestId(tree, 'kit-hangLow')).toBeUndefined();
  press(tree, 'hang-low');
  expect(baseFacts().places![0].kit).toContain('hangLow');
  press(tree, 'hang-none');
  expect(baseFacts().places![0].kit).not.toContain('hangLow');
  act(() => tree.unmount());
});

it('puts a limit on one place only', () => {
  const tree = renderPanel();
  press(tree, 'limit-lowCeiling');
  const facts = baseFacts();
  expect(facts.places![0].limits).toEqual(['lowCeiling']);
  expect(facts.limits ?? []).toEqual([]);
  act(() => tree.unmount());
});

it('removes a place only on the second tap', () => {
  const tree = renderPanel();
  press(tree, 'place-remove-room-1');
  // Armed, not done: nothing has been saved.
  expect(toPlaces(baseFacts()).places).toHaveLength(1);
  expect(JSON.stringify(tree.toJSON())).toContain('Tap again to remove it');
  press(tree, 'place-remove-room-1');
  expect(baseFacts().places).toHaveLength(0);
  act(() => tree.unmount());
});

it('edits the real kit while away from home, not the hotel room', () => {
  // The panel used to load the facts with the mode applied and save them
  // back: one tap while travelling wrote a floor and a wall over the kit.
  saveProfile(authorProfile());
  setMode('travelling');
  __resetProfileCache();
  const tree = renderPanel();
  press(tree, 'kit-band');
  const facts = baseFacts();
  expect(facts.places).toHaveLength(AUTHOR_FACTS.places!.length);
  expect(facts.kit).toEqual([...AUTHOR_FACTS.kit, 'band']);
  act(() => tree.unmount());
});

it('says a prop needs the Flow arts pack, rather than that it adds nothing', () => {
  setPacks([]);
  const tree = renderPanel();
  const poi = tree.root.findAll(
    (n: ReactTestInstance) => n.props.testID === 'kit-poi',
  )[0];
  expect(poi.props.accessibilityLabel).toBe('Poi, Needs the Flow arts pack');
  act(() => tree.unmount());
});
