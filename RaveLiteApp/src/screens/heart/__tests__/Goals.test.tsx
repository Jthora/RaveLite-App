import React from 'react';
import renderer, {act} from 'react-test-renderer';

import {store} from '../../../storage';
import {setHeightInches} from '../../../domain/standards/standards';
import {addEntry} from '../../../domain/training/repository';
import {ELEMENTS} from '../../../theme/elements';
import {Goals} from '../Goals';
import {beginSetup} from '../../../domain/profile/setup';
import {
  __resetProfileCache,
  setPacks,
  showsGrades,
} from '../../../domain/profile/repository';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

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
  expect(json).toContain('3-mile estimate');
  expect(json).toContain('Assumed until you log a run of a mile or more.');
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
  expect(json).toContain('A tested max of 29 reaches 200');
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

it('grades nobody without the military tests pack, and assumes no run', () => {
  beginSetup();
  addEntry({at: Date.now(), kindId: 'builtin.squats-amrap', value: 40});
  const tree = render();
  const json = JSON.stringify(tree.toJSON());
  for (const grade of ['A+', 'B+', 'D−', ' · B ', ' · C ', ' · F ']) {
    expect(json).not.toContain(grade);
  }
  expect(json).not.toContain('Assumed until');
  expect(json).toContain('No runs yet.');
  // A stranger's day is not the author's two and a half hours.
  expect(json).toContain('" / ","30"," min"');
  act(() => tree.unmount());
});

it('asks a new install which charts grade them, rather than assuming male', () => {
  beginSetup();
  setPacks(['military-tests']);
  addEntry({at: Date.now(), kindId: 'builtin.pullups-amrap', value: 8});
  const tree = render();
  let json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Which charts grade your tests?');
  expect(json).toContain('The app has the charts for ages 35–40 only.');
  // No targets or grades until they answer.
  expect(json).not.toContain('Best 8');
  expect(showsGrades()).toBe(false);
  act(() => {
    tree.root
      .findAll(node => node.props.testID === 'table-female')[0]
      .props.onPress();
  });
  json = JSON.stringify(tree.toJSON());
  expect(json).not.toContain('Which charts grade your tests?');
  expect(json).toContain('Best 8');
  expect(json).toContain('USMC: D− 3 · B+ 9 · A+ 10');
  expect(showsGrades()).toBe(true);
  act(() => tree.unmount());
});

it("keeps the men's charts on the author's install without asking", () => {
  const tree = render();
  expect(JSON.stringify(tree.toJSON())).not.toContain(
    'Which charts grade your tests?',
  );
  expect(showsGrades()).toBe(true);
  act(() => tree.unmount());
});
