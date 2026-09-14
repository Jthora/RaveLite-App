import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {store} from '../../../storage';
import {activityForDay} from '../../activity/activity';
import {entriesForDay} from '../../journal/journal';
import {doneByTrack} from '../../program/progress';
import type {SetPrescription} from '../../program/types';
import {buildDayList} from '../../today/dayList';
import {logMissedChime} from '../lateDone';

const NINE_TWENTY = new Date(2026, 8, 14, 9, 20).getTime();

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 14, 12, 0));
  store.clearAll();
});

afterEach(() => {
  jest.useRealTimers();
});

it('logs a missed chime at its own time, so Today shows it done', () => {
  const pulseId = 'plan:hydration:0920';
  const entry = logMissedChime({
    pulseId,
    at: NINE_TWENTY,
    element: 'water',
    exerciseId: 'water.walk-and-drink',
  });
  expect(entry).toMatchObject({at: NINE_TWENTY, source: 'manual', pulseId});

  const rows = buildDayList({
    now: Date.now(),
    activity: activityForDay(),
    journal: entriesForDay(new Date()),
    scheduled: [
      {id: pulseId, ts: NINE_TWENTY, element: 'water', label: 'Walk & Drink'},
    ],
  });
  expect(rows.map(r => [r.status, r.at])).toEqual([['done', NINE_TWENTY]]);
});

it("credits a late round's moves as adjusted, its partner and its glass", () => {
  const prescription: SetPrescription = {
    trackId: 'push',
    label: 'Push-ups',
    unit: 'reps',
    amount: 5,
    setIndex: 1,
    sets: 4,
    moves: [
      {
        trackId: 'push',
        exerciseId: 'fire.pushups',
        element: 'fire',
        label: 'Push-ups',
        unit: 'reps',
        amount: 5,
        setIndex: 1,
        sets: 4,
      },
      {
        trackId: 'squat',
        exerciseId: 'earth.squat',
        element: 'earth',
        label: 'Squats',
        unit: 'reps',
        amount: 10,
        setIndex: 1,
        sets: 4,
      },
    ],
    partner: {
      exerciseId: 'air.physiological-sigh',
      element: 'air',
      label: 'Physiological Sigh',
      seconds: 30,
    },
    water: true,
  };
  logMissedChime(
    {
      pulseId: 'sets:2026-09-14:round:2',
      at: NINE_TWENTY,
      element: 'fire',
      exerciseId: 'fire.pushups',
      prescription,
    },
    {amounts: {squat: 8}},
  );
  expect(doneByTrack(entriesForDay(new Date()))).toMatchObject({
    push: {amount: 5},
    squat: {amount: 8},
  });
  expect(
    activityForDay()
      .map(item => item.element)
      .sort(),
  ).toEqual(['air', 'earth', 'fire', 'water']);
});
