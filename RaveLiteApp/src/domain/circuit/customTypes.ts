/**
 * Custom circuit domain — user-authored sequences of legs.
 *
 * Distinct from the built-in pentagram (`buildCircuit`) which is a
 * pure derivation from the exercise library. Custom circuits are
 * persisted, named, and may have any number of legs (1+).
 *
 * Legs reference exercises by id rather than embedding the Exercise
 * object — keeps the on-disk representation stable across library
 * updates and avoids re-serialising functions/cues.
 */
import type {ElementId} from '../../theme/elements';

export interface CustomCircuitLeg {
  element: ElementId;
  /** id from `EXERCISE_LIBRARY`. Resolution happens at run-time. */
  exerciseId: string;
  durationSec: number;
}

export interface CustomCircuit {
  id: string;
  name: string;
  legs: CustomCircuitLeg[];
  /** ms epoch — created/updated for sort order. */
  createdAt: number;
  updatedAt: number;
}

export const LEG_DURATION_MIN = 15;
export const LEG_DURATION_MAX = 120;
export const LEG_DURATION_DEFAULT = 45;
