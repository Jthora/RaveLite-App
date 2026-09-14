import {store} from '../../../storage';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import type {JournalEntry} from '../../journal/types';
import {DEFAULT_PLAN} from '../../reminders/defaultPlan';
import {expandPlanToFires} from '../../reminders/expandPlan';
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
  prescriptionsFor,
  recordMaxTest,
  setTrackEnabled,
} from '../repository';
import {
  CLEARANCE_MS,
  MIN_GAP_MS,
  distributeSets,
  selectUpcomingSets,
  setFireId,
} from '../schedule';
import {TRACKS, trackById} from '../tracks';
import {SETS_WINDOW_ID, type DayPrescription, type SetFire} from '../types';

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
    expect(prescribeDay(crunch, program.tracks.crunch, program, TUESDAY)).toBeUndefined();
    const off = {...program.tracks.push, enabled: false};
    expect(prescribeDay(push, off, program, MONDAY)).toBeUndefined();
    expect(prescribeDay(push, program.tracks.push, program, MONDAY)).toMatchObject({
      label: 'Push-ups',
      setSize: 5,
      sets: 4,
      week: 1,
      phase: 'build',
    });
  });

  it('unlocks the next rung at graduateAt and halves the max on level-up', () => {
    const strong = {enabled: true, rung: 1, testMax: 30, testedAt: 1};
    expect(readyToLevelUp(push, strong)).toBe(true);
    expect(readyToLevelUp(push, {...strong, testMax: 20})).toBe(false);
    expect(levelUp(push, strong)).toEqual({enabled: true, rung: 2, testMax: 15});
    const top = {...strong, rung: push.ladder.length - 1};
    expect(levelUp(push, top)).toBe(top);
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

describe('set scheduling', () => {
  const program = startProgram();
  const prescriptions = prescriptionsFor(program, MONDAY);
  const dayStart = MONDAY.getTime();
  const blockedTs = expandPlanToFires(DEFAULT_PLAN, dayStart, dayStart + 86_399_999).map(
    f => f.ts,
  );
  const fires = distributeSets({
    date: MONDAY,
    dayStart: program.dayStart,
    dayEnd: program.dayEnd,
    prescriptions,
    blockedTs,
  });

  it('places every prescribed set', () => {
    const total = prescriptions.reduce((s, p) => s + p.sets, 0);
    expect(fires).toHaveLength(total);
    expect(new Set(fires.map(f => f.id)).size).toBe(total);
  });

  it('keeps sets apart from each other and clear of plan chimes', () => {
    const sorted = [...fires].sort((a, b) => a.ts - b.ts);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].ts - sorted[i - 1].ts).toBeGreaterThanOrEqual(MIN_GAP_MS);
    }
    const clashes = fires.filter(f =>
      blockedTs.some(b => Math.abs(b - f.ts) < CLEARANCE_MS),
    );
    expect(clashes.map(f => f.id)).toEqual([]);
  });

  it('spreads each track across the day instead of bunching', () => {
    const pushFires = fires.filter(f => f.prescription.trackId === 'push');
    const first = new Date(pushFires[0].ts).getHours();
    const lastFire = new Date(pushFires[pushFires.length - 1].ts).getHours();
    expect(first).toBeLessThan(11);
    expect(lastFire).toBeGreaterThanOrEqual(17);
  });

  it('is deterministic', () => {
    const again = distributeSets({
      date: MONDAY,
      dayStart: program.dayStart,
      dayEnd: program.dayEnd,
      prescriptions,
      blockedTs,
    });
    expect(again).toEqual(fires);
  });
});

describe('selecting upcoming sets', () => {
  const p: DayPrescription = {
    trackId: 'push',
    element: 'fire',
    exerciseId: 'fire.pushup-groove',
    label: 'Push-ups',
    unit: 'reps',
    setSize: 10,
    sets: 4,
    week: 1,
    phase: 'build',
  };
  const fire = (i: number): SetFire => ({
    id: setFireId('2026-09-14', 'push', i),
    ts: i * 3_600_000,
    element: 'fire',
    exerciseId: p.exerciseId,
    prescription: {
      trackId: 'push',
      label: p.label,
      unit: 'reps',
      amount: 10,
      setIndex: i,
      sets: 4,
    },
  });
  const fires = [1, 2, 3, 4].map(fire);
  const base = {fires, prescriptions: [p], graceMs: 60_000};

  it('an answered chime does not retire a later one', () => {
    const r = selectUpcomingSets({
      ...base,
      doneByTrack: {push: {amount: 10}},
      firedIds: new Set([fires[0].id]),
      now: fires[0].ts + 30_000,
    });
    expect(r.keep.map(f => f.prescription.setIndex)).toEqual([2, 3, 4]);
    expect(r.drop).toEqual([]);
  });

  it('extra hand-logged sets retire the latest chimes', () => {
    const r = selectUpcomingSets({
      ...base,
      doneByTrack: {push: {amount: 30}},
      firedIds: new Set([fires[0].id]),
      now: fires[0].ts + 60_000,
    });
    expect(r.keep.map(f => f.prescription.setIndex)).toEqual([2]);
    expect(r.drop).toEqual([fires[2].id, fires[3].id]);
  });

  it('nothing is kept once the quota is met', () => {
    const r = selectUpcomingSets({
      ...base,
      doneByTrack: {push: {amount: 40}},
      firedIds: new Set(),
      now: 0,
    });
    expect(r.keep).toEqual([]);
    expect(r.drop).toHaveLength(4);
  });
});

describe('progress from the journal', () => {
  const entries: JournalEntry[] = [
    {id: 'a', at: 1, kind: 'reminder.fired', pulseId: 'sets:x:push:1', element: 'fire', windowId: SETS_WINDOW_ID},
    {id: 'b', at: 2, kind: 'completion', exerciseId: 'fire.pushup-groove', element: 'fire', source: 'always-on', trackId: 'push', amount: 10},
    {id: 'c', at: 3, kind: 'completion', exerciseId: 'fire.pushup-groove', element: 'fire', source: 'manual', trackId: 'push', amount: 8},
    {id: 'd', at: 4, kind: 'completion', exerciseId: 'air.chin-tuck', element: 'air', source: 'manual'},
    {id: 'e', at: 5, kind: 'reminder.fired', pulseId: 'plan:desk:0:1', element: 'air', windowId: 'desk-hours'},
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
    expect(loadProgram().tracks.push).toMatchObject({testMax: 30, testedAt: 123});
    setTrackEnabled('crunch', false);
    expect(loadProgram().tracks.crunch.enabled).toBe(false);
    levelUpTrack('push');
    expect(loadProgram().tracks.push).toEqual({enabled: true, rung: 2, testMax: 15});
  });
});
