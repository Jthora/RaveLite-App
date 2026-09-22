/**
 * Pass 3: the clock. Local days are the app's spine — the streak, the
 * ramp's window, the day list, every plan chime — and two days a year are
 * 23 or 25 hours long. The suite runs in New York unless told otherwise
 * (see jest.config.js), so these are real transitions: 8 March 2026
 * springs forward, 1 November 2026 falls back.
 */
import {append} from '../../journal/journal';
import {expandPlanToFires} from '../../reminders/expandPlan';
import {DEFAULT_PLAN} from '../../reminders/defaultPlan';
import {localDayKey} from '../../training/grading';
import {store} from '../../../storage';
import {countsByDay, streakDays, windowStart} from '../stats';

const SPRING = {y: 2026, m: 2, d: 8}; // 02:00 → 03:00, a 23-hour day
const FALL = {y: 2026, m: 10, d: 1}; // 02:00 → 01:00, a 25-hour day

const noon = ({y, m, d}: {y: number; m: number; d: number}, add = 0) =>
  new Date(y, m, d + add, 12);

beforeEach(() => store.clearAll());

const logAt = (when: Date) =>
  append({
    kind: 'completion',
    at: when.getTime(),
    exerciseId: 'fire.pushups',
    element: 'fire',
    source: 'manual',
  });

describe.each([
  ['the short day', SPRING],
  ['the long day', FALL],
])('%s', (_name, day) => {
  it('gives every day its own key, one per day', () => {
    const keys = new Set<string>();
    for (let i = -2; i <= 2; i++) {
      keys.add(localDayKey(noon(day, i).getTime()));
    }
    expect(keys.size).toBe(5);
  });

  it('counts back seven days, not seven times twenty-four hours', () => {
    const from = windowStart(7, noon(day, 2));
    expect(localDayKey(from.getTime())).toBe(
      localDayKey(noon(day, -4).getTime()),
    );
    expect(from.getHours()).toBe(0);
  });

  it('keeps a streak across it', () => {
    for (let i = -2; i <= 1; i++) {
      logAt(noon(day, i));
    }
    expect(streakDays(noon(day, 1))).toBe(4);
  });

  it('puts a day of work on its own bar', () => {
    logAt(noon(day, -1));
    logAt(noon(day, 0));
    logAt(noon(day, 0));
    const bars = countsByDay(3, noon(day, 1));
    expect(bars).toEqual([1, 2, 0]);
  });

  it('chimes the plan on it, once each, in order', () => {
    const midnight = new Date(noon(day).getTime());
    midnight.setHours(0, 0, 0, 0);
    const end = new Date(noon(day, 1).getTime());
    end.setHours(0, 0, 0, 0);
    const fires = expandPlanToFires(
      DEFAULT_PLAN,
      midnight.getTime(),
      end.getTime() - 1,
    );
    expect(fires.length).toBeGreaterThan(0);
    const ids = fires.map(f => `${f.windowId}:${f.slotIndex}:${f.ts}`);
    expect(new Set(ids).size).toBe(ids.length);
    const times = fires.map(f => f.ts);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    // Every one of them lands on the day it belongs to.
    for (const ts of times) {
      expect(localDayKey(ts)).toBe(localDayKey(noon(day).getTime()));
    }
  });
});
