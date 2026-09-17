import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';

import {store} from '../../../storage';
import {activityForDay} from '../../../domain/activity/activity';
import {PracticeRunner} from '../PracticeRunner';
import {PracticeSheet} from '../PracticeSheet';

beforeEach(() => store.clearAll());

const press = (tree: renderer.ReactTestRenderer, id: string) =>
  act(() => {
    tree.root
      .findAll(
        (node: ReactTestInstance) =>
          node.props.testID === id && typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });

it('drills a skill: pick it, count it, log it', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <PracticeSheet visible onClose={() => {}} onEngageLegs={() => {}} />,
    );
  });
  const runner = () => tree!.root.findAllByType(PracticeRunner);

  expect(runner()).toHaveLength(0);
  press(tree!, 'skill-fire.roundhouse-kick');
  expect(runner()).toHaveLength(1);

  press(tree!, 'practice-plus');
  press(tree!, 'practice-plus-ten');
  expect(
    tree!.root.findAll(
      (node: ReactTestInstance) => node.props.testID === 'practice-count',
    )[0].props.children,
  ).toBe('11 reps');

  press(tree!, 'practice-log');
  expect(runner()).toHaveLength(0);
  const [item] = activityForDay();
  expect(item).toMatchObject({label: 'Roundhouse Kick', detail: '11 reps'});
  act(() => tree!.unmount());
});
