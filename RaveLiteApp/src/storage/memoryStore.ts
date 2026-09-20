import {KeyValueStore} from './types';

/**
 * In-memory store. Used until react-native-mmkv is installed.
 *
 * Drop-in replacement for the MMKV implementation — same surface. On the
 * native swap, all data resets once (acceptable: nothing real is stored
 * yet). After the swap, MMKV persists across launches.
 */
class MemoryStore implements KeyValueStore {
  private map = new Map<string, string | number | boolean>();

  getString(key: string): string | undefined {
    const v = this.map.get(key);
    return typeof v === 'string' ? v : undefined;
  }
  getNumber(key: string): number | undefined {
    const v = this.map.get(key);
    return typeof v === 'number' ? v : undefined;
  }
  getBoolean(key: string): boolean | undefined {
    const v = this.map.get(key);
    return typeof v === 'boolean' ? v : undefined;
  }
  set(key: string, value: string | number | boolean): void {
    this.map.set(key, value);
  }
  delete(key: string): void {
    this.map.delete(key);
  }
  keysWithPrefix(prefix: string): string[] {
    const out: string[] = [];
    for (const k of this.map.keys()) {
      if (k.startsWith(prefix)) {
        out.push(k);
      }
    }
    return out;
  }
  clearAll(): void {
    this.map.clear();
  }
}

export const memoryStore = new MemoryStore();
