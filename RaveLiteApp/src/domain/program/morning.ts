import {EXERCISE_LIBRARY} from '../exercises/library';
import type {Exercise} from '../exercises/types';
import {pickDrillForSlotSeeded} from '../reminders/scheduler';
import type {CadenceSlot, Window} from '../reminders/types';
import {focusFor} from './repository';

/**
 * Morning block chimes. A plan slot marked `block: 'morning'` chimes the
 * day's morning block (see `week.ts`) piece by piece: the window's first
 * chime is the first piece, the next chime the second, and so on, with a
 * longer window repeating the last piece. Saturdays chime their test. Any
 * other slot picks from the library as before.
 */

export interface PlannedDrill {
  drill?: Exercise;
  /** For a block piece: "Kicks and jumps · 1 of 3". */
  detail?: string;
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
    const {block} = focusFor(new Date(ts));
    const i = Math.min(chimeIndex(window, slot, ts), block.pieces.length - 1);
    const drill = EXERCISE_LIBRARY.find(e => e.id === block.pieces[i]);
    if (drill) {
      return {
        drill,
        detail: `${block.title} · ${i + 1} of ${block.pieces.length}`,
      };
    }
  }
  return {drill: pickDrillForSlotSeeded(slot, pulseId)};
}
