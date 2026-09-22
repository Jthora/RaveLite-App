import {ELEMENT_ORDER, type ElementId} from '../../theme/elements';
import {EXERCISE_LIBRARY} from '../exercises/library';
import {
  moveForExercise,
  moveForMetric,
  moveForTrack,
  type MoveId,
} from '../exercises/moves';
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
import {logError} from '../diagnostics/errorLog';
import {POINTS} from './par';
import {formatCount} from './practice';
import {
  EYE_BREAK_EXERCISE_ID,
  EYE_BREAK_SECONDS,
  WATER_GLASS_EXERCISE_ID,
} from './record';

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
  /** The movement, for its pictogram. */
  move?: MoveId;
  /** Effort points toward its element's daily par (see `par.ts`). */
  points: number;
  /** About how long it took, for active minutes (see `active.ts`). */
  seconds?: number;
  /** For Train entries: the metric kind. */
  kindId?: string;
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

const CHECK_INS: ReadonlySet<string> = new Set([
  'heart.fuel-check',
  'heart.morning-intent',
]);

/** A set's time: holds as held, reps at about three seconds each. */
function setSeconds(unit: 'reps' | 'seconds' | undefined, amount: number) {
  return unit === 'seconds' ? amount : Math.max(20, amount * 3);
}

/** A test of reps or a max: about a minute of work. */
const TEST_SECONDS = 60;

/** A point a minute, at least a drill's worth, at most the session cap. */
export function minutePoints(seconds: number): number {
  return Math.min(
    POINTS.sessionMinutesMax,
    Math.max(POINTS.drill, Math.round(seconds / 60)),
  );
}

function drillPoints(
  ex: Exercise | undefined,
  e: Pick<CompletionEntry, 'exerciseId' | 'durationSec'>,
): number {
  if (e.exerciseId === WATER_GLASS_EXERCISE_ID || isHydration(ex)) {
    return POINTS.glass;
  }
  if (CHECK_INS.has(e.exerciseId)) {
    return POINTS.checkIn;
  }
  return minutePoints(e.durationSec ?? ex?.approxSeconds ?? 0);
}

/**
 * What answering a chime for `drill` is worth, per element: a water call
 * is a glass and an eye break; anything else is the drill's own points.
 */
export function chimePoints(
  drill: Exercise,
): Partial<Record<ElementId, number>> {
  if (isHydration(drill)) {
    return {water: POINTS.glass, air: POINTS.eyeBreak};
  }
  return {[drill.element]: drillPoints(drill, {exerciseId: drill.id})};
}

/** A Train entry: runs, sessions and timed custom kinds by the minute; maxes as tests. */
export function trainPoints(
  entry: TrainingLogEntry,
  kind: MetricKind | undefined,
): number {
  if (!kind) {
    return POINTS.drill;
  }
  const timed = kind.inputMode === 'mmss' || kind.inputMode === 'distance-time';
  if (
    kind.category === 'run' ||
    kind.category === 'session' ||
    (kind.category === 'custom' && timed)
  ) {
    return minutePoints(entry.value);
  }
  return kind.category === 'custom' ? POINTS.drill : POINTS.test;
}

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

/**
 * An element nothing knows — from an older build, a hand-edited export or
 * a bad write — used to flow straight into the day's totals and turn them
 * into NaN, which showed as a blank Today. It is counted under Core
 * instead, and said out loud once so it can be found.
 */
const reported = new Set<string>();

function knownElement(
  element: ElementId | undefined,
  fallback: ElementId = 'heart',
): ElementId {
  if (element !== undefined && ELEMENT_ORDER.includes(element)) {
    return element;
  }
  const seen = String(element);
  if (!reported.has(seen)) {
    reported.add(seen);
    logError('activity', `an entry says its element is "${seen}"`);
  }
  return fallback;
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
        element: track?.element ?? knownElement(e.element),
        label: single?.name ?? track?.name ?? 'Set',
        detail: track
          ? formatSetAmount(m.amount, track.unit)
          : String(m.amount),
        exerciseId: single?.id,
        trackId: m.trackId,
        amount: m.amount,
        move: moveForTrack(m.trackId),
        points: POINTS.set,
        seconds: setSeconds(track?.unit, m.amount),
      });
    }
  } else {
    const ex = exerciseFor(e.exerciseId);
    const counted =
      typeof e.amount === 'number' && e.amountUnit
        ? formatCount(e.amount, e.amountUnit)
        : undefined;
    items.push({
      ...base,
      id: e.id,
      element: knownElement(e.element),
      label: ex?.name ?? (e.exerciseId === 'retro' ? 'Logged later' : 'Drill'),
      detail: counted ?? ex?.dose,
      amount: typeof e.amount === 'number' ? e.amount : undefined,
      exerciseId: e.exerciseId,
      move: moveForExercise(e.exerciseId),
      hydration: isHydration(ex) || undefined,
      points: drillPoints(ex, e),
      seconds: e.durationSec ?? ex?.approxSeconds,
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
      move: moveForExercise(partner.id),
      hydration: isHydration(partner) || undefined,
      points: POINTS.drill,
      seconds: e.partnerSec ?? partner.approxSeconds,
    });
  }
  if (e.water) {
    items.push({
      ...base,
      id: `${e.id}:water`,
      element: 'water',
      label: 'Glass of water',
      exerciseId: WATER_GLASS_EXERCISE_ID,
      move: 'drink',
      hydration: true,
      points: POINTS.glass,
    });
  }
  // Every chimed glass (a round's, or a water call answered) comes with an
  // eye break; a glass from Today's +1 counter doesn't.
  const waterCall =
    moves.length === 0 &&
    e.pulseId !== undefined &&
    isHydration(exerciseFor(e.exerciseId));
  if (e.water || waterCall) {
    items.push({
      ...base,
      id: `${e.id}:eyes`,
      element: 'air',
      label: 'Eye break',
      detail: `${EYE_BREAK_SECONDS} sec`,
      exerciseId: EYE_BREAK_EXERCISE_ID,
      move: moveForExercise(EYE_BREAK_EXERCISE_ID),
      points: POINTS.eyeBreak,
    });
  }
  return items;
}

function testItem(e: ProgramTestEntry): ActivityItem {
  const track = TRACKS.find(t => t.id === e.trackId);
  return {
    id: e.id,
    at: e.at,
    element: track?.element ?? knownElement(e.element),
    source: 'test',
    label: `${track?.name ?? 'Max'} test`,
    detail: `max ${track ? formatSetAmount(e.max, track.unit) : e.max}`,
    trackId: e.trackId,
    amount: e.max,
    move: moveForTrack(e.trackId),
    points: POINTS.test,
    seconds: TEST_SECONDS,
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
    move: moveForMetric(kind),
    points: trainPoints(entry, kind),
    kindId: entry.kindId,
    // A rep count, e.g. a 1-minute push-up test.
    amount: kind?.inputMode === 'integer' ? entry.value : undefined,
    // Timed kinds took as long as they say; a rep test about a minute.
    seconds:
      kind?.inputMode === 'mmss' || kind?.inputMode === 'distance-time'
        ? entry.value
        : kind?.inputMode === 'integer'
        ? TEST_SECONDS
        : undefined,
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
