import {KeyValueStore} from './types';

/**
 * In-memory store. Used until react-native-mmkv is installed.
 *
 * Drop-in replacement for the MMKV implementation — same surface. On the
 * native swap, all data resets once (acceptable: nothing real is stored
 * yet). After the swap, MMKV persists across launches.
 *
 * ── Why the sorted-key cache exists ──────────────────────────────────
 *
 * `keysWithPrefix` used to walk every key in the map. That is fine with
 * a hundred keys and ruinous with four thousand, because of how the
 * journal is read: one entry is one key, `journal.<day>.<id>`, and a
 * thirty-day range asks for thirty prefixes — thirty full scans, about a
 * hundred thousand string comparisons, for a query that touches maybe
 * two hundred entries.
 *
 * On a desk that was 20 ms. On the phone this app is built for, it was
 * the reason a tap felt slow: the work happened on the JS thread during
 * render, and touches queue behind it.
 *
 * So the keys are kept sorted, and a prefix becomes a binary search for
 * the first match plus a walk while the prefix still matches — O(log n +
 * matches) rather than O(n). The sort is rebuilt lazily, only after a
 * write and only when somebody next asks, because writes come in bursts
 * (hydration, a restore) and it would be wasteful to re-sort each one.
 */
class MemoryStore implements KeyValueStore {
  private map = new Map<string, string | number | boolean>();
  /** Every key, sorted. Undefined when a write has invalidated it. */
  private sorted: string[] | undefined;

  getString(key: string): string | undefined {
    const v = this.map.get(key);
    return typeof v === 'string' ? v : undefined;
  }
  // Forgiving of how a value arrived. The first export format wrote every
  // number and switch as text, and a restore of one put "75" back where 75
  // had been — every volume and every ticked box then read as unset. A
  // number stored as its own canonical text reads as that number; "true"
  // and "false" read as switches. Nothing that is really text looks like
  // either: day keys have dashes, blobs have braces.
  getNumber(key: string): number | undefined {
    const v = this.map.get(key);
    if (typeof v === 'number') {
      return v;
    }
    if (typeof v === 'string' && v !== '' && String(Number(v)) === v) {
      return Number(v);
    }
    return undefined;
  }
  getBoolean(key: string): boolean | undefined {
    const v = this.map.get(key);
    if (typeof v === 'boolean') {
      return v;
    }
    return v === 'true' ? true : v === 'false' ? false : undefined;
  }
  has(key: string): boolean {
    return this.map.has(key);
  }
  /** Everything held, as held — for a restore's rollback and the byte count. */
  entries(): [string, string | number | boolean][] {
    return [...this.map.entries()];
  }
  set(key: string, value: string | number | boolean): void {
    // Only a *new* key changes the ordering; overwriting a value does
    // not, and overwriting is the common case.
    if (!this.map.has(key)) {
      this.sorted = undefined;
    }
    this.map.set(key, value);
  }
  delete(key: string): void {
    if (this.map.delete(key)) {
      this.sorted = undefined;
    }
  }

  /** The first index whose key is >= `target`. */
  private lowerBound(keys: readonly string[], target: string): number {
    let lo = 0;
    let hi = keys.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (keys[mid] < target) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  keysWithPrefix(prefix: string): string[] {
    if (this.sorted === undefined) {
      this.sorted = [...this.map.keys()].sort();
    }
    const keys = this.sorted;
    if (prefix === '') {
      return [...keys];
    }
    const out: string[] = [];
    for (let i = this.lowerBound(keys, prefix); i < keys.length; i++) {
      if (!keys[i].startsWith(prefix)) {
        break;
      }
      out.push(keys[i]);
    }
    return out;
  }
  clearAll(): void {
    this.map.clear();
    this.sorted = undefined;
  }
}

export const memoryStore = new MemoryStore();
