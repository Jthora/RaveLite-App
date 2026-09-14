/**
 * Daily Sets at a glance: sets done against today's total, and a meter per
 * track (amount done against the day's quota).
 */
import type {ElementId} from '../../theme/elements';
import {moveForTrack, type MoveId} from '../exercises/moves';
import type {doneByTrack} from './progress';
import {TRACKS} from './tracks';
import type {DayPrescription, TrackId} from './types';

export interface SetsMeter {
  trackId: TrackId;
  name: string;
  element: ElementId;
  move: MoveId;
  /** Amount done, capped at the day's quota. */
  done: number;
  total: number;
  /** `done / total`, from 0 to 1. */
  fill: number;
}

export interface SetsSummary {
  /** Sets done today, capped per track at its quota. */
  done: number;
  total: number;
  tracks: SetsMeter[];
}

/** How full a meter is, from 0 to 1. */
export function meterFill(done: number, total: number): number {
  return total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
}

export function summarizeSets(
  prescriptions: readonly DayPrescription[],
  done: ReturnType<typeof doneByTrack>,
): SetsSummary {
  return {
    done: prescriptions.reduce(
      (sum, p) => sum + Math.min(p.sets, done[p.trackId]?.sets ?? 0),
      0,
    ),
    total: prescriptions.reduce((sum, p) => sum + p.sets, 0),
    tracks: prescriptions.map(p => {
      const total = p.setSize * p.sets;
      const amount = Math.min(total, done[p.trackId]?.amount ?? 0);
      return {
        trackId: p.trackId,
        name: TRACKS.find(tr => tr.id === p.trackId)?.name ?? p.label,
        element: p.element,
        move: moveForTrack(p.trackId) ?? 'activity',
        done: amount,
        total,
        fill: meterFill(amount, total),
      };
    }),
  };
}
