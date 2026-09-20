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

export const store: KeyValueStore = persistentStore;
