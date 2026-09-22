/**
 * Flaws — the things a desk did to you, named.
 *
 * These already existed as `Facts.corrections`: three strings, set for
 * the author, with no UI and no explanation anywhere. They steer which
 * drills appear and have done for months. Calling them corrections made
 * them sound like a settings checkbox; they are the reason half this
 * program exists.
 *
 * A flaw is honest in a way a perk could not be. It is not a status the
 * app invented to make a number go up — it is a real postural fault with
 * a name, a cause, and work that addresses it. Naming it, explaining it
 * and showing what would clear it turns a chore into something with an
 * end.
 *
 * **Nothing here modifies anything.** No bonus, no multiplier, no XP.
 * The moment a flaw changes a number, the character sheet stops being a
 * record of what you did and starts being a save file. Flaws change what
 * the app *asks* for, which it already did — they just say so now.
 */
import type {Target} from '../exercises/types';
import {EXERCISE_LIBRARY} from '../exercises/library';
import type {ElementId} from '../../theme/elements';

export type FlawId = 'UCS' | 'APT' | 'Hourglass';

export interface Flaw {
  id: FlawId;
  /** What it is called out loud, not in a textbook. */
  name: string;
  /** The clinical name, for anyone who wants to look it up. */
  proper: string;
  element: ElementId;
  /** What it actually is, in a sentence somebody would say. */
  what: string;
  /** Why you have it. Almost always the same answer. */
  cause: string;
  /** What it costs you — the reason to bother. */
  costs: string;
  /** The drills that address it carry this tag. */
  target: Target;
  /** Sessions of that work, inside `withinDays`, before it is worth asking. */
  times: number;
  withinDays: number;
  /** How you would know yourself, since the app cannot see you. */
  tell: string;
}

export const FLAWS: readonly Flaw[] = [
  {
    id: 'UCS',
    name: 'Screen Shoulders',
    proper: 'Upper Crossed Syndrome',
    element: 'air',
    what: 'Head forward, shoulders rolled in, a tight chest and weak muscles between the shoulder blades.',
    cause: 'Years of looking down and forward at screens.',
    costs:
      'It tightens your chest and shortens your breath, so you tire sooner.',
    target: 'UCS',
    times: 24,
    withinDays: 28,
    tell: 'Stand against a wall. If the back of your head only reaches it when you lift your chin, you have this.',
  },
  {
    id: 'APT',
    name: 'Tipped Pelvis',
    proper: 'Anterior Pelvic Tilt',
    element: 'earth',
    what: 'Pelvis tipped forward, lower back over-arched, tight hip flexors and weak glutes.',
    cause: 'Sitting. Your hips stay bent all day, and your body adapts to it.',
    costs:
      'It takes power from every kick and jump. Your glutes do too little.',
    target: 'APT',
    times: 24,
    withinDays: 28,
    tell: 'Lie flat. If you can slide a whole forearm under your lower back, you have this.',
  },
  {
    id: 'Hourglass',
    name: 'Held Breath',
    proper: 'Chronic abdominal gripping',
    element: 'air',
    what: 'Your belly is always held tight. You breathe into your chest and your ribs flare instead of widening.',
    cause: 'Holding your stomach in for so long that it became a habit.',
    costs:
      'Your belly never relaxes, so your diaphragm never gets its full range.',
    target: 'Hourglass',
    times: 20,
    withinDays: 28,
    tell: 'Lie down with a hand on your belly. If it does not rise before your chest, you have this.',
  },
];

const BY_ID = new Map(FLAWS.map(f => [f.id, f]));

export const flawById = (id: FlawId): Flaw | undefined => BY_ID.get(id);

/**
 * The drills that address a flaw — anything in the library carrying its
 * tag. Derived rather than listed, so a drill added with the right tag
 * counts toward clearing it without anybody remembering to update a list.
 */
export function drillsForFlaw(flaw: Flaw): string[] {
  return EXERCISE_LIBRARY.filter(e => e.targets.includes(flaw.target)).map(
    e => e.id,
  );
}

export interface FlawProgress {
  done: number;
  needed: number;
  /** 0–1, for the bar. */
  at: number;
  /** Enough work has been done to be worth asking how it feels. */
  ready: boolean;
}

/**
 * How much of the work has been done lately.
 *
 * This deliberately measures **work, not posture.** The app cannot see
 * whether your head sits over your shoulders; it can only see that you
 * did the drills. So it never clears a flaw by itself — it says the work
 * is done and asks you, because you are the only one who can look in a
 * mirror.
 */
export function flawProgress(flaw: Flaw, sessions: number): FlawProgress {
  const done = Math.max(0, sessions);
  return {
    done,
    needed: flaw.times,
    at: Math.min(1, done / flaw.times),
    ready: done >= flaw.times,
  };
}
