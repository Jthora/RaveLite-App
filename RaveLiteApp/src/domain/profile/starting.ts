/**
 * Where someone is starting from.
 *
 * Every track ships a `defaultMax` — ten push-ups, three pull-ups, forty
 * seconds of plank. Those are one person's honest starting numbers, and
 * for anyone else they are a guess that can be badly wrong in either
 * direction. Phase 1 made the program ask the room what it can do; this
 * is the same question asked of the body.
 *
 * It is not a difficulty setting and it does not stay. It scales the
 * seeded maxes once, on a fresh program, and after that the ramp and the
 * max tests own those numbers entirely — a week of training tells the
 * app far more than this question ever could. Getting it wrong costs
 * about a week.
 */
export type StartingPoint = 'new' | 'returning' | 'training';

export interface StartingSpec {
  id: StartingPoint;
  /** Completes "I'm…". */
  name: string;
  detail: string;
  /** What the seeded maxes are multiplied by. */
  factor: number;
}

export const STARTING_POINTS: readonly StartingSpec[] = [
  {
    id: 'new',
    name: 'new to this',
    detail: 'Start low. It goes up once you finish the sets.',
    factor: 0.5,
  },
  {
    id: 'returning',
    name: 'coming back to it',
    detail: 'You have done this before. Start at the middle and adjust.',
    factor: 1,
  },
  {
    id: 'training',
    name: 'training already',
    detail: 'Start higher. Take a max test to get exact numbers.',
    factor: 1.5,
  },
];

/** The one assumed when nobody has been asked — today's behaviour exactly. */
export const DEFAULT_STARTING: StartingPoint = 'returning';

const BY_ID = new Map(STARTING_POINTS.map(s => [s.id, s]));

export function startingFactor(id: StartingPoint | undefined): number {
  return BY_ID.get(id ?? DEFAULT_STARTING)?.factor ?? 1;
}

/**
 * A seeded max, scaled. Never below one — a track that asks for nothing
 * is a track that teaches nothing — and rounded to something a person
 * would actually say out loud.
 */
export function seededMax(defaultMax: number, factor: number): number {
  if (factor === 1) {
    return defaultMax;
  }
  const raw = defaultMax * factor;
  // Seconds-scale numbers round to fives; rep-scale ones to whole reps.
  const rounded = raw >= 30 ? Math.round(raw / 5) * 5 : Math.round(raw);
  return Math.max(1, rounded);
}
