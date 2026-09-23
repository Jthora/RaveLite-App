/**
 * Today is the whole day — on the operator's phone, 350 rows of list —
 * and it sits under every sheet. So opening one must not redraw it.
 *
 * The list is memoised; this pins the other half, which is easy to lose
 * by accident: that Today hands it the same props each time. A handler
 * rebuilt on every render (an info stack that returned a new object) once
 * made every one of those rows redraw behind the sheet.
 */
import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it, jest} from '@jest/globals';

const redraws = {list: 0, strip: 0, meters: 0};

jest.mock('../../../components/today/DayList', () => {
  const R = require('react');
  return {
    DayList: R.memo(function CountedDayList() {
      redraws.list += 1;
      return null;
    }),
  };
});
jest.mock('../../../components/today/BalanceStrip', () => {
  const R = require('react');
  return {
    BalanceStrip: R.memo(function CountedStrip() {
      redraws.strip += 1;
      return null;
    }),
  };
});
jest.mock('../../../components/today/SetsMeters', () => {
  const R = require('react');
  return {
    SetsMeters: R.memo(function CountedMeters() {
      redraws.meters += 1;
      return null;
    }),
  };
});

import {TodayPanel} from '../TodayPanel';
import {
  __resetProfileCache,
  authorProfile,
  finishSetup,
  saveProfile,
} from '../../../domain/profile/repository';
import * as runtime from '../../../domain/ambient/pulseRuntime';
import {store} from '../../../storage';

const TEN = new Date(2026, 8, 14, 10, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TEN);
  store.clearAll();
  __resetProfileCache();
  runtime.__test.reset();
  saveProfile(authorProfile());
  finishSetup(TEN.getTime());
  redraws.list = 0;
  redraws.strip = 0;
  redraws.meters = 0;
});

it('does not redraw the day behind a sheet', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <TodayPanel
        permission="granted"
        onElementPress={() => {}}
        onEngageLegs={() => {}}
      />,
    );
  });
  const drawn = {...redraws};
  const press = (id: string) =>
    act(() =>
      tree.root
        .findAll(
          (n: ReactTestInstance) =>
            n.props.testID === id && typeof n.props.onPress === 'function',
        )[0]
        .props.onPress(),
    );

  // Daily Sets opens from the meters, which are mocked away here.
  for (const door of ['settings-open', 'practice-open', 'log-open']) {
    press(door);
    expect({door, ...redraws}).toEqual({door, ...drawn});
  }
  act(() => tree.unmount());
});
