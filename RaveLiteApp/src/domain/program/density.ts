/**
 * How much day there is to train in.
 *
 * The app was built around one person's day: at a desk, phone beside the
 * monitors, nine chimes between waking and dinner. Someone on a shift, or
 * in an office where a chime is a interruption, gets nowhere near that —
 * and the adaptive ramp reads *share of prescribed sets done*, so if the
 * prescription never shrinks, a four-chime life sits at 40% for ever and
 * never levels up. The fix is not to lower the bar. It is to ask for a
 * day's worth of work instead of someone else's day's worth.
 *
 * A shape sets one number — rounds — and everything else follows from it:
 * sets per track, and the daily par each element is measured against.
 * Nothing here touches the ramp's thresholds (85% up, 60% down), because
 * those are already shares and shares travel.
 */
import type {DayShapeId} from './types';

export interface DayShape {
  id: DayShapeId;
  name: string;
  /** What the day looks like, in the second person. */
  detail: string;
  /** Chimes the day can carry. */
  rounds: number;
}

/** The author's day, and the density every other shape is a fraction of. */
export const FULL_ROUNDS = 9;

export const DAY_SHAPES: readonly DayShape[] = [
  {
    id: 'desk',
    name: 'At a desk',
    detail: 'Home or a desk you control. A chime every hour or so is fine.',
    rounds: 9,
  },
  {
    id: 'office',
    name: 'In an office',
    detail: 'People around. Fewer, quieter breaks — and none in a meeting.',
    rounds: 6,
  },
  {
    id: 'shift',
    name: 'On your feet',
    detail: 'A shift, a ward, a site. Already moving; training fits the edges.',
    rounds: 4,
  },
  {
    id: 'weekend',
    name: 'Only some days',
    detail: 'The week is not yours. Train properly when it is.',
    rounds: 2,
  },
];

const BY_ID = new Map(DAY_SHAPES.map(shape => [shape.id, shape]));

/** Rounds a shape asks for. `custom` carries its own count. */
export function roundsFor(id: DayShapeId, custom?: number): number {
  if (id === 'custom') {
    return Math.max(
      1,
      Math.min(FULL_ROUNDS, Math.round(custom ?? FULL_ROUNDS)),
    );
  }
  return BY_ID.get(id)?.rounds ?? FULL_ROUNDS;
}

/** A shape's share of a full day, 0–1. */
export function densityFor(id: DayShapeId, custom?: number): number {
  return roundsFor(id, custom) / FULL_ROUNDS;
}

/**
 * Scale a day's ask by density. Never to nothing: a short day still asks
 * for one set, because the point of a short day is that it still counts.
 */
export function scaleSets(sets: number, density: number): number {
  if (density >= 1) {
    return sets;
  }
  return Math.max(1, Math.round(sets * density));
}

/**
 * Points an element aims for. Rounded to 5 so the number on Today stays
 * readable, and never below MIN_PAR.
 *
 * The floor is not cosmetic. Sets never scale all the way down — every
 * track keeps at least one — so the shortest day still prescribes about a
 * third of a full day's work, not the fifth its density implies. Par
 * straight off the density would then sit well under what the day already
 * asks for, and Harmony would arrive by simply doing as told. The floor
 * keeps the shortest day honest: still a day's work, still worth finishing.
 */
export const MIN_PAR = 10;

export function parFor(density: number, fullPar: number): number {
  if (density >= 1) {
    return fullPar;
  }
  return Math.max(MIN_PAR, Math.round((fullPar * density) / 5) * 5);
}
