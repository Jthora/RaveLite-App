import React from 'react';
import renderer, {act} from 'react-test-renderer';

import {store} from '../../../storage';
import {addEntry} from '../../../domain/training/repository';
import {StandardsSheet} from '../StandardsSheet';

beforeEach(() => store.clearAll());

function render() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<StandardsSheet visible onClose={() => {}} />);
  });
  return tree!;
}

it('lists every event, male table first, with the best test and its grade', () => {
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
