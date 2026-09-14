import {
  pagingAllowedAt,
  pagingAllowedAtPure,
  readPauseUntil,
} from '../activeHours';
import {DEFAULT_ACTIVE_HOURS} from '../types';
import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';

// 2026-05-04 is a Monday (local time).
const at = (h: number, m = 0) => new Date(2026, 4, 4, h, m).getTime();

beforeEach(() => store.clearAll());

describe('pagingAllowedAtPure', () => {
  it('answers for future instants without touching the stored pause', () => {
    const now = at(12);
    const pauseUntil = now + 30 * 60_000;
    store.set(KEYS.manualPauseUntil, String(pauseUntil));
    expect(
      pagingAllowedAtPure(now + 60_000, DEFAULT_ACTIVE_HOURS, pauseUntil),
    ).toBe('manual-pause');
    // An instant after the pause ends is allowed…
    expect(
      pagingAllowedAtPure(now + 45 * 60_000, DEFAULT_ACTIVE_HOURS, pauseUntil),
    ).toBeNull();
    // …and asking about it did not clear the still-running pause.
    expect(readPauseUntil()).toBe(pauseUntil);
  });

  it('applies active hours, and pause wins over outside-active-hours', () => {
    expect(pagingAllowedAtPure(at(7), DEFAULT_ACTIVE_HOURS)).toBe(
      'outside-active-hours',
    );
    expect(pagingAllowedAtPure(at(3), DEFAULT_ACTIVE_HOURS, at(4))).toBe(
      'manual-pause',
    );
    expect(pagingAllowedAtPure(at(12), DEFAULT_ACTIVE_HOURS)).toBeNull();
  });

  it('pagingAllowedAt still clears an expired pause', () => {
    store.set(KEYS.manualPauseUntil, String(at(11)));
    expect(pagingAllowedAt(new Date(at(12)))).toBeNull();
    expect(readPauseUntil()).toBeUndefined();
  });
});
