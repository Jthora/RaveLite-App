import {store} from './index';
import {CURRENT_SCHEMA_VERSION, KEYS} from './keys';
import {DEFAULT_PLAN} from '../domain/reminders/defaultPlan';
import {plansEqual} from '../domain/reminders/planMutations';
import type {Plan} from '../domain/reminders/types';

/**
 * Storage schema migration runner.
 *
 * Called once at app start (from App.tsx), before any scheduler starts.
 * Reads the persisted schema version, applies any pending step-migrations,
 * then writes the current version back.
 *
 * Conventions:
 *   - Migrations are forward-only. We do not downgrade.
 *   - Each step takes the store from version N to N+1. Compose for jumps.
 *   - Migrations must be idempotent (safe to re-run on partial failure).
 */
export function runMigrations(now: number = Date.now()): void {
  const stored = store.getNumber(KEYS.schemaVersion);
  const from = typeof stored === 'number' ? stored : 0;

  if (from === CURRENT_SCHEMA_VERSION) {
    return;
  }
  if (from > CURRENT_SCHEMA_VERSION) {
    // eslint-disable-next-line no-console
    console.warn(
      `[migrations] stored schema v${from} is newer than app v${CURRENT_SCHEMA_VERSION}; ` +
        'leaving data untouched (downgrade not supported).',
    );
    return;
  }

  if (from < 2) {
    migrateToRoundsAndMyDay(now);
  }

  store.set(KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
}

/**
 * v2 — Daily Sets rounds and one My day window.
 *
 *  - A saved plan that isn't the new default is kept under `planBackupV1`
 *    and replaced, so its posture and presence cadences stop chiming on
 *    top of the rounds. Setup offers to restore it.
 *  - Daily Sets lose their own day window; rounds spread across My day.
 *
 * A fresh install has nothing saved yet, so nothing changes.
 */
function migrateToRoundsAndMyDay(now: number): void {
  const rawPlan = store.getString(KEYS.planCurrent);
  if (rawPlan !== undefined && !isDefaultPlan(rawPlan)) {
    // Keep the first backup if an earlier run was interrupted.
    if (store.getString(KEYS.planBackupV1) === undefined) {
      store.set(KEYS.planBackupV1, rawPlan);
    }
    store.set(KEYS.planCurrent, JSON.stringify(DEFAULT_PLAN));
    store.set(KEYS.planReplacedAt, now);
  }

  const rawProgram = store.getString(KEYS.programState);
  if (rawProgram !== undefined) {
    try {
      const program = JSON.parse(rawProgram) as Record<string, unknown>;
      delete program.dayStart;
      delete program.dayEnd;
      store.set(KEYS.programState, JSON.stringify(program));
    } catch {
      // Corrupt: loadProgram already falls back to a fresh program.
    }
  }
}

function isDefaultPlan(raw: string): boolean {
  try {
    return plansEqual(JSON.parse(raw) as Plan, DEFAULT_PLAN);
  } catch {
    return false;
  }
}
