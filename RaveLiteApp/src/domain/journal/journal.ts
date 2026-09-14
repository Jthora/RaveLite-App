import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {DistributiveOmit, JournalEntry} from './types';

/** An entry as callers write it — the journal fills in `id` (and `at` if omitted). */
export type NewJournalEntry = DistributiveOmit<JournalEntry, 'id' | 'at'> & {
  at?: number;
};

/** "YYYY-MM-DD" in local time. Used as the day-bucket key. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monotonic-ish id: epoch + small random, sortable lexicographically. */
function newEntryId(at: number): string {
  const r = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${at.toString(36)}-${r}`;
}

/** Append a fact. The only write API to the journal. */
export function append(entry: NewJournalEntry): JournalEntry {
  const at = entry.at ?? Date.now();
  const id = newEntryId(at);
  const full = {...entry, id, at} as JournalEntry;
  const key = KEYS.journalEntry(dayKey(new Date(at)), id);
  store.set(key, JSON.stringify(full));
  return full;
}

/** Read all entries for a single day, oldest first. */
export function entriesForDay(d: Date = new Date()): JournalEntry[] {
  const prefix = KEYS.journalDay(dayKey(d));
  const keys = store.keysWithPrefix(prefix).sort();
  const out: JournalEntry[] = [];
  for (const k of keys) {
    const raw = store.getString(k);
    if (!raw) {continue;}
    try {
      out.push(JSON.parse(raw) as JournalEntry);
    } catch {
      // Skip corrupt entries — append-only log tolerates partial loss.
    }
  }
  return out;
}

/** Read all entries within an inclusive day range, oldest first. */
export function entriesInRange(fromDay: Date, toDay: Date): JournalEntry[] {
  const out: JournalEntry[] = [];
  const cursor = new Date(fromDay);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(toDay);
  end.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= end.getTime()) {
    out.push(...entriesForDay(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
