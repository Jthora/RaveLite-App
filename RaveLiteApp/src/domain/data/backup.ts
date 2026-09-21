import {store} from '../../storage';
import {CURRENT_SCHEMA_VERSION, KEYS} from '../../storage/keys';

/**
 * Everything the app knows about you, in one file you keep.
 *
 * Two reasons it exists. The first is yours: no account, no server and no
 * cloud means the only copy of a year's training is on one phone, and a
 * new signing key or a lost phone would take it with them. The second is
 * the beta's: a tester can attach their data to a bug report without
 * anyone having to build an account system to read it.
 *
 * The format is deliberately dumb — every stored key, verbatim — so a
 * restore is exact and an export can be read with any text editor.
 */

export const BACKUP_FORMAT = 1;

export interface Backup {
  format: number;
  /** App schema the export came from; a restore refuses a newer one. */
  schema: number;
  exportedAt: number;
  /** Every key in storage, as it was stored. */
  entries: Record<string, string>;
}

/** Keys that are caches or device-specific, and are not worth carrying. */
const SKIP_PREFIXES = ['stats.cache.', 'ambient.session.'];

const carried = (key: string) => !SKIP_PREFIXES.some(p => key.startsWith(p));

export function buildBackup(now: number = Date.now()): Backup {
  const entries: Record<string, string> = {};
  for (const key of store.keysWithPrefix('').filter(carried)) {
    const value = store.getString(key);
    if (value !== undefined) {
      entries[key] = value;
      continue;
    }
    const n = store.getNumber(key);
    if (n !== undefined) {
      entries[key] = String(n);
      continue;
    }
    const b = store.getBoolean(key);
    if (b !== undefined) {
      entries[key] = b ? 'true' : 'false';
    }
  }
  return {
    format: BACKUP_FORMAT,
    schema: CURRENT_SCHEMA_VERSION,
    exportedAt: now,
    entries,
  };
}

/** A name that sorts by date and says what it is. */
export function backupFilename(now: number = Date.now()): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `ravelite-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

export type RestoreResult =
  | {ok: true; entries: number; from: number}
  | {ok: false; why: string};

/** What a backup holds, without writing anything. */
export function readBackup(text: string): Backup | undefined {
  try {
    const parsed = JSON.parse(text) as Backup;
    if (
      typeof parsed?.format !== 'number' ||
      typeof parsed.entries !== 'object' ||
      parsed.entries === null
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

/**
 * Put a backup back. Everything currently stored is replaced: a restore
 * is a restore, not a merge, because merging two training logs would
 * invent days that never happened.
 */
export function restoreBackup(text: string): RestoreResult {
  const backup = readBackup(text);
  if (!backup) {
    return {ok: false, why: 'That file is not a RaveLite export.'};
  }
  if (backup.format > BACKUP_FORMAT) {
    return {
      ok: false,
      why: 'That export came from a newer RaveLite. Update the app first.',
    };
  }
  if (backup.schema > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      why: `That export is from schema v${backup.schema}; this app reads up to v${CURRENT_SCHEMA_VERSION}.`,
    };
  }
  const entries = Object.entries(backup.entries);
  if (entries.length === 0) {
    return {ok: false, why: 'That export is empty.'};
  }
  store.clearAll();
  for (const [key, value] of entries) {
    store.set(key, value);
  }
  // An older export runs through the migrations on the next launch.
  store.set(KEYS.schemaVersion, backup.schema);
  return {ok: true, entries: entries.length, from: backup.exportedAt};
}

/** How much of a life is in here, for the confirmation copy. */
export function backupSummary(backup: Backup): string {
  const keys = Object.keys(backup.entries);
  const days = new Set(
    keys
      .filter(k => k.startsWith(KEYS.journalPrefix))
      .map(k => k.slice(KEYS.journalPrefix.length).split('.')[0]),
  ).size;
  const logged = keys.filter(k => k.startsWith(KEYS.journalPrefix)).length;
  return `${days} day${days === 1 ? '' : 's'}, ${logged} logged thing${
    logged === 1 ? '' : 's'
  }`;
}
