/**
 * Archetypes — one answer instead of twenty.
 *
 * Everything an archetype sets can be set by hand: the packs, the day
 * shape, which tracks are on. That is the point. Setup asks one question
 * a stranger can actually answer — *what are you training for* — and
 * turns it into a working program, and Settings then shows every dial it
 * moved rather than hiding them. Pick one, change anything, and the
 * archetype is just where you started.
 *
 * Nothing here is a difficulty setting. A shorter day is not an easier
 * one (see `program/density.ts`); an archetype with six chimes asks the
 * same proportion of its owner as one with twenty.
 */
import type {DayShapeId} from '../program/types';
import type {TrackId} from '../program/types';
import type {PackId} from './packs';

export type ArchetypeId =
  | 'raver'
  | 'guardian'
  | 'monk'
  | 'operator'
  | 'desk-rebel'
  | 'comeback'
  | 'flow-artist'
  | 'super-hero'
  | 'night-shift'
  | 'parent'
  | 'festival-six';

export interface Archetype {
  id: ArchetypeId;
  name: string;
  /** Completes "for someone who…" — the line under the name. */
  forWhom: string;
  /** What it leads with, in four or five words. */
  leadsWith: string;
  packs: readonly PackId[];
  shape: DayShapeId;
  /**
   * Tracks to turn off for this archetype. Everything else stays on:
   * subtraction is safer than a whitelist, because a track added later
   * appears in every archetype rather than silently in none.
   */
  tracksOff?: readonly TrackId[];
  /** Weeks, for the two that have a finish line. */
  blockWeeks?: number;
  /**
   * Push-ups a day to aim at. 200 is one person's number and a wall for
   * most people; an unreachable goal is not motivating, it is just a
   * number that never moves.
   */
  pushupGoal: number;
}

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: 'raver',
    name: 'The Raver',
    forWhom: 'wants the fitness to dance all night',
    leadsWith: 'Dance, stamina, flow, water',
    packs: ['dance', 'staff', 'yoga-taichi', 'jumps', 'runs'],
    shape: 'desk',
    pushupGoal: 100,
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    forWhom: 'wants to be able to defend themselves',
    leadsWith: 'Strikes, blocks, kicks, strength',
    packs: ['martial', 'jumps', 'runs'],
    shape: 'desk',
    pushupGoal: 200,
  },
  {
    id: 'monk',
    name: 'The Monk',
    forWhom: 'wants to be balanced, calm and mobile',
    leadsWith: 'Breath, stillness, tai chi, mobility',
    packs: ['yoga-taichi'],
    shape: 'office',
    tracksOff: ['kicks'],
    pushupGoal: 50,
  },
  {
    id: 'operator',
    name: 'The Operator',
    forWhom: 'wants to train everything and be tested',
    leadsWith: 'Everything, plus military fitness tests',
    packs: [
      'dance',
      'dance-combat',
      'martial',
      'staff',
      'yoga-taichi',
      'jumps',
      'military-tests',
      'runs',
    ],
    shape: 'desk',
    pushupGoal: 200,
  },
  {
    id: 'desk-rebel',
    name: 'The Desk Rebel',
    forWhom: 'wants to undo the effects of sitting',
    leadsWith: 'Posture, hips, eyes, short sets',
    packs: ['yoga-taichi'],
    shape: 'office',
    tracksOff: ['kicks'],
    pushupGoal: 100,
  },
  {
    id: 'comeback',
    name: 'The Comeback',
    forWhom: 'is coming back from an injury, or from years off',
    leadsWith: 'Joint prep, small doses, slow progress',
    packs: [],
    shape: 'shift',
    tracksOff: ['kicks', 'flow'],
    blockWeeks: 12,
    pushupGoal: 50,
  },
  {
    id: 'flow-artist',
    name: 'The Flow Artist',
    forWhom: 'spins a prop and wants both hands equally good',
    leadsWith: 'Dexterity, off-hand training, stage presence',
    packs: ['staff', 'dance', 'yoga-taichi'],
    shape: 'desk',
    pushupGoal: 100,
  },
  {
    id: 'super-hero',
    name: 'The Super Hero',
    forWhom: 'wants to mix fighting and dance',
    leadsWith: 'Dance combat, flow, kicks, power',
    packs: ['dance-combat', 'dance', 'staff', 'martial', 'jumps', 'runs'],
    shape: 'desk',
    pushupGoal: 100,
  },
  {
    id: 'night-shift',
    name: 'The Night Shift',
    forWhom: 'works nights',
    leadsWith: 'Light exposure, sleep, steady work',
    packs: ['yoga-taichi', 'runs'],
    shape: 'shift',
    pushupGoal: 100,
  },
  {
    id: 'parent',
    name: 'The Parent',
    forWhom: 'has ten minutes at a time, at most',
    leadsWith: 'Short, quiet, easy to pause',
    packs: [],
    shape: 'weekend',
    tracksOff: ['kicks', 'flow'],
    pushupGoal: 50,
  },
  {
    id: 'festival-six',
    name: 'The Festival Six',
    forWhom: 'has a festival in six weeks and wants to be ready',
    leadsWith: 'Dance volume, feet, sleep',
    packs: ['dance', 'yoga-taichi', 'runs'],
    shape: 'desk',
    blockWeeks: 6,
    pushupGoal: 100,
  },
];

const BY_ID = new Map(ARCHETYPES.map(a => [a.id, a]));

export const archetypeById = (id: ArchetypeId): Archetype | undefined =>
  BY_ID.get(id);

/** The one the app assumes when nobody has been asked. */
export const DEFAULT_ARCHETYPE: ArchetypeId = 'operator';

/**
 * The number this app was written around, kept for any install that has
 * never been asked — so nobody already training toward it wakes up to a
 * smaller goal.
 */
export const AUTHOR_PUSHUP_GOAL = 200;
