import {replaceStoredData, store} from '../../storage';
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
 *
 * Format 2 keeps each value's type. Format 1 wrote numbers and switches
 * as text, which a restore then put back as text: every volume, every
 * muted element and every ticked health check read as unset. Format 1
 * files still restore — the store reads "75" as 75 and "true" as true.
 */

export const BACKUP_FORMAT = 2;

type Value = string | number | boolean;

export interface Backup {
  format: number;
  /** App schema the export came from; a restore refuses a newer one. */
  schema: number;
  exportedAt: number;
  /** Every key in storage, as it was stored, with its type. */
  entries: Record<string, Value>;
}

/** Keys that are caches or device-specific, and are not worth carrying. */
const SKIP_PREFIXES = ['stats.cache.', 'ambient.session.'];

const carried = (key: string) => !SKIP_PREFIXES.some(p => key.startsWith(p));

export function buildBackup(now: number = Date.now()): Backup {
  const entries: Record<string, Value> = {};
  for (const key of store.keysWithPrefix('').filter(carried)) {
    // Text first, so text that happens to look like a number stays text.
    const value =
      store.getString(key) ?? store.getNumber(key) ?? store.getBoolean(key);
    if (value !== undefined) {
      entries[key] = value;
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
  | {ok: false; why: string; unchanged?: boolean};

const isValue = (v: unknown): v is Value =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

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
 *
 * It resolves only once the disk holds the backup and has been read back
 * to prove it. If it cannot, what was there before is put back and the
 * result says so — a restore never leaves half of each.
 */
export async function restoreBackup(text: string): Promise<RestoreResult> {
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
  // A file with no schema — hand-edited, or from before it was written
  // down — is read as the oldest one, so the migrations run over it.
  const schema = typeof backup.schema === 'number' ? backup.schema : 0;
  if (schema > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      why: 'That export was made by a newer RaveLite. Update the app, then restore it.',
    };
  }
  const entries = Object.entries(backup.entries).filter(
    (e): e is [string, Value] => isValue(e[1]),
  );
  if (entries.length === 0) {
    return {ok: false, why: 'That export holds no data. Use a different file.'};
  }
  // An older export runs through the migrations on the next launch.
  const withSchema: [string, Value][] = [
    ...entries.filter(([k]) => k !== KEYS.schemaVersion),
    [KEYS.schemaVersion, schema],
  ];
  const result = await replaceStoredData(withSchema);
  if (!result.ok) {
    return {
      ok: false,
      why: result.rolledBack
        ? `Restore failed (${result.why}). Your data has not changed.`
        : `Restore failed (${result.why}). Export your data before you try again.`,
      unchanged: result.rolledBack,
    };
  }
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
