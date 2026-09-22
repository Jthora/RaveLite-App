/**
 * Persistence layer — write-through bridge between the synchronous
 * in-memory `memoryStore` (which the rest of the app reads from on hot
 * paths) and `AsyncStorage` (which actually survives an app kill).
 *
 * Boot flow:
 *   1. App.tsx awaits `hydratePersistence()` once, BEFORE rendering the
 *      tree. This pulls every `ravelite.v1.*` key out of AsyncStorage
 *      and seeds `memoryStore` with it.
 *   2. The app renders. All reads stay synchronous via memoryStore.
 *   3. Every `store.set(k, v)` (see `storage/index.ts`) writes through
 *      to AsyncStorage, in order, and is tracked until it lands.
 *
 * Three rules, each learned from a way this used to lose data:
 *
 *   - **A write that fails is counted and said.** Every write used to end
 *     in `.catch(() => {})`: a full disk meant nothing new was saved and
 *     nothing said so, and the next restart quietly dropped it all.
 *   - **Nothing restarts the app with writes still in flight.** Anything
 *     about to restart awaits `flushPersistence()` first.
 *   - **If the saved data cannot be read, nothing is written.** A failed
 *     read at boot used to look like a new install — setup ran, saved a
 *     profile, and overwrote the real one on disk.
 *
 * MMKV swap (later): replace memoryStore + this file with a single
 * synchronous-and-persistent MMKV-backed store.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {memoryStore} from './memoryStore';

const PREFIX = 'ravelite.v1.';

type Value = string | number | boolean;

let hydration: Promise<void> | null = null;

// ─── Health ─────────────────────────────────────────────────────────────

export interface PersistenceHealth {
  /** Writes that did not reach disk this session. */
  failures: number;
  lastError?: string;
  lastAt?: number;
  /** The saved data could not be read at boot; writing is off. */
  readFailed: boolean;
}

const health: PersistenceHealth = {failures: 0, readFailed: false};
const listeners = new Set<() => void>();
/** Set by the diagnostics log, which cannot be imported here. */
let report: ((what: string, error: unknown) => void) | undefined;
let reporting = false;

export function persistenceHealth(): Readonly<PersistenceHealth> {
  return health;
}

export function subscribePersistence(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Where failures go besides the counter — the error log. Wired from
 * outside because the log itself writes through this file: a failure
 * logged while logging is suppressed, so a full disk cannot recurse.
 */
export function onPersistenceError(
  handler: (what: string, error: unknown) => void,
): void {
  report = handler;
}

function failed(what: string, error: unknown): void {
  health.failures += 1;
  health.lastError = error instanceof Error ? error.message : String(error);
  health.lastAt = Date.now();
  console.warn(`[persistence] ${what} failed`, error);
  if (report && !reporting && health.failures === 1) {
    // Once per session is enough to know, and a disk that refuses one
    // write refuses the log's write too.
    reporting = true;
    try {
      report(what, error);
    } finally {
      reporting = false;
    }
  }
  for (const l of listeners) {
    try {
      l();
    } catch {
      // A listener's problem is not the disk's.
    }
  }
}

// ─── In-flight writes ───────────────────────────────────────────────────

const inFlight = new Set<Promise<unknown>>();

function track(what: string, op: Promise<unknown>): void {
  const p = op.catch(e => failed(what, e));
  inFlight.add(p);
  p.finally(() => inFlight.delete(p));
}

/** Resolves once every write issued so far has landed or failed. */
export async function flushPersistence(): Promise<void> {
  while (inFlight.size > 0) {
    await Promise.all([...inFlight]);
  }
}

// ─── Boot ───────────────────────────────────────────────────────────────

/**
 * Hydrate at most once per JS runtime. Entry points that can run without
 * App mounting (notification buttons pressed in the background) and
 * App itself both call this, so whichever runs first does the work.
 */
export function ensureHydrated(): Promise<void> {
  if (!hydration) {
    hydration = hydratePersistence();
  }
  return hydration;
}

const READ_ATTEMPTS = 3;

/** Seed memoryStore from disk. Safe to call exactly once at boot. */
export async function hydratePersistence(): Promise<void> {
  for (let attempt = 1; attempt <= READ_ATTEMPTS; attempt++) {
    try {
      await readAll();
      health.readFailed = false;
      return;
    } catch (e) {
      console.warn(`[persistence] hydrate attempt ${attempt} failed`, e);
      if (attempt === READ_ATTEMPTS) {
        // Better an app that saves nothing today than one that saves an
        // empty profile over a year of training.
        health.readFailed = true;
        failed('reading saved data', e);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 150 * attempt));
    }
  }
}

async function readAll(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const ours = allKeys.filter(k => k.startsWith(PREFIX));
  if (ours.length === 0) {
    return;
  }
  const pairs = await AsyncStorage.multiGet(ours);
  for (const [diskKey, raw] of pairs) {
    if (raw == null) {
      continue;
    }
    const realKey = diskKey.slice(PREFIX.length);
    // Values are stored as JSON-encoded primitives, so we can recover
    // string|number|boolean cleanly. Anything that fails to parse is
    // restored as a raw string (caller likely JSON.stringified it).
    try {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed === 'string' ||
        typeof parsed === 'number' ||
        typeof parsed === 'boolean'
      ) {
        memoryStore.set(realKey, parsed);
      } else {
        memoryStore.set(realKey, raw);
      }
    } catch {
      memoryStore.set(realKey, raw);
    }
  }
}

// ─── Writes ─────────────────────────────────────────────────────────────

export function persistKey(key: string, value: Value): void {
  if (health.readFailed) {
    return;
  }
  track('saving', AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)));
}

export function persistDelete(key: string): void {
  if (health.readFailed) {
    return;
  }
  track('deleting', AsyncStorage.removeItem(PREFIX + key));
}

/**
 * Remove everything. `known` is what memory held just before it was
 * cleared, and it is removed *now*: AsyncStorage runs one operation at a
 * time in the order they are issued, so a write made after this call
 * lands after it. (This used to fetch the key list first and remove it
 * later, by which time the writes that followed the clear were already
 * ahead of it in the queue — and were deleted with the old data.)
 *
 * A sweep then removes anything on disk this session never held, but
 * only what memory does not hold by the time it runs.
 */
export function persistClear(known: readonly string[]): void {
  if (health.readFailed) {
    return;
  }
  if (known.length > 0) {
    track('clearing', AsyncStorage.multiRemove(known.map(k => PREFIX + k)));
  }
  track(
    'clearing',
    AsyncStorage.getAllKeys().then(keys => {
      const stale = keys.filter(
        k => k.startsWith(PREFIX) && !memoryStore.has(k.slice(PREFIX.length)),
      );
      return stale.length > 0 ? AsyncStorage.multiRemove(stale) : undefined;
    }),
  );
}

const CHUNK = 400;

/**
 * Replace everything on disk with `entries`, and prove it.
 *
 * For a restore: every earlier write is flushed first, the old keys are
 * removed and the new ones written in awaited batches, then everything is
 * read back and compared. Nothing in memory is touched here — the caller
 * swaps memory only once this says the disk is right, and until then the
 * old data is still in memory to roll back to.
 */
export async function persistReplaceAll(
  entries: readonly (readonly [string, Value])[],
): Promise<{ok: true; written: number} | {ok: false; why: string}> {
  if (health.readFailed) {
    return {ok: false, why: 'saved data could not be read at start-up'};
  }
  try {
    await flushPersistence();
    const existing = (await AsyncStorage.getAllKeys()).filter(k =>
      k.startsWith(PREFIX),
    );
    for (let i = 0; i < existing.length; i += CHUNK) {
      await AsyncStorage.multiRemove(existing.slice(i, i + CHUNK));
    }
    const pairs: [string, string][] = entries.map(([k, v]) => [
      PREFIX + k,
      JSON.stringify(v),
    ]);
    for (let i = 0; i < pairs.length; i += CHUNK) {
      await AsyncStorage.multiSet(pairs.slice(i, i + CHUNK));
    }
    // Read back, all of it: a count can agree while a value does not.
    const wanted = new Map(pairs);
    let matched = 0;
    for (let i = 0; i < pairs.length; i += CHUNK) {
      const back = await AsyncStorage.multiGet(
        pairs.slice(i, i + CHUNK).map(([k]) => k),
      );
      for (const [k, v] of back) {
        if (v !== null && wanted.get(k) === v) {
          matched += 1;
        }
      }
    }
    if (matched !== pairs.length) {
      return {
        ok: false,
        why: `${pairs.length - matched} of ${
          pairs.length
        } values did not read back`,
      };
    }
    return {ok: true, written: pairs.length};
  } catch (e) {
    failed('restoring', e);
    return {ok: false, why: e instanceof Error ? e.message : String(e)};
  }
}

/** Test seam: forget this session's health. */
export function __resetPersistenceHealth(): void {
  health.failures = 0;
  health.lastError = undefined;
  health.lastAt = undefined;
  health.readFailed = false;
  hydration = null;
}
