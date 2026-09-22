import {KeyValueStore} from './types';
import {memoryStore} from './memoryStore';
import {
  persistClear,
  persistDelete,
  persistKey,
  persistReplaceAll,
} from './persistence';

/** While a restore is writing, other writes stay in memory only. */
let frozen = false;

/**
 * Active KeyValueStore for the app. Single import point.
 *
 * Backing strategy (interim):
 *   - Reads are synchronous and served from `memoryStore`.
 *   - `memoryStore` is seeded at boot from AsyncStorage by
 *     `hydratePersistence()` (called from `App.tsx`).
 *   - Writes update `memoryStore` immediately AND fire-and-forget
 *     write through to AsyncStorage. This preserves the synchronous
 *     read API the audio/beat hot paths require while making state
 *     survive app kills.
 *
 * ── MMKV swap path ────────────────────────────────────────────────────────
 *   1. yarn add react-native-mmkv
 *   2. (iOS) cd ios && pod install
 *   3. Replace `store` below with an MMKV-backed KeyValueStore. Drop the
 *      AsyncStorage write-through entirely (MMKV is synchronous AND
 *      persistent). `hydratePersistence()` becomes a no-op.
 */
const persistentStore: KeyValueStore = {
  getString: k => memoryStore.getString(k),
  getNumber: k => memoryStore.getNumber(k),
  getBoolean: k => memoryStore.getBoolean(k),
  set: (k, v) => {
    memoryStore.set(k, v);
    if (!frozen) {
      persistKey(k, v);
    }
  },
  delete: k => {
    memoryStore.delete(k);
    if (!frozen) {
      persistDelete(k);
    }
  },
  keysWithPrefix: p => memoryStore.keysWithPrefix(p),
  clearAll: () => {
    // The keys are taken before memory forgets them, so the disk removes
    // exactly these, in order, ahead of anything written next.
    const known = memoryStore.keysWithPrefix('');
    memoryStore.clearAll();
    if (!frozen) {
      persistClear(known);
    }
  },
};

/**
 * Demo mode swaps this out for a throwaway store (see `domain/demo/`).
 *
 * The real data is not exported and put back — it is simply never
 * written to, because the overlay is a different map and persistence is
 * bypassed entirely. A crash, a kill, a flat battery mid-demo all end the
 * same way: the app restarts on the real data, untouched.
 */
let active: KeyValueStore = persistentStore;

/**
 * Caches built from what is stored. A module that keeps one registers
 * here, and it is dropped whenever the store underneath changes wholesale:
 * swapped for demo mode and back, cleared, or restored. Otherwise a cache from the
 * real data answers for the demo, or the other way round, until the day
 * changes.
 */
const resetListeners = new Set<() => void>();

export function onStoreReset(listener: () => void): () => void {
  resetListeners.add(listener);
  return () => {
    resetListeners.delete(listener);
  };
}

function announceReset(): void {
  resetListeners.forEach(listener => listener());
}

export const store: KeyValueStore = {
  getString: k => active.getString(k),
  getNumber: k => active.getNumber(k),
  getBoolean: k => active.getBoolean(k),
  set: (k, v) => active.set(k, v),
  delete: k => active.delete(k),
  keysWithPrefix: p => active.keysWithPrefix(p),
  clearAll: () => {
    active.clearAll();
    announceReset();
  },
};

/** Point every read and write somewhere else. Only `domain/demo` does this. */
export function __swapStore(next: KeyValueStore | undefined): void {
  active = next ?? persistentStore;
  announceReset();
}

export const __realStore = persistentStore;

export type ReplaceResult =
  | {ok: true; written: number}
  | {ok: false; why: string; rolledBack: boolean};

/**
 * Replace everything stored with `entries` — a restore — so that it is
 * true on disk, not just in memory.
 *
 * Memory keeps the old data until the disk has been written and read
 * back. If that fails, the old data is written back from memory, so a
 * restore that did not finish leaves things as they were rather than
 * half of each. Writes made meanwhile (a chime firing) stay in memory and
 * are either replaced by the restore or saved by the rollback.
 */
export async function replaceStoredData(
  entries: readonly (readonly [string, string | number | boolean])[],
): Promise<ReplaceResult> {
  if (active !== persistentStore) {
    return {
      ok: false,
      why: 'demo mode is on, and nothing in it is saved',
      rolledBack: false,
    };
  }
  frozen = true;
  try {
    const result = await persistReplaceAll(entries);
    if (result.ok) {
      memoryStore.clearAll();
      for (const [k, v] of entries) {
        memoryStore.set(k, v);
      }
      announceReset();
      return result;
    }
    const back = await persistReplaceAll(memoryStore.entries());
    return {ok: false, why: result.why, rolledBack: back.ok};
  } finally {
    frozen = false;
  }
}
