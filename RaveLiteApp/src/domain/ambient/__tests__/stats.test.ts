import {
  adherenceForDay,
  timeToRespondPercentile,
} from '../stats';
import {append} from '../../journal/journal';
import {store} from '../../../storage';

const TODAY_AT = (h: number, m = 0): number => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

beforeEach(() => {
  store.clearAll();
});

// ── adherenceForDay ─────────────────────────────────────────────────

describe('adherenceForDay — empty day', () => {
  it('returns null ratio + zero counters', () => {
    expect(adherenceForDay()).toEqual({
      fired: 0,
      completed: 0,
      skipped: 0,
      ignored: 0,
      suppressed: 0,
      scheduled: 0,
      ratio: null,
    });
  });
});

describe('adherenceForDay — typical mix', () => {
  it('counts fired, completed (correlated), skipped, ignored', () => {
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(10),
      pulseId: 'p1',
      element: 'fire',
    });
    append({
      kind: 'completion',
      at: TODAY_AT(10, 1),
      exerciseId: 'ex1',
      element: 'fire',
      source: 'always-on',
      pulseId: 'p1',
      respondedAfterMs: 60_000,
    });
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(11),
      pulseId: 'p2',
      element: 'air',
    });
    append({
      kind: 'reminder.skipped',
      at: TODAY_AT(11, 2),
      pulseId: 'p2',
      respondedAfterMs: 120_000,
    });
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(12),
      pulseId: 'p3',
      element: 'water',
    });
    append({
      kind: 'reminder.ignored',
      at: TODAY_AT(12, 8),
      pulseId: 'p3',
      respondedAfterMs: null,
    });

    expect(adherenceForDay()).toEqual({
      fired: 3,
      completed: 1,
      skipped: 1,
      ignored: 1,
      suppressed: 0,
      scheduled: 3,
      ratio: 1 / 3,
    });
  });
});

describe('adherenceForDay — exclusions', () => {
  it('excludes suppressed from numerator and denominator', () => {
    append({
      kind: 'reminder.suppressed',
      at: TODAY_AT(2),
      pulseId: 'p1',
      reason: 'outside-active-hours',
    });
    append({
      kind: 'reminder.suppressed',
      at: TODAY_AT(3),
      pulseId: 'p2',
      reason: 'manual-pause',
    });
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(10),
      pulseId: 'p3',
      element: 'fire',
    });
    append({
      kind: 'completion',
      at: TODAY_AT(10, 1),
      exerciseId: 'ex',
      element: 'fire',
      source: 'always-on',
      pulseId: 'p3',
      respondedAfterMs: 30_000,
    });

    const r = adherenceForDay();
    expect(r.suppressed).toBe(2);
    expect(r.scheduled).toBe(1);
    expect(r.completed).toBe(1);
    expect(r.ratio).toBe(1);
  });

  it('excludes absorbed `reminder.ignored` from denominator', () => {
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(10),
      pulseId: 'p1',
      element: 'fire',
    });
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(11),
      pulseId: 'p2',
      element: 'air',
    });
    append({
      kind: 'reminder.ignored',
      at: TODAY_AT(10, 8),
      pulseId: 'p1',
      respondedAfterMs: null,
      absorbedBy: 'absence-1',
    });
    append({
      kind: 'reminder.ignored',
      at: TODAY_AT(11, 8),
      pulseId: 'p2',
      respondedAfterMs: null,
    });

    const r = adherenceForDay();
    expect(r.ignored).toBe(1);
    expect(r.scheduled).toBe(1);
    expect(r.ratio).toBe(0);
  });

  it('counts a completion only when its pulseId matches a fired pulse on the day', () => {
    // Manual completion (no pulseId) must NOT enter AOS denominator.
    append({
      kind: 'completion',
      at: TODAY_AT(9),
      exerciseId: 'ex',
      element: 'fire',
      source: 'manual',
    });
    // Stray pulseId with no fired entry — also excluded.
    append({
      kind: 'completion',
      at: TODAY_AT(9, 30),
      exerciseId: 'ex',
      element: 'fire',
      source: 'always-on',
      pulseId: 'orphan',
    });

    expect(adherenceForDay().completed).toBe(0);
    expect(adherenceForDay().scheduled).toBe(0);
    expect(adherenceForDay().ratio).toBeNull();
  });
});

describe('adherenceForDay — boundary cases', () => {
  it('all-suppressed day: scheduled=0, ratio=null', () => {
    append({
      kind: 'reminder.suppressed',
      at: TODAY_AT(8),
      pulseId: 'p1',
      reason: 'outside-active-hours',
    });
    append({
      kind: 'reminder.suppressed',
      at: TODAY_AT(9),
      pulseId: 'p2',
      reason: 'outside-active-hours',
    });
    expect(adherenceForDay().ratio).toBeNull();
    expect(adherenceForDay().scheduled).toBe(0);
  });

  it('all-absorbed day: scheduled=0, ratio=null', () => {
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(10),
      pulseId: 'p1',
      element: 'fire',
    });
    append({
      kind: 'reminder.ignored',
      at: TODAY_AT(10, 8),
      pulseId: 'p1',
      respondedAfterMs: null,
      absorbedBy: 'absence-1',
    });
    expect(adherenceForDay().ratio).toBeNull();
    expect(adherenceForDay().scheduled).toBe(0);
  });

  it('perfect day: ratio = 1', () => {
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(10),
      pulseId: 'p1',
      element: 'fire',
    });
    append({
      kind: 'completion',
      at: TODAY_AT(10, 1),
      exerciseId: 'ex',
      element: 'fire',
      source: 'always-on',
      pulseId: 'p1',
      respondedAfterMs: 60_000,
    });
    expect(adherenceForDay().ratio).toBe(1);
  });

  it('zero-completion day: ratio = 0 when there are non-absorbed ignored', () => {
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(10),
      pulseId: 'p1',
      element: 'fire',
    });
    append({
      kind: 'reminder.ignored',
      at: TODAY_AT(10, 8),
      pulseId: 'p1',
      respondedAfterMs: null,
    });
    expect(adherenceForDay().ratio).toBe(0);
  });
});

// ── timeToRespondPercentile ─────────────────────────────────────────

describe('timeToRespondPercentile', () => {
  it('returns null when no samples in window', () => {
    expect(timeToRespondPercentile(50, 7)).toBeNull();
  });

  it('ignores reminder.ignored (respondedAfterMs == null)', () => {
    append({
      kind: 'reminder.fired',
      at: TODAY_AT(10),
      pulseId: 'p1',
      element: 'fire',
    });
    append({
      kind: 'reminder.ignored',
      at: TODAY_AT(10, 8),
      pulseId: 'p1',
      respondedAfterMs: null,
    });
    expect(timeToRespondPercentile(50, 7)).toBeNull();
  });

  it('combines completion + reminder.skipped responsiveness', () => {
    append({
      kind: 'completion',
      at: TODAY_AT(9),
      exerciseId: 'ex',
      element: 'fire',
      source: 'always-on',
      pulseId: 'p1',
      respondedAfterMs: 1000,
    });
    append({
      kind: 'reminder.skipped',
      at: TODAY_AT(10),
      pulseId: 'p2',
      respondedAfterMs: 3000,
    });
    append({
      kind: 'completion',
      at: TODAY_AT(11),
      exerciseId: 'ex',
      element: 'fire',
      source: 'always-on',
      pulseId: 'p3',
      respondedAfterMs: 5000,
    });
    expect(timeToRespondPercentile(50, 7)).toBe(3000); // median
    expect(timeToRespondPercentile(0, 7)).toBe(1000); // min
    expect(timeToRespondPercentile(100, 7)).toBe(5000); // max
  });

  it('linearly interpolates between samples', () => {
    append({
      kind: 'completion',
      at: TODAY_AT(9),
      exerciseId: 'ex',
      element: 'fire',
      source: 'always-on',
      pulseId: 'p1',
      respondedAfterMs: 0,
    });
    append({
      kind: 'completion',
      at: TODAY_AT(10),
      exerciseId: 'ex',
      element: 'fire',
      source: 'always-on',
      pulseId: 'p2',
      respondedAfterMs: 100,
    });
    // p25 between [0, 100] → 25
    expect(timeToRespondPercentile(25, 7)).toBe(25);
    expect(timeToRespondPercentile(75, 7)).toBe(75);
  });
});
