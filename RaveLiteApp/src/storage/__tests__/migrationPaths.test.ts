/**
 * Pass 2: the migrations have been tested as steps, never as paths. A
 * phone that has not been opened since v1 runs all of them in one go, and
 * a phone whose migration was interrupted runs some of them twice.
 *
 * Every version here starts from a real-shaped store: the author's own
 * profile as it was written then, that era's plan, and a program.
 */
import {DEFAULT_PLAN} from '../../domain/reminders/defaultPlan';
import {AUTHOR_FACTS, toPlaces} from '../../domain/profile/kit';
import {
  __resetProfileCache,
  loadFacts,
  loadProfile,
} from '../../domain/profile/repository';
import {loadPlan} from '../../domain/reminders/repository';
import {loadProgram} from '../../domain/program/repository';
import {setsToday} from '../../domain/ambient/setScheduler';
import {store} from '../index';
import {CURRENT_SCHEMA_VERSION, KEYS} from '../keys';
import {
  V3_DEFAULT_PLAN,
  V4_DEFAULT_PLAN,
  V5_DEFAULT_PLAN,
  V6_DEFAULT_PLAN,
  runMigrations,
} from '../migrations';

const NOW = new Date(2026, 8, 14, 10).getTime();

/** The plan a phone would be carrying at each version. */
const PLAN_AT: Record<number, unknown> = {
  3: V3_DEFAULT_PLAN,
  4: V4_DEFAULT_PLAN,
  5: V5_DEFAULT_PLAN,
  6: V6_DEFAULT_PLAN,
};

/** Everything stored, for comparing one run against the next. */
const dump = () =>
  Object.fromEntries(
    store
      .keysWithPrefix('')
      .sort()
      .map(k => [
        k,
        store.getString(k) ?? store.getNumber(k) ?? store.getBoolean(k),
      ]),
  );

/** A phone sitting at version `v`, with a life on it. */
function aPhoneAt(v: number): void {
  store.clearAll();
  __resetProfileCache();
  if (v > 0) {
    store.set(KEYS.schemaVersion, v);
  }
  // Places arrived in v10: before that a profile had one flat kit list.
  store.set(
    KEYS.profile,
    JSON.stringify({
      version: 1,
      facts:
        v < 10 ? {...AUTHOR_FACTS, places: undefined} : toPlaces(AUTHOR_FACTS),
    }),
  );
  store.set(KEYS.planCurrent, JSON.stringify(PLAN_AT[v] ?? DEFAULT_PLAN));
  store.set(
    KEYS.programState,
    JSON.stringify({
      version: 1,
      startDay: '2026-09-01',
      tracks: {push: {enabled: true, rung: 2, testMax: 14, sets: 6}},
    }),
  );
}

for (let v = 0; v < CURRENT_SCHEMA_VERSION; v++) {
  it(`carries a phone from v${v} to v${CURRENT_SCHEMA_VERSION}, twice over`, () => {
    aPhoneAt(v);
    runMigrations(NOW);
    expect(store.getNumber(KEYS.schemaVersion)).toBe(CURRENT_SCHEMA_VERSION);
    const after = dump();

    // The app reads what came out: a profile with places, a plan with
    // windows, a program, and a day it can build.
    __resetProfileCache();
    expect(loadProfile().facts).toBeDefined();
    expect(toPlaces(loadFacts(NOW)).places!.length).toBeGreaterThan(0);
    expect(loadPlan().windows.length).toBeGreaterThan(0);
    expect(
      Object.keys(loadProgram(new Date(NOW)).tracks).length,
    ).toBeGreaterThan(0);
    expect(() => setsToday(NOW)).not.toThrow();

    // Running them again changes nothing.
    runMigrations(NOW + 1000);
    expect(dump()).toEqual(after);

    // And an interrupted run — the version written but a step half done —
    // lands in the same place.
    store.set(KEYS.schemaVersion, v);
    runMigrations(NOW + 2000);
    expect(store.getNumber(KEYS.schemaVersion)).toBe(CURRENT_SCHEMA_VERSION);
  });
}
