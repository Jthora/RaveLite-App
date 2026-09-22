import {EXERCISE_LIBRARY} from '../exercises/library';
import type {MorningBlock} from './week';
import type {Exercise} from '../exercises/types';
import {moveForExercise, type MoveId} from '../exercises/moves';
import {pickDrillForSlotSeeded} from '../reminders/scheduler';
import type {CadenceSlot, Window} from '../reminders/types';
import {canDo} from '../profile/kit';
import {loadFacts} from '../profile/repository';
import {runDay, runFitness, type RunDay} from '../run/plan';
import {getMetric, loadEntries} from '../training/repository';
import {programWeek} from './progression';
import {focusFor, loadProgram} from './repository';

/**
 * Morning block chimes. A plan slot marked `block: 'morning'` chimes the
 * day's morning block (see `week.ts`) piece by piece: the window's first
 * chime is the first piece, the next chime the second, and so on, with a
 * longer window repeating the last piece. Saturdays chime their test. On
 * a run day the run plan's run (`run/plan.ts`) takes its piece's place.
 * Any other slot picks from the library as before.
 */

export interface PlannedDrill {
  drill?: Exercise;
  /** For a block piece: "Kicks and jumps · 1 of 3", or the run: "6 × 400 m in 1:59 · 1 of 3". */
  detail?: string;
  /** The block's first piece, soon after waking. */
  first?: boolean;
}

/**
 * Pieces too sharp for cold legs: jumps, kicks, sprints and strikes. A
 * morning block's first chime comes soon after waking, so when its piece
 * is one of these the chime asks for a warm-up first — unless the drill
 * already carries its own warm-up cue.
 */
const SHARP_MOVES: ReadonlySet<MoveId> = new Set<MoveId>(['jump', 'kick']);
const SHARP_IDS: ReadonlySet<string> = new Set([
  'fire.backyard-strides',
  'fire.cft-sprint',
  'fire.jab-cross',
  'fire.hook-uppercut',
  'fire.elbow-strikes',
]);

export const WARM_UP_NOTE =
  'Warm up for 5 min first: march, leg swings, arm circles';

export function needsWarmUp(drill: Exercise): boolean {
  if (drill.cues?.some(cue => /^warm up/i.test(cue))) {
    return false;
  }
  const move = moveForExercise(drill.id);
  return (
    SHARP_IDS.has(drill.id) || (move !== undefined && SHARP_MOVES.has(move))
  );
}

export interface BlockPiece {
  exerciseId: string;
  /** The run plan's run, when this piece is it. */
  run?: RunDay;
  /** The block's own piece, when this one is standing in for it. */
  standsInFor?: string;
}

/**
 * What to do instead of a piece this person can't — or wouldn't — do,
 * in order; the first one they can do wins.
 *
 * The week was written around the author, who fights with a staff. Not
 * everybody who raves wants to: without Martial basics a Friday used to
 * be an empty block, and an empty block threw the moment its chime
 * fired. So each fighting piece has a flow or dance piece first, and
 * every list ends in base drills that almost any room can do.
 */
const STAND_INS: Readonly<Record<string, readonly string[]>> = {
  'fire.roundhouse-kick': [
    'water.beat-step',
    'fire.jump-squat',
    'fire.pushup-groove',
    'fire.burpee',
    'air.shadow-rope',
  ],
  'fire.kick-flip-foundations': [
    'fire.tuck-jump',
    'water.freeze-hold',
    'earth.hollow-rock',
    'earth.single-leg-balance',
  ],
  'water.staff-combat-rounds': [
    'water.beat-locks',
    'water.flow-toy-round',
    'water.groove-combo',
    'water.juggle-toss',
  ],
  'fire.backyard-strides': [
    'fire.skater-bound',
    'fire.mountain-climbers',
    'air.shadow-rope',
  ],
  'fire.jab-cross': [
    'water.groove-combo',
    'fire.burpee',
    'fire.pushup-groove',
    'air.shadow-rope',
  ],
  'fire.block-drill': [
    'water.arm-wave',
    'water.flow-toy-round',
    'water.juggle-toss',
  ],
  'earth.stance-transitions': ['earth.tree-pose', 'earth.single-leg-balance'],
};

/** The run plan's run for `date`, from the Train log, if the day has one. */
export function runFor(
  date: Date,
  now: number = Date.now(),
): RunDay | undefined {
  const program = loadProgram(date);
  return runDay({
    date,
    week: programWeek(program.startDay, date),
    fitness: runFitness(loadEntries(), getMetric, now),
    now,
  });
}

/** The day's morning block, piece by piece, with the run plan's run in place. */
const EXERCISES = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));
const exerciseById = (id: string) => EXERCISES.get(id);

export function blockPieces(
  date: Date,
  now: number = Date.now(),
): BlockPiece[] {
  const {block} = focusFor(date);
  const run = runFor(date, now);
  const facts = loadFacts();
  const doable = (id: string) => {
    const drill = exerciseById(id);
    return drill !== undefined && canDo(drill, facts);
  };
  const out: BlockPiece[] = [];
  for (const id of block.pieces) {
    const piece: BlockPiece =
      run && id === run.replaces
        ? {exerciseId: run.exerciseId, run}
        : {exerciseId: id};
    if (doable(piece.exerciseId)) {
      out.push(piece);
      continue;
    }
    // Never the same drill twice in one morning.
    const standIn = (STAND_INS[id] ?? []).find(
      alt => doable(alt) && !out.some(p => p.exerciseId === alt),
    );
    if (standIn) {
      out.push({exerciseId: standIn, standsInFor: id});
    }
  }
  return out;
}

/** What the morning is called, given the pieces it actually has. */
export function blockTitle(
  block: MorningBlock,
  pieces: readonly BlockPiece[],
): string {
  return pieces.some(p => p.standsInFor)
    ? block.standInTitle ?? block.title
    : block.title;
}

/** Which of the day's chimes of `slot` falls at `ts`, from 0. */
export function chimeIndex(
  window: Window,
  slot: CadenceSlot,
  ts: number,
): number {
  const [h, m] = window.startTime.split(':').map(Number);
  const start = new Date(ts);
  start.setHours(h, m, 0, 0);
  const step = Math.max(1, slot.everyMinutes) * 60_000;
  return Math.max(0, Math.round((ts - start.getTime()) / step));
}

/** The drill a plan chime asks for, before the weather has its say. */
export function plannedDrill(
  slot: CadenceSlot | undefined,
  window: Window | undefined,
  pulseId: string,
  ts: number,
): PlannedDrill {
  if (!slot) {
    return {};
  }
  if (slot.block === 'morning' && window) {
    const date = new Date(ts);
    const {block} = focusFor(date);
    const pieces = blockPieces(date, ts);
    // A block with nothing this person can do falls through to the plan's
    // own pick below, rather than reading pieces[-1].
    const i = Math.min(chimeIndex(window, slot, ts), pieces.length - 1);
    const piece = i >= 0 ? pieces[i] : undefined;
    const drill = piece
      ? EXERCISE_LIBRARY.find(e => e.id === piece.exerciseId)
      : undefined;
    if (piece && drill) {
      const which = `${i + 1} of ${pieces.length}`;
      const title = blockTitle(block, pieces);
      return {
        drill,
        detail: `${piece.run ? piece.run.short : title} · ${which}`,
        first: i === 0,
      };
    }
  }
  return {drill: pickDrillForSlotSeeded(slot, pulseId)};
}
