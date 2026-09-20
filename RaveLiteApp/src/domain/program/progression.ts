import {MS_PER_DAY} from '../../lib/constants';
import type {
  DayPrescription,
  Phase,
  ProgramState,
  Rung,
  Track,
  TrackState,
} from './types';
import {EXERCISE_LIBRARY} from '../exercises/library';
import {canDo, type Facts} from '../profile/kit';
import {dayFocus, focusBonus} from './week';

/**
 * Progression — pure rules for how much work each track asks for today.
 *
 *   Volume  — sets/day follow what gets done (`adapt.ts`): a set more
 *             after a week at 85%+, a set fewer under 60%. Week 4 of
 *             every block is a deload at ~60%.
 *   Focus   — a focus day adds one set to its dry track (Mobility,
 *             Stillness or Breath); see `week.ts`.
 *   Load    — set size is ~50% of the tested max. Retesting (best done
 *             on deload weeks, when fresh) is what raises it.
 *   Skill   — once the set size reaches the rung's `graduateAt`, the next
 *             rung (harder variation) is unlocked. Moving up resets the
 *             max to an estimate until the operator tests it.
 */

export const BLOCK_WEEKS = 4;
/** Deload volume relative to the block's peak build week. */
const DELOAD_FACTOR = 0.6;

/** Parse a local "YYYY-MM-DD" into local midnight. */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole local calendar days from `from` to `to` (DST-safe). */
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/** 1-based program week containing `date`. Dates before the start are week 1. */
export function programWeek(startDay: string, date: Date): number {
  const days = daysBetween(parseDayKey(startDay), date);
  return days < 0 ? 1 : Math.floor(days / 7) + 1;
}

export function phaseForWeek(week: number): Phase {
  return (Math.max(1, week) - 1) % BLOCK_WEEKS === BLOCK_WEEKS - 1
    ? 'deload'
    : 'build';
}

/**
 * Sets a day for a track: what it has earned (see `adapt.ts`), or its week-1
 * base before its first review; a deload week asks for about 60%.
 */
export function setsFor(track: Track, state: TrackState, phase: Phase): number {
  const earned = Math.min(track.maxSets, state.sets ?? track.baseSets);
  return phase === 'deload'
    ? Math.max(2, Math.round(earned * DELOAD_FACTOR))
    : earned;
}

/** Per-set amount: ~intensity × max. Holds round to 5 s, minimum 10 s. */
export function setSizeFor(track: Track, state: TrackState): number {
  const raw = state.testMax * track.intensity;
  if (track.unit === 'seconds') {
    return Math.max(10, Math.round(raw / 5) * 5);
  }
  return Math.max(1, Math.round(raw));
}

const EXERCISES = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));
const exerciseById = (id: string) => EXERCISES.get(id);

function clampRung(track: Track, rung: number): number {
  return Math.max(0, Math.min(track.ladder.length - 1, rung));
}

/**
 * The rung to train today. With the author's kit this is simply the rung
 * the state points at. With less kit it is the same step's stand-in — a
 * towel over a door where there is no bar — and failing that, the
 * highest step below it that the room can actually do. A track whose
 * whole ladder is out of reach returns nothing, and is skipped.
 */
export function currentRung(
  track: Track,
  state: TrackState,
  facts?: Facts,
): Rung | undefined {
  const at = clampRung(track, state.rung);
  if (!facts) {
    return track.ladder[at];
  }
  for (let i = at; i >= 0; i--) {
    const rung = track.ladder[i];
    const drill = exerciseById(rung.exerciseId);
    if (drill && canDo(drill, facts)) {
      return rung;
    }
    const stand = rung.instead ? exerciseById(rung.instead.exerciseId) : undefined;
    if (stand && canDo(stand, facts)) {
      return {...rung, exerciseId: stand.id, label: rung.instead!.label};
    }
  }
  return undefined;
}

export function trainsOn(track: Track, date: Date): boolean {
  return track.days.includes(date.getDay());
}

/** Today's work for one track, or `undefined` on a rest day / disabled track. */
export function prescribeDay(
  track: Track,
  state: TrackState,
  program: ProgramState,
  date: Date,
  facts?: Facts,
): DayPrescription | undefined {
  if (!state.enabled || !trainsOn(track, date)) {
    return undefined;
  }
  const rung = currentRung(track, state, facts);
  if (!rung) {
    // Nothing on this ladder can be done here — no bar, no stand-in.
    return undefined;
  }
  const week = programWeek(program.startDay, date);
  const bonus = focusBonus(track.id, dayFocus(date, week).focus);
  return {
    trackId: track.id,
    element: track.element,
    exerciseId: rung.exerciseId,
    label: rung.label,
    unit: track.unit,
    setSize: setSizeFor(track, state),
    sets: Math.min(
      track.maxSets,
      setsFor(track, state, phaseForWeek(week)) + bonus,
    ),
    week,
    phase: phaseForWeek(week),
  };
}

/** True once the set size has reached the current rung's graduation mark. */
export function readyToLevelUp(track: Track, state: TrackState): boolean {
  const i = clampRung(track, state.rung);
  return (
    i < track.ladder.length - 1 &&
    setSizeFor(track, state) >= track.ladder[i].graduateAt
  );
}

/** Record a max test on the current rung. */
export function applyTest(
  state: TrackState,
  max: number,
  at: number,
): TrackState {
  return {...state, testMax: Math.max(1, Math.round(max)), testedAt: at};
}

/**
 * Step up to the next rung. A harder variation roughly halves what you
 * can do, so the max is estimated at 50% until the operator tests it.
 */
export function levelUp(track: Track, state: TrackState): TrackState {
  const i = clampRung(track, state.rung);
  if (i >= track.ladder.length - 1) {
    return state;
  }
  const floor = track.unit === 'seconds' ? 20 : 2;
  return {
    ...state,
    rung: i + 1,
    testMax: Math.max(floor, Math.round(state.testMax * 0.5)),
    testedAt: undefined,
  };
}

/**
 * A max test is due when the current rung has never been tested, or
 * during a deload week whose start is after the last test.
 */
export function isTestDue(
  program: ProgramState,
  state: TrackState,
  date: Date,
): boolean {
  if (state.testedAt === undefined) {
    return true;
  }
  const week = programWeek(program.startDay, date);
  if (phaseForWeek(week) !== 'deload') {
    return false;
  }
  const weekStart = parseDayKey(program.startDay);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  return state.testedAt < weekStart.getTime();
}
