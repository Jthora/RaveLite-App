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
  loadPushupGoal,
  loadShape,
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
    // Any journal entry at all counts as a life already lived here.
    append({
      kind: 'reminder.fired',
      at: Date.now(),
      element: 'fire',
      pulseId: 'p1',
    });
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

it('says the dangerous part before anything else', () => {
  // First card, not last: somebody who taps Skip on the opening screen
  // has still had it in front of them.
  const {tree} = renderFlow();
  expect(byTestId(tree, 'disclaimer')).toBeDefined();
  const said = textOf(tree);
  expect(said).toContain('not a medical device');
  expect(said).toContain('Stop if it hurts');
  expect(said).toContain('Talk to a doctor');
  act(() => tree.unmount());
});

it('walks the questions, and every one is a panel Settings also uses', () => {
  const {tree} = renderFlow();
  act(() => byTestId(tree, 'setup-next').props.onPress());

  expect(textOf(tree)).toContain('What are you training for?');
  expect(byTestId(tree, 'archetype-raver')).toBeDefined();

  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(byTestId(tree, 'kit-mat')).toBeDefined();

  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(textOf(tree)).toContain('When does your day run?');
  expect(textOf(tree)).toContain('Starts');

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
  for (let i = 0; i < 7; i += 1) {
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
  for (let i = 0; i < 5; i += 1) {
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
  expect(line()).toMatch(/^\d+ chimes a day · \d+ drills$/);

  // Take the leanest archetype: the numbers under the card have to move.
  const before = line();
  act(() => byTestId(tree, 'setup-next').props.onPress());
  act(() => byTestId(tree, 'archetype-parent').props.onPress());
  act(() => byTestId(tree, 'archetype-parent').props.onPress());
  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(line()).not.toBe(before);
  act(() => tree.unmount());
});

it('can be skipped, and skipping leaves a gentle start', () => {
  const {tree, onDone} = renderFlow();
  act(() => byTestId(tree, 'setup-skip').props.onPress());

  expect(onDone).toHaveBeenCalled();
  __resetProfileCache();
  expect(needsSetup()).toBe(false);
  // Nothing was chosen, so a stranger gets the base program at an easy
  // start — not every pack, 200 push-ups and the author's desk day.
  expect(loadArchetype()).toBeUndefined();
  expect(loadPacks()).toEqual([]);
  expect(loadPushupGoal()).toBe(100);
  expect(loadShape()).toBe('office');
  expect(loadStarting()).toBe('new');
  act(() => tree.unmount());
});

it('steps back on Android Back instead of skipping', () => {
  const {tree, onDone} = renderFlow();
  act(() => byTestId(tree, 'setup-next').props.onPress());
  act(() => byTestId(tree, 'setup-next').props.onPress());
  expect(byTestId(tree, 'kit-mat')).toBeDefined();

  const modal = tree.root.find(
    (n: ReactTestInstance) => typeof n.props.onRequestClose === 'function',
  );
  act(() => modal.props.onRequestClose());
  expect(textOf(tree)).toContain('What are you training for?');
  expect(onDone).not.toHaveBeenCalled();
  act(() => tree.unmount());
});

it('takes an archetype on the first tap during setup', () => {
  const {tree} = renderFlow();
  act(() => byTestId(tree, 'setup-next').props.onPress());
  act(() => byTestId(tree, 'archetype-monk').props.onPress());
  __resetProfileCache();
  expect(loadArchetype()).toBe('monk');
  act(() => tree.unmount());
});

it('comes back if the app was closed part way through', () => {
  const {tree} = renderFlow();
  act(() => byTestId(tree, 'setup-next').props.onPress());
  act(() => byTestId(tree, 'setup-next').props.onPress());
  act(() => byTestId(tree, 'kit-mat').props.onPress());
  act(() => tree.unmount());
  // A chime fired while it was closed; nobody answered it.
  append({
    kind: 'reminder.fired',
    at: Date.now(),
    pulseId: 'p1',
    element: 'air',
  } as never);
  __resetProfileCache();
  expect(needsSetup()).toBe(true);
});
