import {store} from '../../../storage';
import {authorProfile, saveProfile} from '../../profile/repository';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {append} from '../../journal/journal';
import {
  completionsTodayByElement,
  currentStreakDays,
} from '../../journal/stats';
import {doneByTrack} from '../../program/progress';
import {recordMaxTest} from '../../program/repository';
import {TRACKS} from '../../program/tracks';
import {addEntry, deleteEntry, updateEntry} from '../../training/repository';
import type {MetricKind} from '../../training/types';
import {activityForDay, buildActivity, trainElement} from '../activity';
import {logWaterGlass, recordDrillTap} from '../record';
import {countsByElement, hydrationGlasses, streakDays} from '../stats';

const DAY = 86_400_000;
const trackName = (id: string) => TRACKS.find(t => t.id === id)!.name;

beforeEach(() => {
  store.clearAll();
  // These are the author's program; a fresh store is now a stranger's.
  saveProfile(authorProfile());
});

function round(extra: Record<string, unknown> = {}) {
  return append({
    kind: 'completion',
    exerciseId: 'fire.pushup-groove',
    element: 'fire',
    source: 'always-on',
    pulseId: 'sets:today:round:1',
    moves: [
      {trackId: 'push', amount: 5},
      {trackId: 'squat', amount: 10},
    ],
    partnerExerciseId: 'air.physiological-sigh',
    partnerSec: 30,
    water: true,
    ...extra,
  });
}

describe('Train log entries', () => {
  it('count toward their element and the streak', () => {
    addEntry({at: Date.now(), kindId: 'builtin.run-2mi', value: 1093});
    const items = activityForDay();
    expect(items).toEqual([
      expect.objectContaining({source: 'train', element: 'fire'}),
    ]);
    expect(completionsTodayByElement().fire).toBe(1);
    expect(currentStreakDays()).toBe(1);
  });

  it('resolve an any-element kind by category, unless the entry says', () => {
    const hold: MetricKind = {
      id: 'custom.hold',
      label: 'Hold',
      category: 'hold',
      unit: 'seconds',
      inputMode: 'mmss',
      element: 'any',
      builtIn: false,
    };
    const entry = {id: 't1', at: 0, kindId: hold.id, value: 30};
    expect(trainElement(entry, hold)).toBe('earth');
    expect(trainElement({...entry, element: 'water'}, hold)).toBe('water');
    expect(trainElement(entry, undefined)).toBeUndefined();
  });

  it('reflect edits and deletes right away', () => {
    const entry = addEntry({
      at: Date.now(),
      kindId: 'builtin.run-2mi',
      value: 1093,
    });
    updateEntry(entry.id, {at: Date.now() - DAY});
    expect(activityForDay()).toEqual([]);
    // Yesterday's run still counts: today is not over, so it has not
    // broken anything yet.
    expect(streakDays()).toBe(1);
    deleteEntry(entry.id);
    expect(activityForDay(new Date(Date.now() - DAY))).toEqual([]);
    expect(streakDays()).toBe(0);
  });
});

describe('Daily Sets rounds', () => {
  it('expand into moves, the partner, the glass and its eye break, each on its element', () => {
    round();
    const items = activityForDay();
    expect(items.map(i => [i.element, i.label])).toEqual([
      ['fire', trackName('push')],
      ['earth', trackName('squat')],
      ['air', expect.any(String)],
      ['water', 'Glass of water'],
      ['air', 'Eye break'],
    ]);
    expect(items.every(i => i.source === 'chime')).toBe(true);
    expect(countsByElement(items)).toEqual({
      fire: 1,
      earth: 1,
      air: 2,
      water: 1,
      heart: 0,
    });
    expect(hydrationGlasses(items)).toBe(1);
  });

  it('count toward track quotas alongside older single-set entries', () => {
    const entries = [
      round(),
      append({
        kind: 'completion',
        exerciseId: 'fire.pushup-groove',
        element: 'fire',
        source: 'manual',
        trackId: 'push',
        amount: 4,
      }),
    ];
    expect(doneByTrack(entries)).toEqual({
      push: {amount: 9, sets: 2},
      squat: {amount: 10, sets: 1},
    });
  });
});

describe('other records', () => {
  it('shows a max test in the day', () => {
    recordMaxTest('push', 14);
    expect(activityForDay()).toEqual([
      expect.objectContaining({
        source: 'test',
        trackId: 'push',
        amount: 14,
        element: 'fire',
      }),
    ]);
  });

  it('counts the water counter and water-call drills as glasses', () => {
    logWaterGlass();
    append({
      kind: 'completion',
      exerciseId: 'water.sip',
      element: 'water',
      source: 'notification',
    });
    append({
      kind: 'completion',
      exerciseId: 'air.physiological-sigh',
      element: 'air',
      source: 'manual',
    });
    expect(hydrationGlasses(activityForDay())).toBe(2);
  });

  it('still counts old completions without the newer fields', () => {
    append({
      kind: 'completion',
      exerciseId: 'x',
      element: 'air',
      source: 'manual',
    });
    expect(activityForDay()).toEqual([
      expect.objectContaining({
        element: 'air',
        label: 'Drill',
        source: 'manual',
      }),
    ]);
  });

  it('ignores reminder bookkeeping', () => {
    const items = buildActivity({
      journal: [
        {id: 'f', kind: 'reminder.fired', at: 1, element: 'air', pulseId: 'p'},
      ],
      train: [],
    });
    expect(items).toEqual([]);
  });

  it('streaks across a chime today and a Train run yesterday', () => {
    round();
    addEntry({at: Date.now() - DAY, kindId: 'builtin.run-2mi', value: 1093});
    expect(streakDays()).toBe(2);
    expect(streakDays(new Date(), 'heart')).toBe(0);
  });
});

describe('recordDrillTap', () => {
  it('counts a set when the drill is a track’s current rung', () => {
    const push = TRACKS.find(t => t.id === 'push')!;
    const rungId = push.ladder[push.defaultRung].exerciseId;
    const drill = EXERCISE_LIBRARY.find(e => e.id === rungId);
    expect(drill).toBeDefined();
    expect(recordDrillTap(drill!)).toMatchObject({trackId: 'push', amount: 5});
  });

  it('logs a plain completion for any other drill', () => {
    const drill = EXERCISE_LIBRARY.find(e => e.id === 'water.sip')!;
    const entry = recordDrillTap(drill);
    expect(entry.trackId).toBeUndefined();
    expect(entry.amount).toBeUndefined();
  });
});
