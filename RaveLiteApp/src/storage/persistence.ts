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
 *      to AsyncStorage in fire-and-forget fashion.
 *
 * MMKV swap (later): replace memoryStore + this file with a single
 * synchronous-and-persistent MMKV-backed store.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {memoryStore} from './memoryStore';

const PREFIX = 'ravelite.v1.';

let hydration: Promise<void> | null = null;

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

/** Seed memoryStore from disk. Safe to call exactly once at boot. */
export async function hydratePersistence(): Promise<void> {
  try {
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
  } catch (e) {
    console.warn('[persistence] hydrate failed', e);
  }
}

export function persistKey(
  key: string,
  value: string | number | boolean,
): void {
  AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
}

export function persistDelete(key: string): void {
  AsyncStorage.removeItem(PREFIX + key).catch(() => {});
}

export function persistClear(): void {
  AsyncStorage.getAllKeys()
    .then(keys => {
      const ours = keys.filter(k => k.startsWith(PREFIX));
      if (ours.length) {
        return AsyncStorage.multiRemove(ours);
      }
    })
    .catch(() => {});
}
