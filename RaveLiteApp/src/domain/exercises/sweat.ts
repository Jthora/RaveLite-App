import {moveForExercise, type MoveId} from './moves';
import type {Exercise} from './types';

/**
 * Sweat — which drills soak a shirt. Laundry is limited, so these belong
 * in the morning block, before the shower; Daily Sets rounds and daytime
 * suggestions stay dry.
 */

/** Moves that raise a sweat however short the dose. */
const SWEATY_MOVES: ReadonlySet<MoveId> = new Set<MoveId>([
  'run',
  'jump',
  'kick',
  'staff',
  'footwork',
]);

export function isSweaty(drill: Exercise): boolean {
  const move = moveForExercise(drill.id);
  return (
    drill.targets.includes('Conditioning') ||
    (move !== undefined && SWEATY_MOVES.has(move))
  );
}
