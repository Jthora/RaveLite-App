import {DEFAULT_PLAN} from '../../domain/reminders/defaultPlan';
import type {Plan} from '../../domain/reminders/types';
import {store} from '../index';
import {CURRENT_SCHEMA_VERSION, KEYS} from '../keys';
import {
  V3_DEFAULT_PLAN,
  V4_DEFAULT_PLAN,
  V5_DEFAULT_PLAN,
  V6_DEFAULT_PLAN,
  runMigrations,
} from '../migrations';
import {DEFAULT_ACTIVE_HOURS} from '../../domain/ambient/types';
import {
  __resetProfileCache,
  loadProfile,
  needsSetup,
} from '../../domain/profile/repository';
import {AUTHOR_FACTS, usableDrills} from '../../domain/profile/kit';

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
    // Nor a profile: one stored before setup asks is the reason setup
    // never showed on a fresh install.
    expect(store.getString(KEYS.profile)).toBeUndefined();
    __resetProfileCache();
    expect(needsSetup()).toBe(true);
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
    expect(store.getNumber(KEYS.schemaVersion)).toBe(CURRENT_SCHEMA_VERSION);
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

describe('v3', () => {
  it('forgets the sub-tab each element was left on', () => {
    const key = KEYS.setting('shell.subTabByElement');
    store.set(KEYS.schemaVersion, 2);
    store.set(key, JSON.stringify({fire: 'train', air: 'history'}));
    store.set(KEYS.planCurrent, JSON.stringify({windows: []}));
    runMigrations(NOW);
    expect(store.getString(key)).toBeUndefined();
    // v2 already ran: the saved plan is left alone.
    expect(store.getString(KEYS.planBackupV1)).toBeUndefined();
    expect(store.getNumber(KEYS.schemaVersion)).toBe(CURRENT_SCHEMA_VERSION);
  });
});

describe('v4', () => {
  it('moves an untouched My day and plan to the morning', () => {
    store.set(KEYS.schemaVersion, 3);
    store.set(
      KEYS.activeHours,
      JSON.stringify({start: '09:00', end: '22:00', daysMask: 0b1111111}),
    );
    store.set(KEYS.planCurrent, JSON.stringify(V3_DEFAULT_PLAN));
    runMigrations(NOW);
    expect(json(KEYS.activeHours)).toEqual(DEFAULT_ACTIVE_HOURS);
    expect(json(KEYS.activeHours).start).toBe('05:00');
    expect(json(KEYS.planCurrent)).toEqual(DEFAULT_PLAN);
    expect(store.getString(KEYS.planBackupV1)).toBeUndefined();
  });

  it('leaves a My day or plan the operator changed', () => {
    store.set(KEYS.schemaVersion, 3);
    const hours = {start: '07:00', end: '23:00', daysMask: 0b0011111};
    const plan = {
      ...V3_DEFAULT_PLAN,
      windows: V3_DEFAULT_PLAN.windows.slice(1),
    };
    store.set(KEYS.activeHours, JSON.stringify(hours));
    store.set(KEYS.planCurrent, JSON.stringify(plan));
    runMigrations(NOW);
    expect(json(KEYS.activeHours)).toEqual(hours);
    expect(json(KEYS.planCurrent)).toEqual(plan);
  });
});

describe('v5', () => {
  it('gives an untouched v4 plan the Core check-ins', () => {
    store.set(KEYS.schemaVersion, 4);
    store.set(KEYS.planCurrent, JSON.stringify(V4_DEFAULT_PLAN));
    runMigrations(NOW);
    expect(json(KEYS.planCurrent)).toEqual(DEFAULT_PLAN);
    expect(
      json(KEYS.planCurrent).windows.map((w: {id: string}) => w.id),
    ).toContain('morning-intent');
  });
});

describe('v6', () => {
  it('ends an untouched My day at 21:00 and moves the Evening Review inside it', () => {
    store.set(KEYS.schemaVersion, 5);
    store.set(
      KEYS.activeHours,
      JSON.stringify({start: '05:00', end: '22:00', daysMask: 0b1111111}),
    );
    store.set(KEYS.planCurrent, JSON.stringify(V5_DEFAULT_PLAN));
    runMigrations(NOW);
    expect(json(KEYS.activeHours)).toEqual(DEFAULT_ACTIVE_HOURS);
    expect(json(KEYS.planCurrent)).toEqual(DEFAULT_PLAN);
  });

  it('leaves a My day the operator set', () => {
    const mine = {start: '06:00', end: '22:00', daysMask: 0b1111111};
    store.set(KEYS.schemaVersion, 5);
    store.set(KEYS.activeHours, JSON.stringify(mine));
    runMigrations(NOW);
    expect(json(KEYS.activeHours)).toEqual(mine);
  });
});

describe('v7', () => {
  it('gives an untouched v6 plan the morning blocks', () => {
    store.set(KEYS.schemaVersion, 6);
    store.set(KEYS.planCurrent, JSON.stringify(V6_DEFAULT_PLAN));
    runMigrations(NOW);
    expect(json(KEYS.planCurrent)).toEqual(DEFAULT_PLAN);
    expect(store.getNumber(KEYS.schemaVersion)).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('leaves a plan the operator changed', () => {
    const mine = {...V6_DEFAULT_PLAN, name: 'Mine'};
    store.set(KEYS.schemaVersion, 6);
    store.set(KEYS.planCurrent, JSON.stringify(mine));
    runMigrations(NOW);
    expect(json(KEYS.planCurrent)).toEqual(mine);
  });
});

describe('v8', () => {
  it("writes the author's kit into an install that has trained", () => {
    store.set(KEYS.schemaVersion, 7);
    store.set(
      KEYS.trainingEntries,
      JSON.stringify([{id: 'e1', at: NOW, kindId: 'builtin.run-2mi'}]),
    );
    runMigrations(NOW);
    __resetProfileCache();
    expect(loadProfile().facts).toEqual(AUTHOR_FACTS);
    expect(needsSetup()).toBe(false);
  });
});

describe('v10', () => {
  /** The author's profile as a phone held it on 20 Sep 2026. */
  const FLAT = {
    version: 1,
    facts: {
      kit: [
        'floor',
        'mat',
        'wall',
        'chair',
        'stairs',
        'hangPoint',
        'bricks',
        'staff',
        'ball',
        'yard',
        'streets',
      ],
      noise: 'free',
      corrections: ['UCS', 'APT', 'Hourglass'],
    },
    mode: {id: 'travelling', startedAt: NOW, kit: ['floor', 'hangPoint']},
  };

  it('turns a flat kit into places, and keeps every drill', () => {
    store.set(KEYS.schemaVersion, 8);
    store.set(KEYS.profile, JSON.stringify(FLAT));
    runMigrations(NOW);
    const profile = json(KEYS.profile);
    const kinds = profile.facts.places.map((p: {kind: string}) => p.kind);
    expect(kinds).toEqual(['room', 'yard', 'porch', 'streets']);
    // What you carry stays on you.
    expect(profile.facts.kit).toEqual(['bricks', 'staff', 'ball']);
    // The old hang point is both heights, as it behaved.
    const porch = profile.facts.places[2];
    expect(porch.kit).toEqual(['hangLow', 'hangHigh']);
    // And the same program comes out of it as out of the author's facts.
    const ids = (f: typeof AUTHOR_FACTS) =>
      usableDrills(f)
        .map(d => d.id)
        .sort();
    expect(ids(profile.facts)).toEqual(ids(AUTHOR_FACTS));
    // A travelling room keeps its flat list, renamed.
    expect(profile.mode.kit).toEqual(['floor', 'hangLow', 'hangHigh']);
  });

  it('reaches a phone that ran the hang split as v9', () => {
    store.set(KEYS.schemaVersion, 9);
    store.set(
      KEYS.profile,
      JSON.stringify({
        ...FLAT,
        facts: {
          ...FLAT.facts,
          kit: [
            ...FLAT.facts.kit.filter(k => k !== 'hangPoint'),
            'hangLow',
            'hangHigh',
            'doorway',
            'table',
          ],
        },
      }),
    );
    runMigrations(NOW);
    const facts = json(KEYS.profile).facts;
    expect(facts.places.map((p: {kind: string}) => p.kind)).toEqual([
      'room',
      'yard',
      'porch',
      'streets',
    ]);
    expect(facts.places[3].kit).toEqual(['streets', 'kerb', 'hill']);
  });

  it('leaves a profile that already has places alone', () => {
    const placed = {version: 1, facts: AUTHOR_FACTS};
    store.set(KEYS.schemaVersion, 8);
    store.set(KEYS.profile, JSON.stringify(placed));
    runMigrations(NOW);
    expect(json(KEYS.profile)).toEqual(placed);
  });
});

it('does not leave the old profile cached once it has migrated it', () => {
  // Read before migrating — as a background notification handler can —
  // and the session used to keep the flat kit, and an unknown hangPoint,
  // until the app was restarted.
  store.set(KEYS.schemaVersion, 8);
  store.set(
    KEYS.profile,
    JSON.stringify({
      version: 1,
      facts: {kit: ['floor', 'streets'], noise: 'normal', corrections: []},
    }),
  );
  __resetProfileCache();
  expect(loadProfile().facts.places).toBeUndefined();
  runMigrations(NOW);
  expect(loadProfile().facts.places?.map(p => p.kind)).toEqual([
    'room',
    'streets',
  ]);
});
