import {ElementId} from '../theme/elements';
import {EXERCISE_LIBRARY} from '../exercises/library';
import {Exercise} from '../exercises/types';

/**
 * The Circuit — RaveLite's signature ritual.
 *
 * Clockwise pentagram order: Air → Fire → Earth → Water → Heart.
 * Heart seals last because Heart conducts. Each leg picks the shortest
 * available drill for that element so the full circuit fits inside a
 * micro-break (~3-5 minutes).
 *
 * Pure / synchronous so it can be built from a screen render without
 * a hook. No state, no side effects.
 */

export const CIRCUIT_ORDER: ElementId[] = [
  'air',
  'fire',
  'earth',
  'water',
  'heart',
];

export interface CircuitLeg {
  element: ElementId;
  exercise: Exercise;
  /** Suggested duration on screen (seconds), capped for circuit pacing. */
  durationSec: number;
}

/** Cap per-leg time so a full pentagram ≤ ~3.5 minutes. */
const LEG_CAP_SEC = 45;
/** Floor so even fast drills give the body time to land. */
const LEG_FLOOR_SEC = 25;

/**
 * Build a single circuit. Pure: same input → same output (given the
 * library is constant). The first matching drill per element wins —
 * curators control circuit composition by listing the "circuit-friendly"
 * drill first for each element in the library.
 */
export function buildCircuit(): CircuitLeg[] {
  return CIRCUIT_ORDER.map(element => {
    const exercise = EXERCISE_LIBRARY.find(e => e.element === element);
    if (!exercise) {
      // Library invariant: at least one drill per element. Throw loud
      // because it means the seed has regressed.
      throw new Error(`No exercise for element "${element}" in library`);
    }
    const dur = Math.min(
      LEG_CAP_SEC,
      Math.max(LEG_FLOOR_SEC, exercise.approxSeconds),
    );
    return {element, exercise, durationSec: dur};
  });
}
