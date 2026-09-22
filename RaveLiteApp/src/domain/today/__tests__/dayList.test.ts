import type {ActivityItem} from '../../activity/activity';
import type {JournalEntry} from '../../journal/types';
import {buildDayList, type ScheduledChime} from '../dayList';

const MIN = 60_000;
const NOON = new Date(2026, 8, 14, 12, 0).getTime();

const item = (
  over: Partial<ActivityItem> & Pick<ActivityItem, 'id' | 'at'>,
): ActivityItem => ({
  element: 'fire',
  source: 'manual',
  label: 'Drill',
  points: 2,
  ref: {store: 'journal', id: over.id},
  ...over,
});

const chime = (id: string, ts: number, label = id): ScheduledChime => ({
  id,
  ts,
  element: 'water',
  label,
});

const base = {now: NOON, activity: [], journal: [], scheduled: []};

describe('buildDayList', () => {
  it('shows an answered round once, as its moves with the partner and glass', () => {
    const ref = {store: 'journal' as const, id: 'c1'};
    const at = NOON - 60 * MIN;
    const pulseId = 'sets:d:round:1';
    const rows = buildDayList({
      ...base,
      activity: [
        item({
          id: 'c1:push',
          at,
          ref,
          pulseId,
          source: 'chime',
          trackId: 'push',
          label: 'Push',
          detail: '5 reps',
        }),
        item({
          id: 'c1:squat',
          at,
          ref,
          pulseId,
          source: 'chime',
          trackId: 'squat',
          element: 'earth',
          label: 'Squat',
          detail: '10 reps',
        }),
        item({
          id: 'c1:partner',
          at,
          ref,
          pulseId,
          source: 'chime',
          element: 'air',
          label: 'Doorway Pec Stretch',
        }),
        item({
          id: 'c1:water',
          at,
          ref,
          pulseId,
          source: 'chime',
          element: 'water',
          label: 'Glass of water',
          hydration: true,
        }),
      ],
      scheduled: [chime(pulseId, at, 'Round 1')],
    });
    expect(rows).toEqual([
      {
        id: 'journal:c1',
        at,
        element: 'fire',
        status: 'done',
        source: 'chime',
        ref,
        label: 'Push 5 reps + Squat 10 reps',
        detail: 'Doorway Pec Stretch · Glass of water',
      },
    ]);
  });

  it('lists every source of a done: drill taps, circuits, Train entries and max tests', () => {
    const rows = buildDayList({
      ...base,
      activity: [
        item({
          id: 'a',
          at: NOON - 40 * MIN,
          source: 'manual',
          label: 'Chin tuck',
        }),
        item({
          id: 'b',
          at: NOON - 30 * MIN,
          source: 'circuit',
          label: 'Box breath',
        }),
        item({
          id: 'train:t1',
          at: NOON - 20 * MIN,
          source: 'train',
          label: '2-Mile Run',
          ref: {store: 'train', id: 't1'},
        }),
        item({
          id: 'd',
          at: NOON - 10 * MIN,
          source: 'test',
          label: 'Push test',
          detail: 'max 14 reps',
        }),
      ],
    });
    expect(rows.map(r => [r.status, r.source, r.label])).toEqual([
      ['done', 'manual', 'Chin tuck'],
      ['done', 'circuit', 'Box breath'],
      ['done', 'train', '2-Mile Run'],
      ['done', 'test', 'Push test'],
    ]);
  });

  it('marks chimes active, upcoming, skipped or missed', () => {
    const journal: JournalEntry[] = [
      {
        id: 's',
        at: NOON - 50 * MIN,
        kind: 'reminder.skipped',
        pulseId: 'skipped',
        respondedAfterMs: 0,
      },
    ];
    const rows = buildDayList({
      ...base,
      journal,
      scheduled: [
        chime('missed', NOON - 90 * MIN),
        chime('skipped', NOON - 60 * MIN),
        chime('active', NOON - 1 * MIN),
        chime('later', NOON + 60 * MIN),
      ],
      active: chime('active', NOON - 1 * MIN),
    });
    expect(rows.map(r => [r.id, r.status])).toEqual([
      ['missed', 'missed'],
      ['skipped', 'skipped'],
      ['active', 'active'],
      ['later', 'upcoming'],
    ]);
  });

  it('moves a chime pushed back with +5 to its new time', () => {
    const rows = buildDayList({
      ...base,
      scheduled: [chime('deferred', NOON - 2 * MIN)],
      queuedAt: new Map([['deferred', NOON + 3 * MIN]]),
    });
    expect(rows).toEqual([
      expect.objectContaining({
        id: 'deferred',
        at: NOON + 3 * MIN,
        status: 'upcoming',
      }),
    ]);
  });

  it('shows an active chime that is not on the schedule, like a test chime', () => {
    const rows = buildDayList({...base, active: chime('tp.1', NOON)});
    expect(rows).toEqual([
      expect.objectContaining({id: 'tp.1', status: 'active'}),
    ]);
  });
});

it('shows an answered water call as its drill, with the eye break beside it', () => {
  const ref = {store: 'journal' as const, id: 'w1'};
  const at = NOON - 30 * MIN;
  const rows = buildDayList({
    ...base,
    activity: [
      item({
        id: 'w1',
        at,
        ref,
        element: 'water',
        label: 'Refill Ritual',
        detail: 'Refill the bottle + 3 big sips',
        hydration: true,
        points: 1,
      }),
      item({
        id: 'w1:eyes',
        at,
        ref,
        element: 'air',
        label: 'Eye break',
        detail: '20 sec',
        points: 1,
      }),
    ],
  });
  expect(rows).toEqual([
    expect.objectContaining({
      status: 'done',
      element: 'water',
      label: 'Refill Ritual',
      detail: 'Refill the bottle + 3 big sips · Eye break',
    }),
  ]);
});

describe('chimes that never sounded', () => {
  it('are their own quiet row, not missed', () => {
    const journal = [
      {
        id: 'j1',
        kind: 'reminder.suppressed',
        at: NOON - 60 * MIN,
        pulseId: 'p1',
        reason: 'manual-pause',
      },
    ] as JournalEntry[];
    const rows = buildDayList({
      ...base,
      journal,
      scheduled: [
        chime('p1', NOON - 60 * MIN, 'Water Call'),
        chime('p2', NOON - 30 * MIN),
      ],
    });
    expect(rows.map(r => [r.id, r.status])).toEqual([
      ['p1', 'unsounded'],
      ['p2', 'missed'],
    ]);
    expect(rows[0].detail).toBe('Paused, did not sound');
  });

  it('leave out what came before setup', () => {
    const rows = buildDayList({
      ...base,
      from: NOON - 10 * MIN,
      scheduled: [
        chime('early', NOON - 60 * MIN),
        chime('later', NOON + 30 * MIN),
      ],
    });
    expect(rows.map(r => r.id)).toEqual(['later']);
  });
});
