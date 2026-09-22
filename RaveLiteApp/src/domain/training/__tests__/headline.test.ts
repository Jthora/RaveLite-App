import {store} from '../../../storage';
import {bestResultLine, buildHeadline} from '../headline';
import {loadMetrics} from '../repository';

const DAY = 86_400_000;
const NOW = new Date(2026, 8, 14, 12, 0).getTime();

beforeEach(() => store.clearAll());

it('leads with the best run as a 3-mile grade', () => {
  const entries = [
    {id: 'slow', at: NOW - DAY, kindId: 'builtin.run-2mi', value: 1093},
    {id: 'fast', at: NOW - 2 * DAY, kindId: 'builtin.run-2mi', value: 1040},
    {id: 'stale', at: NOW - 40 * DAY, kindId: 'builtin.run-2mi', value: 900},
  ];
  const metrics = loadMetrics();
  expect(bestResultLine(entries, metrics, NOW)).toMatch(
    /^Best run as a 3-mile time, 30 days · \S+ · \d+:\d\d$/,
  );
  expect(buildHeadline(entries, metrics, NOW)?.detail).toBe(
    'from 2-Mile Run · 17:20',
  );
});

it('falls back to the best of the most-logged kind', () => {
  const metrics = loadMetrics();
  const plank = metrics.find(m => m.label === 'Plank — max hold')!;
  const entries = [
    {id: 'a', at: NOW - DAY, kindId: plank.id, value: 90},
    {id: 'b', at: NOW - 3 * DAY, kindId: plank.id, value: 120},
  ];
  expect(bestResultLine(entries, metrics, NOW)).toBe(
    'Best Plank — max hold, 30 days · 2:00',
  );
});

it('has nothing to say without entries', () => {
  expect(bestResultLine([], loadMetrics(), NOW)).toBeUndefined();
});
