import {EXERCISE_LIBRARY} from '../exercises/library';
import type {Exercise} from '../exercises/types';
import {pickDrillForSlotSeeded} from '../reminders/scheduler';
import type {CadenceSlot, Window} from '../reminders/types';
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
}

export interface BlockPiece {
  exerciseId: string;
  /** The run plan's run, when this piece is it. */
  run?: RunDay;
}

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
export function blockPieces(
  date: Date,
  now: number = Date.now(),
): BlockPiece[] {
  const {block} = focusFor(date);
  const run = runFor(date, now);
  return block.pieces.map(id =>
    run && id === run.replaces
      ? {exerciseId: run.exerciseId, run}
      : {exerciseId: id},
  );
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
    const i = Math.min(chimeIndex(window, slot, ts), pieces.length - 1);
    const piece = pieces[i];
    const drill = EXERCISE_LIBRARY.find(e => e.id === piece.exerciseId);
    if (drill) {
      const which = `${i + 1} of ${pieces.length}`;
      return {
        drill,
        detail: `${piece.run ? piece.run.short : block.title} · ${which}`,
      };
    }
  }
  return {drill: pickDrillForSlotSeeded(slot, pulseId)};
}
