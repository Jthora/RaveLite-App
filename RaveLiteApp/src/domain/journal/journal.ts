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
  const r = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `${at.toString(36)}-${r}`;
}

type JournalListener = (entry: JournalEntry) => void;
const listeners = new Set<JournalListener>();

/** Fires after every append. Returns an unsubscribe function. */
export function subscribeJournal(listener: JournalListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Append a fact. The only write API to the journal. */
export function append(entry: NewJournalEntry): JournalEntry {
  const at = entry.at ?? Date.now();
  const id = newEntryId(at);
  const full = {...entry, id, at} as JournalEntry;
  const key = KEYS.journalEntry(dayKey(new Date(at)), id);
  store.set(key, JSON.stringify(full));
  for (const l of listeners) {
    try {
      l(full);
    } catch (e) {
      console.warn('[journal] listener threw', e);
    }
  }
  return full;
}

/**
 * Take back a logged entry (Undo, or Remove from a day list). The log stays
 * append-only: a void record joins the entry's own day, and readers skip
 * the entry from then on.
 */
export function voidEntry(
  entry: Pick<JournalEntry, 'id' | 'at'>,
): JournalEntry {
  return append({
    kind: 'entry.voided',
    entryId: entry.id,
    voidedAt: Date.now(),
    at: entry.at,
  });
}

/** Bring back a voided entry as a fresh copy at its original time. */
export function restoreEntry(entry: JournalEntry): JournalEntry {
  const copy: Partial<JournalEntry> = {...entry};
  delete copy.id;
  return append(copy as NewJournalEntry);
}

/** Entries minus any taken back; the void records themselves stay. */
function withoutVoided(entries: JournalEntry[]): JournalEntry[] {
  const voided = new Set<string>();
  for (const e of entries) {
    if (e.kind === 'entry.voided') {
      voided.add(e.entryId);
    }
  }
  return voided.size === 0 ? entries : entries.filter(e => !voided.has(e.id));
}

/** Read all entries for a single day, oldest first, minus any taken back. */
export function entriesForDay(d: Date = new Date()): JournalEntry[] {
  const prefix = KEYS.journalDay(dayKey(d));
  const keys = store.keysWithPrefix(prefix).sort();
  const out: JournalEntry[] = [];
  for (const k of keys) {
    const raw = store.getString(k);
    if (!raw) {
      continue;
    }
    try {
      out.push(JSON.parse(raw) as JournalEntry);
    } catch {
      // Skip corrupt entries — append-only log tolerates partial loss.
    }
  }
  return withoutVoided(out);
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

/**
 * Pulse ids with a `reminder.fired` entry, optionally limited to one plan
 * window / producer. Schedulers use this so a restart never re-chimes a
 * pulse that already went off.
 */
export function firedPulseIds(
  entries: readonly JournalEntry[],
  windowId?: string,
): Set<string> {
  const out = new Set<string>();
  for (const e of entries) {
    if (
      e.kind === 'reminder.fired' &&
      (windowId === undefined || e.windowId === windowId)
    ) {
      out.add(e.pulseId);
    }
  }
  return out;
}

/**
 * Pulse ids already dealt with: fired, or skipped ahead of time from
 * Today. Schedulers use this so a restart never re-queues either. Skips
 * carry no window id; pulse ids are unique across producers, so every
 * skip is included whatever `windowId` is.
 */
export function handledPulseIds(
  entries: readonly JournalEntry[],
  windowId?: string,
): Set<string> {
  const out = firedPulseIds(entries, windowId);
  for (const e of entries) {
    if (e.kind === 'reminder.skipped') {
      out.add(e.pulseId);
    }
  }
  return out;
}
