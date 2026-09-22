import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';

import {store} from '../../../storage';
import {activityForDay} from '../../../domain/activity/activity';
import {PracticeRunner} from '../PracticeRunner';
import {PracticeSheet} from '../PracticeSheet';
import {listCircuits} from '../../../domain/circuit/customRepository';

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

it('Back in the circuit editor goes back to Practice, and saves no Untitled circuit', () => {
  const onClose = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PracticeSheet visible onClose={onClose} onEngageLegs={() => {}} />,
    );
  });
  const find = (id: string) =>
    tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];
  act(() => find('circuit-new').props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain('NEW CIRCUIT');

  const modal = tree.root.find(
    (n: ReactTestInstance) => typeof n.props.onRequestClose === 'function',
  );
  act(() => modal.props.onRequestClose());
  expect(onClose).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).not.toContain('NEW CIRCUIT');
  expect(listCircuits()).toEqual([]);

  act(() => modal.props.onRequestClose());
  expect(onClose).toHaveBeenCalled();
  act(() => tree.unmount());
});
