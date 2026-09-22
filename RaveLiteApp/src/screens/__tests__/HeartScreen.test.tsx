import notifee from '@notifee/react-native';
import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import HeartScreen from '../HeartScreen';
import {NotificationsOff} from '../../components/today/NotificationsOff';
import {
  __resetProfileCache,
  finishSetup,
} from '../../domain/profile/repository';
import {beginSetup} from '../../domain/profile/setup';
import * as runtime from '../../domain/ambient/pulseRuntime';
import {store} from '../../storage';

const ask = notifee.requestPermission as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 14, 10, 0));
  store.clearAll();
  __resetProfileCache();
  runtime.__test.reset();
  ask.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

it('does not ask for notifications over setup, and asks once after it', async () => {
  beginSetup();
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<HeartScreen onElementChange={() => {}} />);
  });
  expect(ask).not.toHaveBeenCalled();

  await act(async () => {
    finishSetup();
  });
  expect(ask).toHaveBeenCalledTimes(1);
  await act(async () => {
    finishSetup();
  });
  expect(ask).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

it('says on Today when notifications are off, and nothing when they are on', () => {
  const find = (permission: 'granted' | 'denied') => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<NotificationsOff permission={permission} />);
    });
    return tree.root.findAll(
      (n: ReactTestInstance) => n.props.testID === 'notifications-off',
    ).length;
  };
  expect(find('granted')).toBe(0);
  expect(find('denied')).toBeGreaterThan(0);
});
