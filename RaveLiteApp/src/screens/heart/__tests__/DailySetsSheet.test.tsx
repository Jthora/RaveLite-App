import React from 'react';
import {Modal} from 'react-native';
import renderer, {act} from 'react-test-renderer';

import {addEntry} from '../../../domain/training/repository';
import {authorProfile, saveProfile} from '../../../domain/profile/repository';
import {store} from '../../../storage';
import {CharacterSheet} from '../CharacterSheet';
import {DailySetsSheet} from '../DailySetsSheet';
import {Goals} from '../Goals';

beforeEach(() => {
  store.clearAll();
  // The author's week; a fresh store is a stranger's bare room, whose
  // kicks have stand-ins.
  saveProfile(authorProfile());
});

it('shows Goals in the same sheet; Back returns to Daily Sets, then closes', () => {
  const onClose = jest.fn();
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={onClose} />);
  });
  const goalsShown = () => tree!.root.findAllByType(Goals).length > 0;
  const back = () => tree!.root.findAllByType(Modal)[0].props.onRequestClose();
  expect(goalsShown()).toBe(false);
  act(() => {
    tree!.root
      .findAll(node => node.props.testID === 'goals-open')[0]
      .props.onPress();
  });
  expect(goalsShown()).toBe(true);
  act(() => back());
  expect(goalsShown()).toBe(false);
  expect(onClose).not.toHaveBeenCalled();
  act(() => back());
  expect(onClose).toHaveBeenCalledTimes(1);
  act(() => tree!.unmount());
});

it("shows today's focus, its morning block, and the week ahead", () => {
  jest.useFakeTimers();
  // Monday 14 Sep 2026: the program starts today.
  jest.setSystemTime(new Date(2026, 8, 14, 10));
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={() => {}} />);
  });
  const json = JSON.stringify(tree!.toJSON());
  expect(json).toContain('Kicks and flips');
  expect(json).toContain('Roundhouse Kick');
  expect(json).toContain('This week');
  // Saturday of week 1 is the Air Force test.
  expect(json).toContain('Air Force test');
  act(() => tree!.unmount());
  jest.useRealTimers();
});

it("opens the character sheet from today's focus, and Back comes home", () => {
  // The sheet stays closed until there is something on it to read (see
  // CharacterSheet), so give it a week of training before asking for the
  // grid — otherwise this tests the locked card instead.
  for (let ago = 0; ago < 7; ago += 1) {
    addEntry({
      at: Date.now() - ago * 86_400_000,
      kindId: 'builtin.staff-session',
      value: 10 * 60,
    });
  }
  const onClose = jest.fn();
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={onClose} />);
  });
  const shown = () => tree!.root.findAllByType(CharacterSheet).length > 0;
  expect(shown()).toBe(false);
  act(() => {
    tree!.root
      .findAll(node => node.props.testID === 'today-focus')[0]
      .props.onPress();
  });
  expect(shown()).toBe(true);
  expect(JSON.stringify(tree!.toJSON())).toContain('Toughness');
  // Tapping a cell opens what it is, how it's trained and where it stands.
  act(() => {
    tree!.root
      .findAll(
        node =>
          node.props.testID === 'cell-toughness' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });
  const json = JSON.stringify(tree!.toJSON());
  expect(json).toContain('Holding load.');
  expect(json).toContain('Level 0');
  // Back walks out of the card first, then off the sheet, then closes.
  const back = () => tree!.root.findAllByType(Modal)[0].props.onRequestClose();
  act(() => back());
  expect(shown()).toBe(true);
  act(() => back());
  expect(shown()).toBe(false);
  expect(onClose).not.toHaveBeenCalled();
  act(() => tree!.unmount());
});

it('a track card opens what the track is, and Back keeps working', () => {
  const onClose = jest.fn();
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={onClose} />);
  });
  const back = () => tree!.root.findAllByType(Modal)[0].props.onRequestClose();
  act(() => {
    tree!.root
      .findAll(
        node =>
          node.props.testID === 'track-info-push' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });
  const json = JSON.stringify(tree!.toJSON());
  expect(json).toContain('THE LADDER');
  expect(json).toContain('Push-ups');
  // Back closes the card, not the sheet.
  act(() => back());
  expect(JSON.stringify(tree!.toJSON())).not.toContain('THE LADDER');
  expect(onClose).not.toHaveBeenCalled();
  act(() => tree!.unmount());
});

it('a Goals event opens what the test asks for', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DailySetsSheet visible onClose={() => {}} />);
  });
  act(() => {
    tree!.root
      .findAll(node => node.props.testID === 'goals-open')[0]
      .props.onPress();
  });
  act(() => {
    tree!.root
      .findAll(
        node =>
          node.props.testID === 'event-info-plank' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });
  const json = JSON.stringify(tree!.toJSON());
  expect(json).toContain('forearm plank');
  expect(json).toContain('LOG IT WITH');
  act(() => tree!.unmount());
});
