import React from 'react';
import renderer, {act} from 'react-test-renderer';

import {store} from '../../../storage';
import {setHeightInches} from '../../../domain/standards/standards';
import {addEntry} from '../../../domain/training/repository';
import {ELEMENTS} from '../../../theme/elements';
import {Goals} from '../Goals';

beforeEach(() => store.clearAll());

function render() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<Goals />);
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
  expect(json).toContain('ACTIVE TODAY');
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

it('dates a goal from two tests a week or more apart, and says how soon push-ups reach 200', () => {
  const day = 86_400_000;
  addEntry({
    at: Date.now() - 14 * day,
    kindId: 'builtin.pullups-amrap',
    value: 6,
  });
  addEntry({at: Date.now(), kindId: 'builtin.pullups-amrap', value: 8});
  const tree = render();
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('On pace for the B+ around');
  // At the assumed push-up max of 10, sets top out at 84 a day.
  expect(json).toContain('top out at 84 a day');
  expect(json).toContain('a tested max of 29 reaches 200');
  act(() => tree.unmount());
});

it('asks for a height, then shows waist-to-height from the waist logged', () => {
  const tree = render();
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Set your height to see the ratio',
  );
  act(() => tree.unmount());

  setHeightInches(70);
  addEntry({at: Date.now(), kindId: 'builtin.waist', value: 35});
  const again = render();
  const json = JSON.stringify(again.toJSON());
  expect(json).toContain('Best 0.50');
  expect(json).toContain('USAF full points');
  expect(json).toContain('Height 70 in · change');
  act(() => again.unmount());
});
