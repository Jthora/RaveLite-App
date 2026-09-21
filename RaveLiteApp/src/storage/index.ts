import {KeyValueStore} from './types';
import {memoryStore} from './memoryStore';
import {persistKey, persistDelete, persistClear} from './persistence';

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
    persistKey(k, v);
  },
  delete: k => {
    memoryStore.delete(k);
    persistDelete(k);
  },
  keysWithPrefix: p => memoryStore.keysWithPrefix(p),
  clearAll: () => {
    memoryStore.clearAll();
    persistClear();
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

export const store: KeyValueStore = {
  getString: k => active.getString(k),
  getNumber: k => active.getNumber(k),
  getBoolean: k => active.getBoolean(k),
  set: (k, v) => active.set(k, v),
  delete: k => active.delete(k),
  keysWithPrefix: p => active.keysWithPrefix(p),
  clearAll: () => active.clearAll(),
};

/** Point every read and write somewhere else. Only `domain/demo` does this. */
export function __swapStore(next: KeyValueStore | undefined): void {
  active = next ?? persistentStore;
}

export const __realStore = persistentStore;
