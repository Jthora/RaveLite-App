/**
 * Midnight and noon are where twelve-hour clocks go wrong. Hour 0 is
 * 12 AM and hour 12 is 12 PM, and `h % 12` gives 0 for both — so a naive
 * implementation prints "0:30 AM" for half past midnight and "0:15 PM"
 * for quarter past noon. Both are tested here because both have shipped
 * in real apps.
 *
 * Also held: what is on disk never changes. The app stores 24-hour
 * "HH:MM" whatever the setting says, so an export written on a 12-hour
 * phone restores on a 24-hour one and means the same thing.
 */
import {beforeEach, describe, expect, it} from '@jest/globals';

import {
  __resetClock,
  clockOf,
  formatClock,
  formatClockHHMM,
  is24Hour,
  loadClockFormat,
  loadPhoneClockOnce,
  rememberPhoneClock,
  setClockFormat,
} from '../clock';
import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';

beforeEach(() => {
  store.clearAll();
  __resetClock();
});

const at = (h: number, m: number) => new Date(2026, 8, 23, h, m).getTime();

describe('24-hour', () => {
  beforeEach(() => setClockFormat('24'));

  it('pads the hour', () => {
    expect(formatClock(at(9, 5))).toBe('09:05');
    expect(formatClock(at(17, 45))).toBe('17:45');
  });

  it('writes midnight and noon as 00 and 12', () => {
    expect(formatClock(at(0, 30))).toBe('00:30');
    expect(formatClock(at(12, 0))).toBe('12:00');
  });
});

describe('AM / PM', () => {
  beforeEach(() => setClockFormat('12'));

  it('does not print a zero hour', () => {
    // Half past midnight is 12:30 AM, not 0:30 AM.
    expect(formatClock(at(0, 30))).toBe('12:30 AM');
    // Quarter past noon is 12:15 PM, not 0:15 PM.
    expect(formatClock(at(12, 15))).toBe('12:15 PM');
  });

  it('puts midnight in AM and noon in PM', () => {
    expect(formatClock(at(0, 0))).toBe('12:00 AM');
    expect(formatClock(at(12, 0))).toBe('12:00 PM');
  });

  it('turns over at 13:00, and keeps the minutes padded', () => {
    expect(formatClock(at(12, 59))).toBe('12:59 PM');
    expect(formatClock(at(13, 0))).toBe('1:00 PM');
    expect(formatClock(at(9, 5))).toBe('9:05 AM');
    expect(formatClock(at(23, 59))).toBe('11:59 PM');
  });
});

describe('following the phone', () => {
  it('is the default', () => {
    expect(loadClockFormat()).toBe('auto');
  });

  it('draws 24-hour until the phone says otherwise', () => {
    // A build with no native module, and the moment before it answers:
    // what the app has always shown.
    expect(is24Hour()).toBe(true);
    expect(formatClock(at(17, 45))).toBe('17:45');
  });

  it('follows the phone once it has answered', async () => {
    await loadPhoneClockOnce(async () => ({is24Hour: false}));
    expect(formatClock(at(17, 45))).toBe('5:45 PM');

    await loadPhoneClockOnce(async () => ({is24Hour: true}));
    expect(formatClock(at(17, 45))).toBe('17:45');
  });

  it('keeps what it had when the phone cannot be asked', async () => {
    rememberPhoneClock(false);
    await loadPhoneClockOnce(async () => {
      throw new Error('no native module');
    });
    expect(formatClock(at(17, 45))).toBe('5:45 PM');
  });

  it('is overridden by an explicit choice', async () => {
    await loadPhoneClockOnce(async () => ({is24Hour: false}));
    setClockFormat('24');
    expect(formatClock(at(17, 45))).toBe('17:45');
  });
});

describe('what is stored', () => {
  it('never changes with the setting', () => {
    // My day is written as canonical "HH:MM" and only read differently.
    setClockFormat('12');
    expect(formatClockHHMM('17:45')).toBe('5:45 PM');
    setClockFormat('24');
    expect(formatClockHHMM('17:45')).toBe('17:45');
    // The setting itself is all that was written.
    expect(store.getString(KEYS.clock)).toBe('24');
  });

  it('hands back anything that is not a time, untouched', () => {
    expect(formatClockHHMM('')).toBe('');
    expect(formatClockHHMM('later')).toBe('later');
  });

  it('formats an hour and minute directly', () => {
    setClockFormat('12');
    expect(clockOf(0, 0)).toBe('12:00 AM');
    expect(clockOf(23, 5)).toBe('11:05 PM');
  });
});
