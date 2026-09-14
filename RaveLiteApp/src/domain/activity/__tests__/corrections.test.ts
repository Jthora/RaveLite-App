import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {store} from '../../../storage';
import {append, entriesForDay} from '../../journal/journal';
import type {CompletionEntry} from '../../journal/types';
import {doneByTrack} from '../../program/progress';
import {activityForDay} from '../activity';
import {bringBack, subscribeUndo, takeBack} from '../corrections';
import {logWaterGlass} from '../record';
import {hydrationGlasses} from '../stats';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 14, 12, 0));
  store.clearAll();
});

afterEach(() => {
  jest.useRealTimers();
});

it('a taken-back completion stops counting, and comes back when put back', () => {
  const glass = logWaterGlass();
  expect(hydrationGlasses(activityForDay())).toBe(1);

  takeBack(glass);
  expect(activityForDay()).toEqual([]);
  expect(entriesForDay().some(e => e.id === glass.id)).toBe(false);

  bringBack(glass);
  expect(hydrationGlasses(activityForDay())).toBe(1);
});

it('taking back a round returns its sets to Daily Sets', () => {
  const round = append({
    kind: 'completion',
    exerciseId: 'fire.pushups',
    element: 'fire',
    source: 'always-on',
    pulseId: 'sets:2026-09-14:round:1',
    moves: [
      {trackId: 'push', amount: 5},
      {trackId: 'squat', amount: 10},
    ],
  }) as CompletionEntry;
  expect(doneByTrack(entriesForDay()).push?.amount).toBe(5);

  takeBack(round);
  expect(doneByTrack(entriesForDay())).toEqual({});
});

it('announces each log and removal for the undo bar, but not a put-back', () => {
  const seen: string[] = [];
  const off = subscribeUndo(notice =>
    seen.push(`${notice.kind}: ${notice.label}`),
  );
  const glass = logWaterGlass();
  takeBack(glass, {announce: true});
  bringBack(glass);
  off();
  expect(seen).toEqual(['logged: glass of water', 'removed: glass of water']);
});
