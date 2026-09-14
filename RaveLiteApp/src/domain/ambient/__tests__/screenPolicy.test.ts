import * as device from '../../../native/raveLiteDevice';
import {store} from '../../../storage';
import {
  NIGHT_BRIGHTNESS,
  WAKE_MS,
  __test,
  getScreenMode,
  screenModeAt,
  subscribeScreenMode,
  syncScreenPolicy,
  wakeScreen,
} from '../screenPolicy';
import {DEFAULT_ACTIVE_HOURS} from '../types';

jest.mock('../../../native/raveLiteDevice', () => ({
  INTERRUPTION_FILTER_ALL: 1,
  setWindowBrightness: jest.fn(() => Promise.resolve(true)),
}));

const setWindowBrightness = device.setWindowBrightness as jest.Mock;

// Monday 14 Sep 2026, local. Default active hours are 09:00–23:00.
const at = (h: number, m = 0) => new Date(2026, 8, 14, h, m).getTime();

beforeEach(() => {
  store.clearAll();
  __test.reset();
  setWindowBrightness.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('screenModeAt', () => {
  it('is day inside active hours and night outside them', () => {
    const activeHours = DEFAULT_ACTIVE_HOURS;
    expect(screenModeAt({now: at(12), activeHours})).toBe('day');
    expect(screenModeAt({now: at(23, 30), activeHours})).toBe('night');
    expect(screenModeAt({now: at(8), activeHours})).toBe('night');
  });

  it('a wake window keeps night hours bright until it ends', () => {
    const activeHours = DEFAULT_ACTIVE_HOURS;
    const wakeUntil = at(23, 31);
    expect(screenModeAt({now: at(23, 30), activeHours, wakeUntil})).toBe('day');
    expect(screenModeAt({now: at(23, 32), activeHours, wakeUntil})).toBe(
      'night',
    );
  });
});

describe('screen policy driver', () => {
  it('dims the backlight at night and hands it back by day, only on change', () => {
    const modes: string[] = [];
    subscribeScreenMode(m => modes.push(m));
    syncScreenPolicy(at(23, 30));
    syncScreenPolicy(at(23, 31));
    syncScreenPolicy(at(9, 1));
    expect(setWindowBrightness.mock.calls).toEqual([[NIGHT_BRIGHTNESS], [-1]]);
    expect(modes).toEqual(['night', 'day']);
  });

  it('force re-applies the current brightness without a mode change', () => {
    syncScreenPolicy(at(23, 30));
    syncScreenPolicy(at(23, 30), {force: true});
    expect(setWindowBrightness.mock.calls).toEqual([
      [NIGHT_BRIGHTNESS],
      [NIGHT_BRIGHTNESS],
    ]);
  });

  it('a tap at night wakes the screen for WAKE_MS, then it settles back', () => {
    jest.useFakeTimers();
    jest.setSystemTime(at(23, 30));
    syncScreenPolicy();
    expect(getScreenMode()).toBe('night');
    wakeScreen();
    expect(getScreenMode()).toBe('day');
    jest.advanceTimersByTime(WAKE_MS + 100);
    expect(getScreenMode()).toBe('night');
  });
});
