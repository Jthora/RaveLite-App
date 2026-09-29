/**
 * A standard that says "ready" when it is not is worse than no standard,
 * because somebody acts on it. The four states are tested one at a time,
 * and the boundary that matters most is the day a mark goes stale: an
 * eighty-nine-day-old pass is held, a ninety-one-day-old pass is not.
 */
import {beforeEach, describe, expect, it} from '@jest/globals';

import {
  KNIGHT_STANDARD,
  gradeAtLeast,
  markNeeded,
  readinessFor,
  readinessLine,
  type ReadinessInput,
} from '../readiness';
import {STANDARD_EVENTS, getPrimarySex} from '../standards';
import {BUILTIN_METRICS} from '../../training/builtinMetrics';
import type {TrainingLogEntry} from '../../training/types';
import {store} from '../../../storage';

const NOW = new Date(2026, 8, 28, 12, 0).getTime();
const DAY = 86_400_000;

const metricFor = (kindId: string) =>
  BUILTIN_METRICS.find(m => m.id === kindId);

beforeEach(() => store.clearAll());

/** A logged result for an event, `daysAgo` days back. */
function entry(
  eventId: string,
  value: number,
  daysAgo: number,
): TrainingLogEntry {
  const event = STANDARD_EVENTS.find(e => e.id === eventId)!;
  return {
    id: `${eventId}-${daysAgo}`,
    kindId: event.kindId!,
    value,
    at: NOW - daysAgo * DAY,
  } as TrainingLogEntry;
}

function check(entries: TrainingLogEntry[]): ReadinessInput {
  return {entries, metricFor, sex: getPrimarySex(), now: NOW};
}

/** A value that passes, and one that does not, for a requirement. */
function marks(eventId: string) {
  const event = STANDARD_EVENTS.find(e => e.id === eventId)!;
  const req = KNIGHT_STANDARD.requirements.find(r => r.eventId === eventId)!;
  const mark = markNeeded(event, getPrimarySex(), req.grade)!;
  const better = event.better === 'higher' ? mark + 5 : Math.max(1, mark - 5);
  const worse = event.better === 'higher' ? Math.max(0, mark - 5) : mark + 5;
  return {mark, better, worse};
}

describe('the four states', () => {
  it('is untested when nothing was ever logged', () => {
    const r = readinessFor(KNIGHT_STANDARD, check([]));
    expect(r.ready).toBe(false);
    expect(r.outstanding).toBe(KNIGHT_STANDARD.requirements.length);
    expect(r.statuses.every(s => s.state === 'untested')).toBe(true);
  });

  it('is met when a good result is inside the window', () => {
    const {better} = marks('pullups');
    const r = readinessFor(
      KNIGHT_STANDARD,
      check([entry('pullups', better, 10)]),
    );
    const pullups = r.statuses.find(s => s.requirement.eventId === 'pullups')!;
    expect(pullups.state).toBe('met');
    expect(pullups.daysLeft).toBe(80);
  });

  it('is short when the result is inside the window but under the mark', () => {
    const {worse} = marks('pullups');
    const r = readinessFor(
      KNIGHT_STANDARD,
      check([entry('pullups', worse, 10)]),
    );
    const pullups = r.statuses.find(s => s.requirement.eventId === 'pullups')!;
    expect(pullups.state).toBe('short');
    expect(pullups.daysLeft).toBeUndefined();
  });

  it('goes stale when the pass is older than the window', () => {
    const {better} = marks('pullups');
    const r = readinessFor(
      KNIGHT_STANDARD,
      check([entry('pullups', better, 120)]),
    );
    const pullups = r.statuses.find(s => s.requirement.eventId === 'pullups')!;
    // Stale, not untested: there is a history, it is simply out of date,
    // and it still shows what was managed and when.
    expect(pullups.state).toBe('stale');
    expect(pullups.value).toBe(better);
    expect(pullups.testedAt).toBe(NOW - 120 * DAY);
  });
});

describe('the boundary', () => {
  it('holds a pass on the last day of the window, and not the day after', () => {
    const {better} = marks('pullups');
    const inside = readinessFor(
      KNIGHT_STANDARD,
      check([entry('pullups', better, 89)]),
    );
    const outside = readinessFor(
      KNIGHT_STANDARD,
      check([entry('pullups', better, 91)]),
    );
    expect(
      inside.statuses.find(s => s.requirement.eventId === 'pullups')!.state,
    ).toBe('met');
    expect(
      outside.statuses.find(s => s.requirement.eventId === 'pullups')!.state,
    ).toBe('stale');
  });

  it('takes the best result inside the window, not the newest', () => {
    const {better, worse} = marks('pullups');
    const r = readinessFor(
      KNIGHT_STANDARD,
      check([entry('pullups', better, 40), entry('pullups', worse, 2)]),
    );
    // A bad day last week does not undo a pass last month.
    expect(
      r.statuses.find(s => s.requirement.eventId === 'pullups')!.state,
    ).toBe('met');
  });
});

describe('the verdict', () => {
  it('is only ready when every requirement is held', () => {
    const entries = KNIGHT_STANDARD.requirements.map(r =>
      entry(r.eventId, marks(r.eventId).better, 5),
    );
    const all = readinessFor(KNIGHT_STANDARD, check(entries));
    expect(all.ready).toBe(true);
    expect(readinessLine(all)).toContain('Ready');

    // Drop one and the whole thing is not ready. Six of six, or no.
    const one = readinessFor(KNIGHT_STANDARD, check(entries.slice(1)));
    expect(one.ready).toBe(false);
    expect(readinessLine(one)).toBe('1 of 6 not held.');
  });

  it('names the soonest retest while ready', () => {
    const entries = KNIGHT_STANDARD.requirements.map((r, i) =>
      entry(r.eventId, marks(r.eventId).better, i === 0 ? 80 : 1),
    );
    expect(readinessLine(readinessFor(KNIGHT_STANDARD, check(entries)))).toBe(
      'Ready. Next retest in 10 days.',
    );
  });
});

it('every requirement names an event that exists and can be graded', () => {
  for (const r of KNIGHT_STANDARD.requirements) {
    const event = STANDARD_EVENTS.find(e => e.id === r.eventId);
    expect(event).toBeDefined();
    // Without a Train kind there is nothing to read a result from, and
    // without scales there is no mark to hold.
    expect(event!.kindId).toBeDefined();
    expect(markNeeded(event!, 'male', r.grade)).toBeDefined();
    expect(markNeeded(event!, 'female', r.grade)).toBeDefined();
  }
});

it('ranks grades so a better mark passes a lower requirement', () => {
  expect(gradeAtLeast('A', 'B+')).toBe(true);
  expect(gradeAtLeast('B+', 'B+')).toBe(true);
  expect(gradeAtLeast('C', 'B+')).toBe(false);
});
