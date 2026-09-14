import {firedPulseIds} from '../journal/journal';
import type {JournalEntry} from '../journal/types';
import {SETS_WINDOW_ID, type SetUnit, type TrackId} from './types';

/** "10 reps" / "30 sec" — shared by chimes, the ribbon and the Sets panel. */
export function formatSetAmount(amount: number, unit: SetUnit): string {
  return unit === 'seconds' ? `${amount} sec` : `${amount} reps`;
}

/**
 * Daily Sets progress — pure reads over a day's journal entries.
 * Completions carrying `trackId` + `amount` count toward that track's
 * quota no matter where they were logged (chime, notification button,
 * or a manual "+ set" tap).
 */

export interface TrackDone {
  /** Reps or seconds done today, in the track's unit. */
  amount: number;
  sets: number;
}

export function doneByTrack(
  entries: readonly JournalEntry[],
): Partial<Record<TrackId, TrackDone>> {
  const out: Partial<Record<TrackId, TrackDone>> = {};
  for (const e of entries) {
    if (e.kind !== 'completion') {
      continue;
    }
    // A round records every move; older single-set entries carry one.
    const moves =
      e.moves ??
      (e.trackId && typeof e.amount === 'number'
        ? [{trackId: e.trackId, amount: e.amount}]
        : []);
    for (const m of moves) {
      const id = m.trackId as TrackId;
      const cur = out[id] ?? {amount: 0, sets: 0};
      out[id] = {amount: cur.amount + m.amount, sets: cur.sets + 1};
    }
  }
  return out;
}

/** Pulse ids of set chimes that have already fired in these entries. */
export function firedSetIds(entries: readonly JournalEntry[]): Set<string> {
  return firedPulseIds(entries, SETS_WINDOW_ID);
}
