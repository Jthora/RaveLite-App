import React from 'react';
import renderer, {act} from 'react-test-renderer';

import {store} from '../../../storage';
import {addEntry} from '../../../domain/training/repository';
import {ELEMENTS} from '../../../theme/elements';
import {GoalsSheet} from '../GoalsSheet';

beforeEach(() => store.clearAll());

function render() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<GoalsSheet visible onClose={() => {}} />);
  });
  return tree!;
}

it('leads with the fitness tests, male table first, with the best test and its grade', () => {
  addEntry({at: Date.now(), kindId: 'builtin.pullups-amrap', value: 8});
  const tree = render();
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Pull-ups');
  expect(json).toContain('Best 8');
  expect(json).toContain('D+ USMC');
  expect(json).toContain('USMC: D− 5 · B+ 17 · A+ 21');
  expect(json).toContain('Maneuver under fire');
  act(() => tree.unmount());
});

it('the female table can lead instead', () => {
  const tree = render();
  act(() => {
    tree.root
      .findAll(node => node.props.testID === 'table-female')[0]
      .props.onPress();
  });
  expect(JSON.stringify(tree.toJSON())).toContain('USMC: D− 3 · B+ 9 · A+ 10');
  act(() => tree.unmount());
});

it('has a section for each other element, graded on RaveLite marks', () => {
  addEntry({at: Date.now(), kindId: 'builtin.squats-amrap', value: 40});
  const tree = render();
  const sections = tree.root
    .findAll(
      node =>
        typeof node.props.testID === 'string' &&
        node.props.testID.startsWith('goals-') &&
        typeof node.type === 'string',
    )
    .map(node => node.props.testID);
  expect(sections).toEqual([
    'goals-tests',
    'goals-air',
    'goals-heart',
    'goals-earth',
    'goals-water',
  ]);
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain(ELEMENTS.heart.name);
  expect(json).toContain('Squats, one set');
  expect(json).toContain('D− 20 · B+ 64 · A+ 80');
  expect(json).toContain('C−');
  // Sets done is measured, not logged: no Log a test until a week has run.
  expect(json).toContain('After a week of Daily Sets');
  expect(
    tree.root.findAll(node => node.props.testID === 'log-sets-done'),
  ).toHaveLength(0);
  act(() => tree.unmount());
});
