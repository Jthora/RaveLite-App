import {DEFAULT_PLAN} from '../../domain/reminders/defaultPlan';
import type {Plan} from '../../domain/reminders/types';
import {store} from '../index';
import {CURRENT_SCHEMA_VERSION, KEYS} from '../keys';
import {runMigrations} from '../migrations';

const NOW = 1_700_000_000_000;

/** A saved plan from before rounds: still has a desk-hours cadence. */
const OLD_PLAN: Plan = {
  ...DEFAULT_PLAN,
  windows: [
    {
      id: 'desk-hours',
      label: 'Desk Hours',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      slots: [{element: 'air', everyMinutes: 30}],
    },
    ...DEFAULT_PLAN.windows,
  ],
};

const json = (key: string) => JSON.parse(store.getString(key)!);

beforeEach(() => store.clearAll());

describe('runMigrations', () => {
  it('only records the version on a fresh install', () => {
    runMigrations(NOW);
    expect(store.getNumber(KEYS.schemaVersion)).toBe(CURRENT_SCHEMA_VERSION);
    expect(store.getString(KEYS.planCurrent)).toBeUndefined();
    expect(store.getString(KEYS.planBackupV1)).toBeUndefined();
  });

  it('keeps an older plan as a backup and installs the new default', () => {
    store.set(KEYS.schemaVersion, 1);
    const raw = JSON.stringify(OLD_PLAN);
    store.set(KEYS.planCurrent, raw);
    runMigrations(NOW);
    expect(store.getString(KEYS.planBackupV1)).toBe(raw);
    expect(json(KEYS.planCurrent)).toEqual(DEFAULT_PLAN);
    expect(store.getNumber(KEYS.planReplacedAt)).toBe(NOW);
    expect(store.getNumber(KEYS.schemaVersion)).toBe(2);
  });

  it('leaves a plan that already matches the default alone', () => {
    store.set(KEYS.schemaVersion, 1);
    store.set(KEYS.planCurrent, JSON.stringify(DEFAULT_PLAN));
    runMigrations(NOW);
    expect(store.getString(KEYS.planBackupV1)).toBeUndefined();
    expect(store.getNumber(KEYS.planReplacedAt)).toBeUndefined();
  });

  it('drops the Daily Sets day window but keeps the program', () => {
    store.set(KEYS.schemaVersion, 1);
    const tracks = {push: {enabled: true, rung: 2, testMax: 14}};
    store.set(
      KEYS.programState,
      JSON.stringify({
        version: 1,
        startDay: '2026-09-01',
        dayStart: '09:00',
        dayEnd: '21:00',
        tracks,
      }),
    );
    runMigrations(NOW);
    expect(json(KEYS.programState)).toEqual({
      version: 1,
      startDay: '2026-09-01',
      tracks,
    });
  });

  it('is safe to run again after an interrupted run', () => {
    store.set(KEYS.schemaVersion, 1);
    store.set(KEYS.planCurrent, JSON.stringify(OLD_PLAN));
    runMigrations(NOW);
    store.set(KEYS.schemaVersion, 1);
    runMigrations(NOW + 1);
    expect(json(KEYS.planBackupV1)).toEqual(OLD_PLAN);
    expect(json(KEYS.planCurrent)).toEqual(DEFAULT_PLAN);
  });

  it('leaves data from a newer app version untouched', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    store.set(KEYS.schemaVersion, 99);
    store.set(KEYS.planCurrent, JSON.stringify(OLD_PLAN));
    runMigrations(NOW);
    expect(json(KEYS.planCurrent)).toEqual(OLD_PLAN);
    warn.mockRestore();
  });
});
