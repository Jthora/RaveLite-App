import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it, jest} from '@jest/globals';

import {SetupFlow} from '../SetupFlow';
import {addEntry} from '../../../domain/training/repository';
import {
  __resetProfileCache,
  finishSetup,
  loadArchetype,
  loadPacks,
  needsSetup,
  setFacts,
} from '../../../domain/profile/repository';
import {AUTHOR_FACTS} from '../../../domain/profile/kit';
import {loadStarting} from '../../../domain/profile/repository';
import {loadProgram} from '../../../domain/program/repository';
import {append} from '../../../domain/journal/journal';
import {store} from '../../../storage';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

/**
 * The worst bug this app could have is showing setup to someone with a
 * year of training in it. Three independent guards, each tested alone.
 */
describe('who gets asked', () => {
  it('asks a genuinely empty install', () => {
    expect(needsSetup()).toBe(true);
  });

  it('never asks again once answered', () => {
    finishSetup();
    __resetProfileCache();
    expect(needsSetup()).toBe(false);
  });

  it('never asks someone who has trained, even unanswered', () => {
    addEntry({at: Date.now(), kindId: 'builtin.run-2mi', value: 1040});
    __resetProfileCache();
    expect(needsSetup()).toBe(false);
  });

  it('never asks someone with a journal, even with no training log', () => {
    append({kind: 'water', at: Date.now()});
    __resetProfileCache();
    expect(needsSetup()).toBe(false);
  });

  it('never asks someone who has already set their kit', () => {
    setFacts(AUTHOR_FACTS);
    __resetProfileCache();
    expect(needsSetup()).toBe(false);
  });
});

function renderFlow(onDone = jest.fn()) {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<SetupFlow onDone={onDone} />);
  });
  return {tree: tree!, onDone};
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];

const textOf = (tree: renderer.ReactTestRenderer) =>
  JSON.stringify(tree.toJSON());

it('walks the questions, and every one is a panel Settings also uses', () => {
  const {tree} = renderFlow();

  expect(textOf(tree)).toContain('What are you training for?');
  expect(byTestId(tree, 'archetype-raver')).toBeDefined();

  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(byTestId(tree, 'kit-mat')).toBeDefined();

  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(byTestId(tree, 'shape-desk')).toBeDefined();

  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(byTestId(tree, 'starting-new')).toBeDefined();

  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(byTestId(tree, 'pack-dance')).toBeDefined();
  act(() => tree.unmount());
});

it('shows a real day at the end, and Start closes it for good', () => {
  const {tree, onDone} = renderFlow();
  for (let i = 0; i < 5; i += 1) {
    act(() => byTestId(tree, 'setup-next').props.onPress());
  }
  expect(textOf(tree)).toContain("Here's your day");
  expect(textOf(tree)).toContain('chimes a day');

  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(onDone).toHaveBeenCalled();
  __resetProfileCache();
  expect(needsSetup()).toBe(false);
  act(() => tree.unmount());
});

it('asks where you are starting, and seeds the maxes from the answer', () => {
  const {tree} = renderFlow();
  for (let i = 0; i < 3; i += 1) {
    act(() => byTestId(tree, 'setup-next').props.onPress());
  }
  act(() => byTestId(tree, 'starting-new').props.onPress());
  __resetProfileCache();
  expect(loadStarting()).toBe('new');
  // A beginner's pull-up ladder does not start at the author's three.
  expect(loadProgram().tracks.pull.testMax).toBeLessThan(3);
  act(() => tree.unmount());
});

it('the preview is the program, not a promise about it', () => {
  const {tree} = renderFlow();
  const line = () => byTestId(tree, 'setup-preview').props.children as string;
  expect(line()).toMatch(/\d+ chimes · \d+ tracks · \d+ drills · par \d+/);

  // Take the leanest archetype: the numbers under the card have to move.
  const before = line();
  act(() => byTestId(tree, 'archetype-parent').props.onPress());
  act(() => byTestId(tree, 'archetype-parent').props.onPress());
  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(line()).not.toBe(before);
  act(() => tree.unmount());
});

it('can be skipped, and skipping still leaves a working program', () => {
  const {tree, onDone} = renderFlow();
  act(() => byTestId(tree, 'setup-skip').props.onPress());

  expect(onDone).toHaveBeenCalled();
  __resetProfileCache();
  expect(needsSetup()).toBe(false);
  // Nothing was chosen, so nothing was narrowed.
  expect(loadArchetype()).toBeUndefined();
  expect(loadPacks().length).toBeGreaterThan(0);
  act(() => tree.unmount());
});
