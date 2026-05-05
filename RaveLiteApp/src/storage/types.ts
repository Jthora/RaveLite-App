/**
 * Synchronous key-value store interface.
 *
 * Why synchronous: the music attunement subsystem and reminder-fire path
 * need to read settings/streaks/last-fired timestamps on hot paths (audio
 * callbacks, beat events) without awaiting Promises. MMKV provides this.
 *
 * The interface is intentionally tiny so swapping implementations
 * (memory ⇄ MMKV ⇄ encrypted MMKV) is a one-line change in `storage/index`.
 */

export interface KeyValueStore {
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  set(key: string, value: string | number | boolean): void;
  delete(key: string): void;
  /** All keys with the given prefix. Used for journal scans. */
  keysWithPrefix(prefix: string): string[];
  clearAll(): void;
}
