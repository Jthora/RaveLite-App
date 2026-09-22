import {entriesForDay, handledPulseIds} from '../journal/journal';
import {localDayKey} from '../training/grading';
import {loadEntries} from '../training/repository';
import type {TrainingLogEntry} from '../training/types';
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

/**
 * Train log kinds that are a track's own movement, in its unit. Push-ups
 * logged with + Log used to count everywhere but the Push meter: one
 * question — how many push-ups today? — had two answers.
 */
const TRAIN_TRACK: Readonly<Record<string, TrackId>> = {
  'builtin.pushups-amrap': 'push',
  'builtin.pushups-2min': 'push',
  'builtin.pushups-1min': 'push',
  'builtin.situps-2min': 'crunch',
  'builtin.situps-1min': 'crunch',
  'builtin.crunches-2min': 'crunch',
  'builtin.pullups-amrap': 'pull',
  'builtin.squats-amrap': 'squat',
  'builtin.leg-hipup': 'legs-up',
  'builtin.side-ups-amrap': 'side',
  'builtin.plank': 'plank',
  'builtin.deadhang': 'hang',
};

/** The Train log's share of each track, for entries already on one day. */
export function trainDoneByTrack(
  entries: readonly TrainingLogEntry[],
): Partial<Record<TrackId, TrackDone>> {
  const out: Partial<Record<TrackId, TrackDone>> = {};
  for (const e of entries) {
    const id = TRAIN_TRACK[e.kindId];
    if (!id || !(e.value > 0)) {
      continue;
    }
    const cur = out[id] ?? {amount: 0, sets: 0};
    out[id] = {amount: cur.amount + e.value, sets: cur.sets + 1};
  }
  return out;
}

/** Everything done toward each track on `date`: chimes, taps and Train log. */
export function doneOnDay(date: Date): Partial<Record<TrackId, TrackDone>> {
  const out = doneByTrack(entriesForDay(date));
  const day = localDayKey(date.getTime());
  const train = trainDoneByTrack(
    loadEntries().filter(e => localDayKey(e.at) === day),
  );
  for (const id of Object.keys(train) as TrackId[]) {
    const cur = out[id] ?? {amount: 0, sets: 0};
    out[id] = {
      amount: cur.amount + train[id]!.amount,
      sets: cur.sets + train[id]!.sets,
    };
  }
  return out;
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

/** Set chime ids that already fired, or were skipped ahead of time. */
export function firedSetIds(entries: readonly JournalEntry[]): Set<string> {
  return handledPulseIds(entries, SETS_WINDOW_ID);
}
