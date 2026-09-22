import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {Text} from 'react-native';
import {expect, it, jest} from '@jest/globals';

import {MyDaySheet} from '../MyDaySheet';
import type {ActiveHours} from '../../../domain/ambient/types';

const ALL = 0b1111111;

function render(value: ActiveHours) {
  const onSave = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <MyDaySheet visible value={value} onClose={() => {}} onSave={onSave} />,
    );
  });
  const texts = () =>
    tree.root.findAllByType(Text).map(t => [t.props.children].flat().join(''));
  const button = (label: string) =>
    tree.root.find(
      (n: ReactTestInstance) =>
        typeof n.props.onPress === 'function' &&
        (n.props.accessibilityLabel === label ||
          n.findAllByType(Text).some(t => t.props.children === label)),
    );
  const press = (label: string) => act(() => button(label).props.onPress());
  return {texts, press, button, onSave};
}

it('saves a day that ends after midnight, and says so', () => {
  const sheet = render({start: '22:00', end: '06:00', daysMask: ALL});
  expect(sheet.texts()).toContain('Ends the next day at 06:00.');
  sheet.press('Save');
  expect(sheet.onSave).toHaveBeenCalledWith({
    start: '22:00',
    end: '06:00',
    daysMask: ALL,
  });
});

it('goes round the clock instead of stopping at 23:30', () => {
  const sheet = render({start: '09:00', end: '23:30', daysMask: ALL});
  sheet.press('Ends later');
  sheet.press('Ends later');
  expect(sheet.texts()).toContain('00:30');
});

it('refuses a day too short to hold the rounds', () => {
  const sheet = render({start: '09:00', end: '11:00', daysMask: ALL});
  expect(sheet.texts()).toContain('My day must be at least 4 hours.');
  expect(sheet.button('Save').props.disabled).toBe(true);
});
