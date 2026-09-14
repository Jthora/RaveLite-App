/**
 * Corrections: taking back a logged completion, and bringing it back.
 *
 * Every completion logged while the app is open can be undone for a few
 * seconds (the undo bar), and a logged row can be removed from a day list.
 * Both void the entry rather than delete it, so the log stays append-only;
 * a round's sets return to Daily Sets and later rounds regrow.
 *
 * Max tests aren't offered: taking one back wouldn't undo the new set size.
 */
import {reconcileSetsNow} from '../ambient/setScheduler';
import {restoreEntry, subscribeJournal, voidEntry} from '../journal/journal';
import type {CompletionEntry} from '../journal/types';
import {buildActivity} from './activity';
import {WATER_GLASS_EXERCISE_ID} from './record';

export interface UndoNotice {
  /** Just logged (Undo takes it back) or just removed (Undo puts it back). */
  kind: 'logged' | 'removed';
  entry: CompletionEntry;
  label: string;
}

type Listener = (notice: UndoNotice) => void;

const listeners = new Set<Listener>();
let journalOff: (() => void) | undefined;
/** Set while a removal is put back, so the copy isn't announced as new. */
let restoring = false;

const touchesSets = (entry: CompletionEntry) =>
  (entry.moves?.length ?? 0) > 0 || entry.trackId !== undefined;

/** What a completion was, in a few words: "Push-ups + Squats". */
export function describeCompletion(entry: CompletionEntry): string {
  if (entry.exerciseId === WATER_GLASS_EXERCISE_ID && !entry.pulseId) {
    return 'glass of water';
  }
  const items = buildActivity({journal: [entry], train: []});
  const moves = items.filter(item => item.trackId);
  if (moves.length > 1) {
    return moves.map(item => item.label).join(' + ');
  }
  return items[0]?.label ?? 'entry';
}

function emit(notice: UndoNotice): void {
  for (const listener of listeners) {
    listener(notice);
  }
}

/** Notices for the undo bar: each completion logged, and each removal. */
export function subscribeUndo(listener: Listener): () => void {
  listeners.add(listener);
  if (!journalOff) {
    journalOff = subscribeJournal(entry => {
      if (entry.kind === 'completion' && !restoring) {
        emit({kind: 'logged', entry, label: describeCompletion(entry)});
      }
    });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && journalOff) {
      journalOff();
      journalOff = undefined;
    }
  };
}

/** Take a completion back. With `announce`, the undo bar offers to put it back. */
export function takeBack(
  entry: CompletionEntry,
  opts: {announce?: boolean} = {},
): void {
  voidEntry(entry);
  if (touchesSets(entry)) {
    reconcileSetsNow();
  }
  if (opts.announce) {
    emit({kind: 'removed', entry, label: describeCompletion(entry)});
  }
}

/** Put back a completion that was removed, as it was. */
export function bringBack(entry: CompletionEntry): CompletionEntry {
  restoring = true;
  try {
    return restoreEntry(entry) as CompletionEntry;
  } finally {
    restoring = false;
    if (touchesSets(entry)) {
      reconcileSetsNow();
    }
  }
}
