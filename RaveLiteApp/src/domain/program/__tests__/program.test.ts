import {store} from '../../../storage';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import type {JournalEntry} from '../../journal/types';
import {
  applyTest,
  isTestDue,
  levelUp,
  phaseForWeek,
  prescribeDay,
  programWeek,
  readyToLevelUp,
  setSizeFor,
  setsForWeek,
} from '../progression';
import {doneByTrack, firedSetIds} from '../progress';
import {
  defaultProgram,
  levelUpTrack,
  loadProgram,
  recordMaxTest,
  setTrackEnabled,
} from '../repository';
import {TRACKS, trackById} from '../tracks';
import {SETS_WINDOW_ID} from '../types';

// Monday 14 Sep 2026 (local), the default program start in these tests.
const MONDAY = new Date(2026, 8, 14);
const TUESDAY = new Date(2026, 8, 15);
const startProgram = () => defaultProgram(MONDAY);

describe('track catalog', () => {
  it('every rung points at a library drill of the same element', () => {
    const problems: string[] = [];
    for (const t of TRACKS) {
      for (const r of t.ladder) {
        const ex = EXERCISE_LIBRARY.find(e => e.id === r.exerciseId);
        if (!ex) {
          problems.push(`${t.id}: missing ${r.exerciseId}`);
        } else if (ex.element !== t.element) {
          problems.push(`${t.id}: ${r.exerciseId} is ${ex.element}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('defaults are sane', () => {
    for (const t of TRACKS) {
      expect(t.defaultRung).toBeGreaterThanOrEqual(0);
      expect(t.defaultRung).toBeLessThan(t.ladder.length);
      expect(t.baseSets).toBeLessThanOrEqual(t.maxSets);
      expect(t.days.every(d => d >= 0 && d <= 6)).toBe(true);
    }
  });

  it('every push day also has a row day (push/pull balance)', () => {
    const row = trackById('row');
    expect(trackById('push').days.every(d => row.days.includes(d))).toBe(true);
  });
});

describe('progression', () => {
  const push = trackById('push');

  it('counts program weeks from the start day', () => {
    expect(programWeek('2026-09-14', new Date(2026, 8, 14))).toBe(1);
    expect(programWeek('2026-09-14', new Date(2026, 8, 20))).toBe(1);
    expect(programWeek('2026-09-14', new Date(2026, 8, 21))).toBe(2);
    expect(programWeek('2026-09-14', new Date(2026, 8, 1))).toBe(1);
  });

  it('every fourth week is a deload', () => {
    expect([1, 2, 3, 4, 5, 8, 12].map(phaseForWeek)).toEqual([
      'build',
      'build',
      'build',
      'deload',
      'build',
      'deload',
      'deload',
    ]);
  });

  it('ramps sets one per build week, deloads, and caps at maxSets', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(w => setsForWeek(push, w))).toEqual([
      4, 5, 6, 4, 5, 6, 7, 4,
    ]);
    expect(setsForWeek(push, 200)).toBeLessThanOrEqual(push.maxSets);
  });

  it('sets are about half the tested max', () => {
    expect(setSizeFor(push, {enabled: true, rung: 1, testMax: 20})).toBe(10);
    expect(setSizeFor(push, {enabled: true, rung: 1, testMax: 1})).toBe(1);
    const hang = trackById('hang');
    expect(setSizeFor(hang, {enabled: true, rung: 0, testMax: 31})).toBe(15);
    expect(setSizeFor(hang, {enabled: true, rung: 0, testMax: 8})).toBe(10);
  });

  it('prescribes nothing on rest days or for disabled tracks', () => {
    const program = startProgram();
    const crunch = trackById('crunch');
    expect(
      prescribeDay(crunch, program.tracks.crunch, program, TUESDAY),
    ).toBeUndefined();
    const off = {...program.tracks.push, enabled: false};
    expect(prescribeDay(push, off, program, MONDAY)).toBeUndefined();
    expect(
      prescribeDay(push, program.tracks.push, program, MONDAY),
    ).toMatchObject({
      label: 'Push-ups',
      setSize: 5,
      sets: 4,
      week: 1,
      phase: 'build',
    });
  });

  it('unlocks the next rung at graduateAt and halves the max on level-up', () => {
    const variants = trackById('push-variants');
    const strong = {enabled: true, rung: 0, testMax: 24, testedAt: 1};
    expect(readyToLevelUp(variants, strong)).toBe(true);
    expect(readyToLevelUp(variants, {...strong, testMax: 20})).toBe(false);
    expect(levelUp(variants, strong)).toEqual({
      enabled: true,
      rung: 1,
      testMax: 12,
    });
    const top = {...strong, rung: variants.ladder.length - 1};
    expect(levelUp(variants, top)).toBe(top);
  });

  it('keeps Push on the tested push-up however strong the sets get', () => {
    const standard = {enabled: true, rung: 1, testMax: 60, testedAt: 1};
    expect(push.ladder[push.ladder.length - 1].exerciseId).toBe(
      'fire.pushup-groove',
    );
    expect(readyToLevelUp(push, standard)).toBe(false);
    expect(levelUp(push, standard)).toBe(standard);
  });

  it('a test is due when untested, or on a deload week after an old test', () => {
    const program = startProgram();
    const untested = program.tracks.push;
    expect(isTestDue(program, untested, MONDAY)).toBe(true);
    const tested = applyTest(untested, 22, new Date(2026, 8, 22).getTime());
    expect(isTestDue(program, tested, new Date(2026, 8, 23))).toBe(false);
    // Week 4 starts 5 Oct 2026.
    expect(isTestDue(program, tested, new Date(2026, 9, 6))).toBe(true);
    const retested = applyTest(tested, 24, new Date(2026, 9, 5, 12).getTime());
    expect(isTestDue(program, retested, new Date(2026, 9, 6))).toBe(false);
  });
});

describe('progress from the journal', () => {
  const entries: JournalEntry[] = [
    {
      id: 'a',
      at: 1,
      kind: 'reminder.fired',
      pulseId: 'sets:x:push:1',
      element: 'fire',
      windowId: SETS_WINDOW_ID,
    },
    {
      id: 'b',
      at: 2,
      kind: 'completion',
      exerciseId: 'fire.pushup-groove',
      element: 'fire',
      source: 'always-on',
      trackId: 'push',
      amount: 10,
    },
    {
      id: 'c',
      at: 3,
      kind: 'completion',
      exerciseId: 'fire.pushup-groove',
      element: 'fire',
      source: 'manual',
      trackId: 'push',
      amount: 8,
    },
    {
      id: 'd',
      at: 4,
      kind: 'completion',
      exerciseId: 'air.chin-tuck',
      element: 'air',
      source: 'manual',
    },
    {
      id: 'e',
      at: 5,
      kind: 'reminder.fired',
      pulseId: 'plan:desk:0:1',
      element: 'air',
      windowId: 'desk-hours',
    },
  ];

  it('sums amount and sets per track', () => {
    expect(doneByTrack(entries)).toEqual({push: {amount: 18, sets: 2}});
  });

  it('collects only set pulse ids', () => {
    expect([...firedSetIds(entries)]).toEqual(['sets:x:push:1']);
  });
});

describe('program repository', () => {
  beforeEach(() => store.clearAll());

  it('creates and persists a default program on first load', () => {
    const p = loadProgram(MONDAY);
    expect(p.startDay).toBe('2026-09-14');
    expect(Object.keys(p.tracks).sort()).toEqual(TRACKS.map(t => t.id).sort());
    expect(loadProgram(TUESDAY).startDay).toBe('2026-09-14');
  });

  it('records tests, toggles tracks and levels up', () => {
    loadProgram(MONDAY);
    recordMaxTest('push', 30, 123);
    expect(loadProgram().tracks.push).toMatchObject({
      testMax: 30,
      testedAt: 123,
    });
    setTrackEnabled('crunch', false);
    expect(loadProgram().tracks.crunch.enabled).toBe(false);
    recordMaxTest('push-variants', 24, 456);
    levelUpTrack('push-variants');
    expect(loadProgram().tracks['push-variants']).toEqual({
      enabled: true,
      rung: 1,
      testMax: 12,
    });
  });
});
