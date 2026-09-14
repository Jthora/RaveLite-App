import type {ElementId} from '../../theme/elements';
import {EXERCISE_LIBRARY} from '../exercises/library';
import type {Exercise} from '../exercises/types';
import {
  dayKey,
  entriesForDay,
  entriesInRange,
  subscribeJournal,
} from '../journal/journal';
import type {
  CompletionEntry,
  JournalEntry,
  ProgramTestEntry,
} from '../journal/types';
import {formatSetAmount} from '../program/progress';
import {TRACKS} from '../program/tracks';
import {formatEntryValue, localDayKey} from '../training/grading';
import {
  getMetric,
  loadEntries,
  subscribeTrainingLog,
} from '../training/repository';
import type {MetricKind, TrainingLogEntry} from '../training/types';
import {WATER_GLASS_EXERCISE_ID} from './record';

/**
 * Activity — one read model over everything the operator did.
 *
 * A "done" lives in one of three places: journal completions (chimes,
 * notification buttons, drill taps, circuit legs, Daily Sets), the Train
 * log (runs, holds, rep tests typed in by hand), and journal max tests.
 * Every count on screen — balance, streak, history, water — reads this
 * list, so they all agree. Train entries stay editable; nothing is
 * mirrored into the append-only journal.
 *
 * A Daily Sets round expands into one item per move, plus its partner
 * drill and ride-along glass of water, each credited to its own element.
 */

export type ActivitySource =
  | 'chime'
  | 'notification'
  | 'manual'
  | 'circuit'
  | 'train'
  | 'test';

export interface ActivityItem {
  /** Unique within a list. */
  id: string;
  at: number;
  element: ElementId;
  source: ActivitySource;
  label: string;
  /** Amount, time or dose, ready to display. */
  detail?: string;
  exerciseId?: string;
  trackId?: string;
  /** Reps or seconds, in the track's unit. */
  amount?: number;
  pulseId?: string;
  /** Counts as a glass of water. */
  hydration?: boolean;
  /** Where the underlying record lives. */
  ref: {store: 'journal' | 'train'; id: string};
}

export interface ActivityInput {
  journal: readonly JournalEntry[];
  train: readonly TrainingLogEntry[];
  metricFor?: (kindId: string) => MetricKind | undefined;
  exerciseFor?: (id: string) => Exercise | undefined;
}

const EXERCISES = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));
const exerciseById = (id: string) => EXERCISES.get(id);

function sourceOf(source: CompletionEntry['source']): ActivitySource {
  switch (source) {
    case 'always-on':
      return 'chime';
    case 'notification':
      return 'notification';
    case 'auto':
      return 'circuit';
    default:
      return 'manual';
  }
}

const isHydration = (ex?: Exercise) =>
  ex?.targets.includes('Hydration') ?? false;

/** Element a Train entry counts toward. `'any'` kinds fall back by category. */
export function trainElement(
  entry: TrainingLogEntry,
  kind: MetricKind | undefined,
): ElementId | undefined {
  if (entry.element) {
    return entry.element;
  }
  if (!kind) {
    return undefined;
  }
  if (kind.element !== 'any') {
    return kind.element;
  }
  switch (kind.category) {
    case 'run':
    case 'reps':
      return 'fire';
    case 'hold':
      return 'earth';
    default:
      return 'heart';
  }
}

function completionItems(
  e: CompletionEntry,
  exerciseFor: (id: string) => Exercise | undefined,
): ActivityItem[] {
  const base = {
    at: e.at,
    source: sourceOf(e.source),
    pulseId: e.pulseId,
    ref: {store: 'journal' as const, id: e.id},
  };
  const items: ActivityItem[] = [];
  const moves =
    e.moves ??
    (e.trackId && typeof e.amount === 'number'
      ? [{trackId: e.trackId, amount: e.amount}]
      : []);

  if (moves.length > 0) {
    // A single set keeps its drill's own name; a round names its tracks.
    const single = moves.length === 1 ? exerciseFor(e.exerciseId) : undefined;
    for (const m of moves) {
      const track = TRACKS.find(t => t.id === m.trackId);
      items.push({
        ...base,
        id: moves.length === 1 ? e.id : `${e.id}:${m.trackId}`,
        element: track?.element ?? e.element,
        label: single?.name ?? track?.name ?? 'Set',
        detail: track
          ? formatSetAmount(m.amount, track.unit)
          : String(m.amount),
        exerciseId: single?.id,
        trackId: m.trackId,
        amount: m.amount,
      });
    }
  } else {
    const ex = exerciseFor(e.exerciseId);
    items.push({
      ...base,
      id: e.id,
      element: e.element,
      label: ex?.name ?? (e.exerciseId === 'retro' ? 'Logged later' : 'Drill'),
      detail: ex?.dose,
      exerciseId: e.exerciseId,
      hydration: isHydration(ex) || undefined,
    });
  }

  const partner = e.partnerExerciseId
    ? exerciseFor(e.partnerExerciseId)
    : undefined;
  if (partner) {
    items.push({
      ...base,
      id: `${e.id}:partner`,
      element: partner.element,
      label: partner.name,
      detail: e.partnerSec ? `${e.partnerSec} sec` : partner.dose,
      exerciseId: partner.id,
      hydration: isHydration(partner) || undefined,
    });
  }
  if (e.water) {
    items.push({
      ...base,
      id: `${e.id}:water`,
      element: 'water',
      label: 'Glass of water',
      exerciseId: WATER_GLASS_EXERCISE_ID,
      hydration: true,
    });
  }
  return items;
}

function testItem(e: ProgramTestEntry): ActivityItem {
  const track = TRACKS.find(t => t.id === e.trackId);
  return {
    id: e.id,
    at: e.at,
    element: e.element,
    source: 'test',
    label: `${track?.name ?? 'Max'} test`,
    detail: `max ${track ? formatSetAmount(e.max, track.unit) : e.max}`,
    trackId: e.trackId,
    amount: e.max,
    ref: {store: 'journal', id: e.id},
  };
}

function trainItem(
  entry: TrainingLogEntry,
  metricFor: (kindId: string) => MetricKind | undefined,
): ActivityItem | undefined {
  const kind = metricFor(entry.kindId);
  const element = trainElement(entry, kind);
  if (!element) {
    return undefined;
  }
  return {
    id: `train:${entry.id}`,
    at: entry.at,
    element,
    source: 'train',
    label: kind?.label ?? 'Training',
    detail: kind ? formatEntryValue(entry, kind) : undefined,
    ref: {store: 'train', id: entry.id},
  };
}

/** Pure: merge journal and Train records into one list, oldest first. */
export function buildActivity(input: ActivityInput): ActivityItem[] {
  const {
    journal,
    train,
    metricFor = getMetric,
    exerciseFor = exerciseById,
  } = input;
  const items: ActivityItem[] = [];
  for (const e of journal) {
    if (e.kind === 'completion') {
      items.push(...completionItems(e, exerciseFor));
    } else if (e.kind === 'program.test') {
      items.push(testItem(e));
    }
  }
  for (const entry of train) {
    const item = trainItem(entry, metricFor);
    if (item) {
      items.push(item);
    }
  }
  return items.sort((a, b) => a.at - b.at);
}

/** Everything done on one local day. */
export function activityForDay(date: Date = new Date()): ActivityItem[] {
  const key = dayKey(date);
  return buildActivity({
    journal: entriesForDay(date),
    train: loadEntries().filter(e => localDayKey(e.at) === key),
  });
}

/** Everything done across an inclusive range of local days. */
export function activityInRange(fromDay: Date, toDay: Date): ActivityItem[] {
  const from = new Date(fromDay);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDay);
  to.setHours(23, 59, 59, 999);
  return buildActivity({
    journal: entriesInRange(fromDay, toDay),
    train: loadEntries().filter(
      e => e.at >= from.getTime() && e.at <= to.getTime(),
    ),
  });
}

/** Fires whenever the journal or the Train log changes. */
export function subscribeActivity(listener: () => void): () => void {
  const offJournal = subscribeJournal(() => listener());
  const offTrain = subscribeTrainingLog(listener);
  return () => {
    offJournal();
    offTrain();
  };
}
