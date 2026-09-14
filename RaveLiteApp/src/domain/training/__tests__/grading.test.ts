import {
  bestEntry,
  formatDuration,
  formatMiles,
  formatPace,
  gradeFor3Mi,
  gradeForRun,
} from '../grading';
import {MetricKind, TrainingLogEntry} from '../types';

describe('gradeFor3Mi', () => {
  it.each([
    [17 * 60, 'A+'],
    [18 * 60, 'A+'],
    [18 * 60 + 1, 'A'],
    [19 * 60, 'A'],
    [21 * 60, 'B+'],
    [21 * 60 + 1, 'B'],
    [22 * 60, 'B'],
    [30 * 60, 'F+'],
    [30 * 60 + 1, 'F'],
    [40 * 60, 'F'],
  ])('%d s → %s', (seconds, expected) => {
    expect(gradeFor3Mi(seconds)).toBe(expected);
  });
});

describe('gradeForRun', () => {
  it('extrapolates 2-mi 17:20 to a 3-mi grade', () => {
    // 17:20 over 2 mi = 8:40/mi → 26 min for 3 mi → C−
    const out = gradeForRun(Math.round(2 * 1609.344), 17 * 60 + 20);
    expect(out?.grade).toBe('C−');
  });

  it('returns undefined for sub-mile distances', () => {
    expect(gradeForRun(800, 4 * 60)).toBeUndefined();
  });

  it('the operator B+ target: 14 min flat over 2 mi → B+', () => {
    // 14:00 over 2 mi = 7:00/mi → 21:00 over 3 mi → B+
    const out = gradeForRun(Math.round(2 * 1609.344), 14 * 60);
    expect(out?.grade).toBe('B+');
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [59, '0:59'],
    [60, '1:00'],
    [125, '2:05'],
    [3600, '1:00:00'],
    [3661, '1:01:01'],
  ])('%d → %s', (s, expected) => {
    expect(formatDuration(s)).toBe(expected);
  });
});

describe('formatMiles', () => {
  it('rounds to integer when close', () => {
    expect(formatMiles(1609.344 * 2)).toBe('2 mi');
  });
  it('shows 2dp when fractional', () => {
    expect(formatMiles(1609.344 * 1.5)).toBe('1.50 mi');
  });
});

describe('formatPace', () => {
  it('7:00/mi for 2 mi at 14:00', () => {
    expect(formatPace(Math.round(2 * 1609.344), 14 * 60)).toBe('7:00 /mi');
  });
});

describe('bestEntry', () => {
  const runKind: MetricKind = {
    id: 'builtin.run-2mi',
    label: '2-Mile Run',
    category: 'run',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'fire',
  };
  const repsKind: MetricKind = {
    id: 'builtin.pushups-amrap',
    label: 'Pushups',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'fire',
  };
  const holdKind: MetricKind = {
    id: 'builtin.plank',
    label: 'Plank — max hold',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'earth',
  };

  it('longest hold wins for hold kinds, even though they are mm:ss', () => {
    const now = Date.now();
    const entries: TrainingLogEntry[] = [
      {id: 'short', at: now, kindId: holdKind.id, value: 40},
      {id: 'long', at: now - 86400_000, kindId: holdKind.id, value: 95},
    ];
    expect(bestEntry(entries, holdKind.id, holdKind, 7 * 86400_000, now)?.id).toBe('long');
  });

  it('lowest time wins for run kinds', () => {
    const now = Date.now();
    const entries: TrainingLogEntry[] = [
      {id: 'a', at: now - 86400_000, kindId: runKind.id, value: 17 * 60 + 20},
      {id: 'b', at: now - 2 * 86400_000, kindId: runKind.id, value: 18 * 60 + 13},
    ];
    expect(bestEntry(entries, runKind.id, runKind, 7 * 86400_000, now)?.id).toBe('a');
  });

  it('highest reps wins for integer kinds', () => {
    const now = Date.now();
    const entries: TrainingLogEntry[] = [
      {id: 'x', at: now, kindId: repsKind.id, value: 21},
      {id: 'y', at: now - 86400_000, kindId: repsKind.id, value: 25},
    ];
    expect(bestEntry(entries, repsKind.id, repsKind, 7 * 86400_000, now)?.id).toBe('y');
  });

  it('ignores entries outside the window', () => {
    const now = Date.now();
    const entries: TrainingLogEntry[] = [
      {id: 'old', at: now - 30 * 86400_000, kindId: runKind.id, value: 14 * 60},
      {id: 'new', at: now - 86400_000, kindId: runKind.id, value: 18 * 60},
    ];
    expect(bestEntry(entries, runKind.id, runKind, 7 * 86400_000, now)?.id).toBe('new');
  });
});
