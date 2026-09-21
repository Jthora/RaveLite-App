import {
  withinActiveHours,
  getActiveHours,
  setActiveHours,
  isManuallyPaused,
  pagingAllowedAt,
} from '../activeHours';
import {DEFAULT_ACTIVE_HOURS, ActiveHours} from '../types';
import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';

/**
 * `Date(year, month-0, day, hours, minutes)` — local-time constructor.
 * Active-hours math is operator-local by definition; tests use the
 * same local-time semantics as production.
 */
function localDate(y: number, m1: number, d: number, h: number, min = 0): Date {
  return new Date(y, m1 - 1, d, h, min, 0, 0);
}

// 2026-05-04 is a Monday. Used as the canonical "Mon" anchor below.
const MON_2026_05_04 = (h: number, m = 0) => localDate(2026, 5, 4, h, m);
const TUE_2026_05_05 = (h: number, m = 0) => localDate(2026, 5, 5, h, m);
const SAT_2026_05_09 = (h: number, m = 0) => localDate(2026, 5, 9, h, m);
const SUN_2026_05_10 = (h: number, m = 0) => localDate(2026, 5, 10, h, m);

describe('withinActiveHours — forward windows (start < end)', () => {
  const allDays: ActiveHours = {
    start: '09:00',
    end: '23:00',
    daysMask: 0b1111111,
  };

  it('is true at the inclusive start minute', () => {
    expect(withinActiveHours(MON_2026_05_04(9, 0), allDays)).toBe(true);
  });

  it('is false one minute before start', () => {
    expect(withinActiveHours(MON_2026_05_04(8, 59), allDays)).toBe(false);
  });

  it('is true one minute before end', () => {
    expect(withinActiveHours(MON_2026_05_04(22, 59), allDays)).toBe(true);
  });

  it('is false at the exclusive end minute', () => {
    expect(withinActiveHours(MON_2026_05_04(23, 0), allDays)).toBe(false);
  });

  it('is false at midday on a day masked off', () => {
    const weekdaysOnly: ActiveHours = {...allDays, daysMask: 0b0011111};
    expect(withinActiveHours(SAT_2026_05_09(12, 0), weekdaysOnly)).toBe(false);
    expect(withinActiveHours(SUN_2026_05_10(12, 0), weekdaysOnly)).toBe(false);
    expect(withinActiveHours(MON_2026_05_04(12, 0), weekdaysOnly)).toBe(true);
  });
});

describe('withinActiveHours — wrapped windows (start > end)', () => {
  // 22:00 → 02:00, all days enabled.
  const lateNight: ActiveHours = {
    start: '22:00',
    end: '02:00',
    daysMask: 0b1111111,
  };

  it('is true at 23:00 on a Monday', () => {
    expect(withinActiveHours(MON_2026_05_04(23, 0), lateNight)).toBe(true);
  });

  it('is true at 01:00 on a Tuesday (the carry-over from Monday)', () => {
    expect(withinActiveHours(TUE_2026_05_05(1, 0), lateNight)).toBe(true);
  });

  it('is false at 02:00 Tuesday (exclusive end boundary)', () => {
    expect(withinActiveHours(TUE_2026_05_05(2, 0), lateNight)).toBe(false);
  });

  it('is false at 21:59 (one minute before start)', () => {
    expect(withinActiveHours(MON_2026_05_04(21, 59), lateNight)).toBe(false);
  });

  it('respects daysMask against the *start* of the window', () => {
    // Mon enabled, Tue disabled. Mon 23:00 should be in; Tue 01:00 also
    // in (carry-over from Mon); Tue 23:00 out (Tue disabled at start).
    const monOnly: ActiveHours = {...lateNight, daysMask: 0b0000001};
    expect(withinActiveHours(MON_2026_05_04(23, 0), monOnly)).toBe(true);
    expect(withinActiveHours(TUE_2026_05_05(1, 0), monOnly)).toBe(true);
    expect(withinActiveHours(TUE_2026_05_05(23, 0), monOnly)).toBe(false);
  });
});

describe('withinActiveHours — degenerate configs', () => {
  it('returns false when daysMask is 0', () => {
    expect(
      withinActiveHours(MON_2026_05_04(12, 0), {
        start: '09:00',
        end: '23:00',
        daysMask: 0,
      }),
    ).toBe(false);
  });

  it('returns false when start equals end', () => {
    expect(
      withinActiveHours(MON_2026_05_04(12, 0), {
        start: '12:00',
        end: '12:00',
        daysMask: 0b1111111,
      }),
    ).toBe(false);
  });

  it('throws on malformed HH:MM input', () => {
    expect(() =>
      withinActiveHours(MON_2026_05_04(12, 0), {
        start: 'nope',
        end: '23:00',
        daysMask: 0b1111111,
      }),
    ).toThrow();
  });

  it('throws on out-of-range HH:MM input', () => {
    expect(() =>
      withinActiveHours(MON_2026_05_04(12, 0), {
        start: '25:00',
        end: '23:00',
        daysMask: 0b1111111,
      }),
    ).toThrow();
  });
});

describe('storage helpers', () => {
  beforeEach(() => {
    store.clearAll();
  });

  it('returns DEFAULT_ACTIVE_HOURS when nothing is stored', () => {
    expect(getActiveHours()).toEqual(DEFAULT_ACTIVE_HOURS);
  });

  it('round-trips a custom config', () => {
    const cfg: ActiveHours = {
      start: '07:30',
      end: '21:00',
      daysMask: 0b0011111,
    };
    setActiveHours(cfg);
    expect(getActiveHours()).toEqual(cfg);
  });

  it('falls back to default when stored JSON is malformed', () => {
    store.set(KEYS.activeHours, 'not-json');
    expect(getActiveHours()).toEqual(DEFAULT_ACTIVE_HOURS);
  });

  it('rejects writes with invalid times', () => {
    expect(() =>
      setActiveHours({start: '99:00', end: '23:00', daysMask: 0b1111111}),
    ).toThrow();
  });
});

describe('manual pause', () => {
  beforeEach(() => {
    store.clearAll();
  });

  it('is false when no pause is set', () => {
    expect(isManuallyPaused(MON_2026_05_04(12, 0))).toBe(false);
  });

  it('is true while the pause is in effect', () => {
    const now = MON_2026_05_04(12, 0);
    store.set(KEYS.manualPauseUntil, String(now.getTime() + 60_000));
    expect(isManuallyPaused(now)).toBe(true);
  });

  it('clears + reports false once expired', () => {
    const now = MON_2026_05_04(12, 0);
    store.set(KEYS.manualPauseUntil, String(now.getTime() - 1));
    expect(isManuallyPaused(now)).toBe(false);
    // Side-effect: stale value cleared.
    expect(store.getString(KEYS.manualPauseUntil)).toBeUndefined();
  });
});

describe('pagingAllowedAt', () => {
  beforeEach(() => {
    store.clearAll();
  });

  it('returns null inside default active hours', () => {
    expect(pagingAllowedAt(MON_2026_05_04(12, 0))).toBeNull();
  });

  it('returns "outside-active-hours" before start', () => {
    expect(pagingAllowedAt(MON_2026_05_04(4, 0))).toBe('outside-active-hours');
  });

  it('returns "manual-pause" when paused, even inside active hours', () => {
    const now = MON_2026_05_04(12, 0);
    store.set(KEYS.manualPauseUntil, String(now.getTime() + 60_000));
    expect(pagingAllowedAt(now)).toBe('manual-pause');
  });

  it('manual-pause takes precedence over outside-active-hours', () => {
    const now = MON_2026_05_04(3, 0);
    store.set(KEYS.manualPauseUntil, String(now.getTime() + 60_000));
    expect(pagingAllowedAt(now)).toBe('manual-pause');
  });
});
