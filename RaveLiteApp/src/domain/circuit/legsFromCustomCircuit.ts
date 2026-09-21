/**
 * Resolve a CustomCircuit into runtime CircuitLeg[] (the same shape
 * the existing CircuitChamber consumes).
 *
 * If an exerciseId points to a drill that no longer exists in the
 * library (e.g. seed evolved between sessions), we fall back to the
 * first available drill for that element. Returning legs with the
 * exact requested durationSec — no clamping. The editor enforces
 * bounds at write-time so persisted values are already in range.
 */
import {EXERCISE_LIBRARY} from '../exercises/library';
import type {CircuitLeg} from './circuit';
import type {CustomCircuit} from './customTypes';

export function legsFromCustomCircuit(c: CustomCircuit): CircuitLeg[] {
  return c.legs.map(leg => {
    let exercise = EXERCISE_LIBRARY.find(e => e.id === leg.exerciseId);
    if (!exercise) {
      exercise = EXERCISE_LIBRARY.find(e => e.element === leg.element);
    }
    if (!exercise) {
      // Library invariant violated — should never happen in production
      // because the seed guarantees ≥1 drill per element.
      throw new Error(
        `No fallback drill for element "${leg.element}" — library regression?`,
      );
    }
    return {
      element: leg.element,
      exercise,
      durationSec: leg.durationSec,
    };
  });
}

/** Convenience for the editor's exercise picker. */
export function exercisesForElement(
  element: import('../../theme/elements').ElementId,
) {
  return EXERCISE_LIBRARY.filter(e => e.element === element);
}
