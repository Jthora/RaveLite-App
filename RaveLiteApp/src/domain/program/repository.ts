import {store} from '../../storage';
import {quarantine} from '../diagnostics/quarantine';
import {KEYS} from '../../storage/keys';
import {append, entriesForDay} from '../journal/journal';
import {localDayKey} from '../training/grading';
import {TRACKS, trackById} from './tracks';
import {WINDOW_DAYS, reviewTrack, type DayWork} from './adapt';
import {
  applyTest,
  levelDown,
  levelUp,
  phaseForWeek,
  prescribeDay,
  programWeek,
  trainsOn,
} from './progression';
import {doneByTrack} from './progress';
import type {DayPrescription, ProgramState, TrackId, TrackState} from './types';
import {
  dayDensity,
  loadArchetype,
  loadFacts,
  loadPacks,
  loadProfile,
  loadStarting,
  rampIsPaused,
  trainsToday,
} from '../profile/repository';
import {seededMax, startingFactor} from '../profile/starting';
import {restDaySet} from '../profile/restDays';
import {myDayRunsOn} from '../ambient/activeHours';
import {dayFocus, type DayFocus} from './week';

/**
 * Daily Sets persistence. One `ProgramState` blob. The program starts
 * (week 1, day 1) the first time it is loaded.
 */

export function defaultProgram(now: Date = new Date()): ProgramState {
  const tracks = {} as Record<TrackId, TrackState>;
  // Seeded once, from where this person says they are starting. After
  // this the ramp and the max tests own these numbers; a week of training
  // says far more than the question ever could.
  const factor = startingFactor(loadStarting());
  const bottom = startsAtTheBottom();
  for (const t of TRACKS) {
    tracks[t.id] = {
      enabled: t.enabledByDefault,
      rung: bottom ? 0 : t.defaultRung,
      testMax: seededMax(t.defaultMax, factor),
    };
  }
  return {
    version: 1,
    startDay: localDayKey(now.getTime()),
    tracks,
  };
}

/**
 * Whether every ladder starts on its first step: for somebody new to
 * this, or coming back. The author's rungs — full push-ups, porch
 * pull-ups — are a wall for a beginner, whatever the numbers say.
 */
export function startsAtTheBottom(): boolean {
  return loadStarting() === 'new' || loadArchetype() === 'comeback';
}

export function loadProgram(now: Date = new Date()): ProgramState {
  const raw = store.getString(KEYS.programState);
  if (!raw) {
    const fresh = defaultProgram(now);
    store.set(KEYS.programState, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw) as ProgramState;
    const base = defaultProgram(now);
    // Spread over defaults so tracks added in later versions auto-fill.
    return {...base, ...parsed, tracks: {...base.tracks, ...parsed.tracks}};
  } catch (e) {
    quarantine(KEYS.programState, raw, e);
    return defaultProgram(now);
  }
}

const listeners = new Set<(program: ProgramState) => void>();

export function saveProgram(program: ProgramState): void {
  store.set(KEYS.programState, JSON.stringify(program));
  for (const l of listeners) {
    try {
      l(program);
    } catch (e) {
      console.warn('[program] listener threw', e);
    }
  }
}

/** Fires on every save. Returns an unsubscribe function. */
export function subscribeProgram(
  listener: (program: ProgramState) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function updateTrack(
  id: TrackId,
  fn: (state: TrackState) => TrackState,
): ProgramState {
  const program = loadProgram();
  const next = {
    ...program,
    tracks: {...program.tracks, [id]: fn(program.tracks[id])},
  };
  saveProgram(next);
  return next;
}

export function setTrackEnabled(id: TrackId, enabled: boolean): ProgramState {
  return updateTrack(id, s => ({...s, enabled}));
}

/** Save a new max and journal the test so it shows in the day's activity. */
export function recordMaxTest(
  id: TrackId,
  max: number,
  at: number = Date.now(),
): ProgramState {
  const next = updateTrack(id, s => applyTest(s, max, at));
  append({
    kind: 'program.test',
    at,
    trackId: id,
    max,
    rung: next.tracks[id].rung,
    element: trackById(id).element,
  });
  return next;
}

export function levelUpTrack(id: TrackId): ProgramState {
  return updateTrack(id, s => levelUp(trackById(id), s, loadFacts()));
}

/** One rung easier, for when today's is too hard. */
export function levelDownTrack(id: TrackId): ProgramState {
  return updateTrack(id, s => levelDown(trackById(id), s, loadFacts()));
}

/** Every enabled track's work for `date`, in catalog order. */
export function prescriptionsFor(
  program: ProgramState,
  date: Date,
): DayPrescription[] {
  // A rest day asks for nothing. Not one set scaled to nothing — nothing,
  // so the day is empty on purpose rather than looking like a day that
  // went wrong. Water and the evening review still chime; they are not
  // Daily Sets. A day My day is switched off is the same: not a training
  // day the person failed, but one they said they would not train.
  if (!trainsToday(date.getTime()) || !myDayRunsOn(date)) {
    return [];
  }
  const out: DayPrescription[] = [];
  for (const t of TRACKS) {
    const p = prescribeDay(
      t,
      program.tracks[t.id],
      program,
      date,
      loadFacts(date.getTime()),
      dayDensity(date.getTime()),
    );
    if (p) {
      out.push(p);
    }
  }
  return out;
}

/** `date`'s focus, morning block and any Saturday test, in its program week. */
export function focusFor(date: Date = new Date()): DayFocus {
  const program = loadProgram(date);
  const week = programWeek(program.startDay, date);
  return dayFocus(date, week, {tests: saturdayTests(week)});
}

/** The first week anyone set up since 22 Sep 2026 is tested: block two. */
export const FIRST_TEST_WEEK = 5;

/**
 * Whether Saturdays are max-effort tests.
 *
 * Only with the Military tests pack: a flat-out test is a choice, not a
 * default. And not in the first four weeks for anybody who went through
 * setup, so the first test comes after a block of training rather than
 * on day six. An install from before setup keeps its rotation.
 */
export function saturdayTests(week: number): boolean {
  if (!loadPacks().includes('military-tests')) {
    return false;
  }
  return loadProfile().startedSetupAt === undefined || week >= FIRST_TEST_WEEK;
}

/** Days of asks kept for the daily review. */
const DAY_HISTORY_DAYS = 35;

type DayHistory = Record<string, Partial<Record<TrackId, number>>>;

function loadDayHistory(): DayHistory {
  const raw = store.getString(KEYS.programDays);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as DayHistory;
  } catch {
    return {};
  }
}

/** Keep what `day` asked of each track (reps or seconds), for its review. */
export function recordPrescribed(
  day: string,
  prescriptions: readonly DayPrescription[],
): void {
  const history = loadDayHistory();
  const asked = Object.fromEntries(
    prescriptions.map(p => [p.trackId, p.setSize * p.sets]),
  );
  if (JSON.stringify(history[day]) === JSON.stringify(asked)) {
    return;
  }
  const kept = Object.keys(history)
    .filter(k => k !== day)
    .sort()
    .slice(-(DAY_HISTORY_DAYS - 1));
  const next: DayHistory = Object.fromEntries(kept.map(k => [k, history[k]]));
  next[day] = asked;
  store.set(KEYS.programDays, JSON.stringify(next));
}

type ExcusedLog = Record<string, Partial<Record<TrackId, number>>>;

function loadExcused(): ExcusedLog {
  const raw = store.getString(KEYS.programExcused);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as ExcusedLog;
  } catch {
    return {};
  }
}

/**
 * Sets in a round that never sounded — paused, or outside My day — are
 * not held against the day that asked them. Called when the round is
 * suppressed.
 */
export function excuseSets(
  day: string,
  moves: readonly {trackId: TrackId; amount: number}[],
): void {
  const log = loadExcused();
  const excused = {...(log[day] ?? {})};
  for (const move of moves) {
    excused[move.trackId] = (excused[move.trackId] ?? 0) + move.amount;
  }
  const kept = Object.keys(log)
    .filter(k => k !== day)
    .sort()
    .slice(-(DAY_HISTORY_DAYS - 1));
  const next: ExcusedLog = Object.fromEntries(kept.map(k => [k, log[k]]));
  next[day] = excused;
  store.set(KEYS.programExcused, JSON.stringify(next));
}

/**
 * What a track was asked on a day, for its review.
 *
 * A day with a record is taken at its word: a track missing from it was
 * not asked — switched off, out of reach on the road, or a rest day — and
 * asked nothing, rather than everything. Only a day with no record at
 * all (the app never ran) falls back to what the track would have asked.
 * Sets that never sounded are taken off.
 */
function askedOn(
  record: Partial<Record<TrackId, number>> | undefined,
  excused: Partial<Record<TrackId, number>> | undefined,
  trackId: TrackId,
  would: number,
): number {
  const asked = record ? record[trackId] ?? 0 : would;
  return Math.max(0, asked - (excused?.[trackId] ?? 0));
}

/**
 * Once a day, move each track's sets by what got done over the week before
 * today (see `adapt.ts`). Reads the journal, each day's recorded asks and
 * the rest-day log: days that were rest are left out entirely, so a day
 * off, a festival or an injury never reads as quitting once it is over.
 * Returns the program, reviewed.
 */
export function reviewProgram(now: number = Date.now()): ProgramState {
  const date = new Date(now);
  const program = loadProgram(date);
  const yesterday = new Date(date);
  yesterday.setHours(12, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  const through = localDayKey(yesterday.getTime());
  if (
    program.reviewedThrough !== undefined &&
    program.reviewedThrough >= through
  ) {
    return program;
  }

  const window: Date[] = [];
  for (let back = WINDOW_DAYS; back >= 1; back--) {
    const day = new Date(date);
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - back);
    if (localDayKey(day.getTime()) >= program.startDay) {
      window.push(day);
    }
  }
  const history = loadDayHistory();
  const excused = loadExcused();
  const rest = restDaySet();
  const done = window.map(day => doneByTrack(entriesForDay(day)));
  const deload =
    phaseForWeek(programWeek(program.startDay, yesterday)) === 'deload';
  const today = localDayKey(now);

  const tracks = {...program.tracks};
  for (const track of TRACKS) {
    const state = tracks[track.id];
    if (!state.enabled) {
      continue;
    }
    const days: DayWork[] = window.flatMap((day, i) => {
      const key = localDayKey(day.getTime());
      if (!trainsOn(track, day) || rest.has(key)) {
        return [];
      }
      const would = history[key]
        ? undefined
        : prescribeDay(track, state, program, day, loadFacts(), dayDensity());
      return [
        {
          day: key,
          prescribed: askedOn(
            history[key],
            excused[key],
            track.id,
            would ? would.setSize * would.sets : 0,
          ),
          done: done[i][track.id]?.amount ?? 0,
        },
      ];
    });
    tracks[track.id] = reviewTrack({
      track,
      state,
      days,
      today,
      deload,
      paused: rampIsPaused(),
    });
  }
  const next: ProgramState = {...program, tracks, reviewedThrough: through};
  saveProgram(next);
  return next;
}
