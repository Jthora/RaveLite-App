import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {append} from '../journal/journal';
import {localDayKey} from '../training/grading';
import {TRACKS, trackById} from './tracks';
import {applyTest, levelUp, prescribeDay} from './progression';
import type {DayPrescription, ProgramState, TrackId, TrackState} from './types';

/**
 * Daily Sets persistence. One `ProgramState` blob. The program starts
 * (week 1, day 1) the first time it is loaded.
 */

/** Matches the default active hours start so the first set isn't suppressed. */
export const DEFAULT_DAY_START = '09:00';
export const DEFAULT_DAY_END = '21:00';

export function defaultProgram(now: Date = new Date()): ProgramState {
  const tracks = {} as Record<TrackId, TrackState>;
  for (const t of TRACKS) {
    tracks[t.id] = {
      enabled: t.enabledByDefault,
      rung: t.defaultRung,
      testMax: t.defaultMax,
    };
  }
  return {
    version: 1,
    startDay: localDayKey(now.getTime()),
    dayStart: DEFAULT_DAY_START,
    dayEnd: DEFAULT_DAY_END,
    tracks,
  };
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
  } catch {
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
      // eslint-disable-next-line no-console
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
  return updateTrack(id, s => levelUp(trackById(id), s));
}

/** Change the set window. Ignored unless end is after start. */
export function setDayWindow(dayStart: string, dayEnd: string): ProgramState {
  const program = loadProgram();
  if (dayEnd <= dayStart) {
    return program;
  }
  const next = {...program, dayStart, dayEnd};
  saveProgram(next);
  return next;
}

/** Every enabled track's work for `date`, in catalog order. */
export function prescriptionsFor(
  program: ProgramState,
  date: Date,
): DayPrescription[] {
  const out: DayPrescription[] = [];
  for (const t of TRACKS) {
    const p = prescribeDay(t, program.tracks[t.id], program, date);
    if (p) {
      out.push(p);
    }
  }
  return out;
}
