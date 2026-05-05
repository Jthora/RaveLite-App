import {store} from './index';
import {CURRENT_SCHEMA_VERSION, KEYS} from './keys';

/**
 * Storage schema migration runner.
 *
 * Called once at app start (from App.tsx). Reads the persisted schema
 * version, applies any pending step-migrations, then writes the current
 * version back.
 *
 * Today the body is a no-op — there is only one shipped version. This
 * file exists so the call site is wired up *before* we ever need a real
 * migration; that way the first breaking change is "add a case", not
 * "rewire startup, hope nothing else breaks".
 *
 * Conventions:
 *   - Migrations are forward-only. We do not downgrade.
 *   - Each step takes the store from version N to N+1. Compose for jumps.
 *   - Migrations must be idempotent (safe to re-run on partial failure).
 */
export function runMigrations(): void {
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

  // Future step migrations go here, e.g.:
  //   if (from < 2) { migrateV1toV2(); }
  //   if (from < 3) { migrateV2toV3(); }

  store.set(KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
}
