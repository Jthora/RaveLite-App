import {MS_PER_DAY} from '../../lib/constants';
import type {
  DayPrescription,
  Phase,
  ProgramState,
  Rung,
  Track,
  TrackState,
} from './types';
import {scaleSets} from './density';
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
 * base before its first review; a deload week asks for about 60%, and a
 * shorter day (`density`, see `density.ts`) asks for its share of that.
 *
 * Density is applied here, at the point of prescription, and never to the
 * stored ladder. The ramp keeps climbing the full ladder underneath, so a
 * month of short days doesn't unwind what was earned, and moving back to a
 * longer day hands it all back at once.
 */
export function setsFor(
  track: Track,
  state: TrackState,
  phase: Phase,
  density: number = 1,
): number {
  const earned = Math.min(track.maxSets, state.sets ?? track.baseSets);
  const full =
    phase === 'deload'
      ? Math.max(2, Math.round(earned * DELOAD_FACTOR))
      : earned;
  return scaleSets(full, density);
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

/** Ladder step `i` as this room can do it: itself, its stand-in, or not. */
function doableAt(track: Track, i: number, facts?: Facts): Rung | undefined {
  const rung = track.ladder[i];
  if (!rung || !facts) {
    return rung;
  }
  const drill = exerciseById(rung.exerciseId);
  if (drill && canDo(drill, facts)) {
    return rung;
  }
  const stand = rung.instead
    ? exerciseById(rung.instead.exerciseId)
    : undefined;
  if (stand && canDo(stand, facts)) {
    return {...rung, exerciseId: stand.id, label: rung.instead!.label};
  }
  return undefined;
}

export interface Step {
  /** Where on the ladder it is. */
  index: number;
  rung: Rung;
}

/** Today's rung and where it sits, after stand-ins and fallbacks. */
export function currentStep(
  track: Track,
  state: TrackState,
  facts?: Facts,
): Step | undefined {
  for (let i = clampRung(track, state.rung); i >= 0; i--) {
    const rung = doableAt(track, i, facts);
    if (rung) {
      return {index: i, rung};
    }
  }
  return undefined;
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
  return currentStep(track, state, facts)?.rung;
}

/**
 * The nearest step above (`+1`) or below (`-1`) today's that this room can
 * do and that is a different drill. A step whose only answer here is the
 * drill already being trained is no step at all: taking it used to halve
 * the numbers and change nothing else.
 */
export function neighbourStep(
  track: Track,
  state: TrackState,
  direction: 1 | -1,
  facts?: Facts,
): Step | undefined {
  const here = currentStep(track, state, facts);
  if (!here) {
    return undefined;
  }
  for (
    let i = here.index + direction;
    i >= 0 && i < track.ladder.length;
    i += direction
  ) {
    const rung = doableAt(track, i, facts);
    if (rung && rung.exerciseId !== here.rung.exerciseId) {
      return {index: i, rung};
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
  density: number = 1,
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
    // The focus bonus is not scaled. It is one set, and one set is how a
    // focus day announces itself; scaled down it would round to nothing
    // and a short week would have no shape at all.
    sets: Math.min(
      track.maxSets,
      setsFor(track, state, phaseForWeek(week), density) + bonus,
    ),
    week,
    phase: phaseForWeek(week),
  };
}

/**
 * True once the set size has reached today's rung's graduation mark and
 * there is a harder step this room can do.
 */
export function readyToLevelUp(
  track: Track,
  state: TrackState,
  facts?: Facts,
): boolean {
  const here = currentStep(track, state, facts);
  return (
    here !== undefined &&
    neighbourStep(track, state, 1, facts) !== undefined &&
    setSizeFor(track, state) >= track.ladder[here.index].graduateAt
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
export function levelUp(
  track: Track,
  state: TrackState,
  facts?: Facts,
): TrackState {
  const next = neighbourStep(track, state, 1, facts);
  if (!next) {
    return state;
  }
  const floor = track.unit === 'seconds' ? 20 : 2;
  return {
    ...state,
    rung: next.index,
    testMax: Math.max(floor, Math.round(state.testMax * 0.5)),
    testedAt: undefined,
  };
}

/**
 * Step back down to an easier rung. The easier variation roughly doubles
 * what you can do, so the max is estimated at twice until it is tested —
 * the same guess as levelling up, the other way.
 */
export function levelDown(
  track: Track,
  state: TrackState,
  facts?: Facts,
): TrackState {
  const prev = neighbourStep(track, state, -1, facts);
  if (!prev) {
    return state;
  }
  return {
    ...state,
    rung: prev.index,
    testMax: Math.max(1, Math.round(state.testMax * 2)),
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
