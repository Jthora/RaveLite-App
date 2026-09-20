import {EXERCISE_LIBRARY} from '../exercises/library';
import type {Exercise} from '../exercises/types';
import {append} from '../journal/journal';
import type {CompletionEntry} from '../journal/types';
import {currentRung, setSizeFor} from '../program/progression';
import {loadFacts} from '../profile/repository';
import {loadProgram} from '../program/repository';
import {TRACKS} from '../program/tracks';

/**
 * Write helpers for "done" taps made outside a chime. Views call these
 * instead of building journal entries, so every tap lands where the
 * day's counts look for it.
 */

/** The drill a glass of water is logged as. */
export const WATER_GLASS_EXERCISE_ID = 'water.sip';

/** The eye break that rides along with every chimed glass. */
export const EYE_BREAK_EXERCISE_ID = 'air.eye-break';
export const EYE_BREAK_SECONDS = 20;

/** A water call's drill: answering its chime also means an eye break. */
export function isWaterCallDrill(exerciseId: string | undefined): boolean {
  const drill = exerciseId
    ? EXERCISE_LIBRARY.find(ex => ex.id === exerciseId)
    : undefined;
  return drill?.targets.includes('Hydration') ?? false;
}

/**
 * Log a drill tapped by hand. When the drill is an enabled Daily Sets
 * track's current rung, the tap also counts one set toward that track.
 */
export function recordDrillTap(
  exercise: Exercise,
  source: CompletionEntry['source'] = 'manual',
  now: Date = new Date(),
): CompletionEntry {
  const program = loadProgram(now);
  const track = TRACKS.find(t => {
    const state = program.tracks[t.id];
    return (
      state?.enabled &&
      currentRung(t, state, loadFacts())?.exerciseId === exercise.id
    );
  });
  const set = track
    ? {trackId: track.id, amount: setSizeFor(track, program.tracks[track.id])}
    : {};
  return append({
    kind: 'completion',
    at: now.getTime(),
    exerciseId: exercise.id,
    element: exercise.element,
    source,
    durationSec: exercise.approxSeconds,
    ...set,
  }) as CompletionEntry;
}

/** One glass of water, logged from Today's counter. */
export function logWaterGlass(at: number = Date.now()): CompletionEntry {
  return append({
    kind: 'completion',
    at,
    exerciseId: WATER_GLASS_EXERCISE_ID,
    element: 'water',
    source: 'manual',
  }) as CompletionEntry;
}
