import {EXERCISE_LIBRARY} from '../exercises/library';
import {inScope, type PackId} from './packs';
import type {Exercise, Venue} from '../exercises/types';
import {moveForExercise, type MoveId} from '../exercises/moves';

/**
 * What you have, where you are, and how much noise you can make.
 *
 * The app was built around one person's kit — a mat, a backyard, a porch
 * edge to hang from and a stack of bricks. Everyone else has something
 * else. This decides what a given body in a given room can actually do,
 * and every place that picks a drill asks it first.
 */

export type KitItem =
  | 'floor' // always true: somewhere to stand
  | 'mat'
  | 'wall' // a wall or a doorframe
  | 'chair' // a sturdy chair, a step, a bed edge
  | 'stairs'
  | 'hangPoint' // a bar, a porch edge, a beam, a branch
  | 'bricks' // bricks, books in a pack, any carryable load
  | 'staff'
  | 'ball'
  | 'yard'
  | 'streets';

/** Everyone has the first one; the rest are claimed in setup. */
export const KIT_ITEMS: readonly KitItem[] = [
  'floor',
  'mat',
  'wall',
  'chair',
  'stairs',
  'hangPoint',
  'bricks',
  'staff',
  'ball',
  'yard',
  'streets',
];

export const KIT_LABELS: Readonly<Record<KitItem, string>> = {
  floor: 'Somewhere to stand',
  mat: 'A mat or carpet',
  wall: 'A wall or doorframe',
  chair: 'A sturdy chair or step',
  stairs: 'Stairs',
  hangPoint: 'Something to hang from',
  bricks: 'Bricks or a loaded pack',
  staff: 'A staff',
  ball: 'A ball',
  yard: 'A yard or garden',
  streets: 'Streets to walk or run',
};

/** How loud you can be where you train. */
export type Noise = 'quiet' | 'normal' | 'free';

/** A part of the body a mode says not to load. */
export const REGIONS = [
  'shoulder',
  'elbow',
  'wrist',
  'back',
  'hip',
  'knee',
  'ankle',
] as const;

export type Region = (typeof REGIONS)[number];

export interface Facts {
  kit: KitItem[];
  /**
   * Which curricula exist for this person. Like `injured`, not a fact
   * about the room — but it decides availability the same way and comes
   * through the same door, so `canDo` is the one place that has to know.
   * Absent means everything, which keeps every caller written before
   * packs existed meaning what it did. See `packs.ts`.
   */
  packs?: PackId[];
  /**
   * A part that must not be loaded today. Not a fact about the room, but
   * it gates drills exactly like one, and it arrives by the same door:
   * `loadFacts()` stamps it from the active mode, so every caller that
   * already asks what can be done here gets it without knowing modes
   * exist. See `mode.ts`.
   */
  injured?: Region;
  noise: Noise;
  corrections: ('UCS' | 'APT' | 'Hourglass')[];
  heightInches?: number;
}

/** What the author has — the program as it was built. */
export const AUTHOR_FACTS: Facts = {
  kit: [...KIT_ITEMS],
  noise: 'free',
  corrections: ['UCS', 'APT', 'Hourglass'],
};

/** What a stranger has before they answer anything. */
export const DEFAULT_FACTS: Facts = {
  kit: ['floor', 'wall'],
  noise: 'normal',
  corrections: [],
};

/** Venues each piece of kit opens up. */
const VENUES_FOR: Readonly<Record<KitItem, readonly Venue[]>> = {
  floor: ['standing', 'desk', 'house'],
  mat: ['mat'],
  wall: ['wall'],
  chair: [],
  stairs: [],
  hangPoint: ['porch'],
  bricks: [],
  staff: [],
  ball: [],
  yard: ['yard'],
  streets: ['neighborhood'],
};

/**
 * Props a drill cannot be done without. Kept here rather than in the
 * library so the whole list can be reviewed at once — the same reason
 * the pictograms and the attribute mappings live in one file each.
 *
 * Only genuine requirements: a drill that merely *mentions* bricks as an
 * option (a deeper squat, a higher foot) is not listed.
 */
const PROPS_FOR: Readonly<Record<string, readonly KitItem[]>> = {
  'air.brick-halo': ['bricks'],
  'earth.brick-farmer-walk': ['bricks'],
  'earth.brick-pinch': ['bricks'],
  'earth.cft-brick-lifts': ['bricks'],
  'earth.suitcase-carry': ['bricks'],
  'fire.brick-pack-pullup': ['bricks', 'hangPoint'],
  'earth.stair-carry': ['bricks', 'stairs'],
  'air.stair-breath': ['stairs'],
  'earth.stair-step-up': ['stairs'],
  'earth.chair-dip': ['chair'],
  'earth.copenhagen-plank': ['chair'],
  'earth.bulgarian-split-squat': ['chair'],
  'fire.decline-pushup': ['chair'],
  'water.figure-8': ['staff'],
  'water.beat-locks': ['staff'],
  'water.sword-form-slow': ['staff'],
  'water.album-no-drop': ['staff'],
  'water.staff-combat-rounds': ['staff'],
  'air.wall-ball-catch': ['ball'],
  'water.foot-roll': ['ball'],
};

/** Moves a downstairs neighbour would hear. */
const LOUD: ReadonlySet<MoveId> = new Set<MoveId>(['jump', 'staff']);
const LOUD_IDS: ReadonlySet<string> = new Set([
  'air.shadow-rope',
  'fire.pogo-hops',
  'fire.backyard-strides',
  'water.beat-step',
  'water.toprock',
  'water.house-jack',
  'water.grapevine',
]);

export function allowedVenues(facts: Facts): Set<Venue> {
  const out = new Set<Venue>();
  for (const item of facts.kit) {
    for (const venue of VENUES_FOR[item]) {
      out.add(venue);
    }
  }
  // Standing room is not something anyone has to claim.
  out.add('standing');
  out.add('desk');
  out.add('house');
  return out;
}

/** What a drill needs beyond a place to stand. */
export function propsFor(id: string): readonly KitItem[] {
  return PROPS_FOR[id] ?? [];
}

/** True when the drill would be heard through a floor. */
export function isLoud(drill: Exercise): boolean {
  const move = moveForExercise(drill.id);
  return LOUD_IDS.has(drill.id) || (move !== undefined && LOUD.has(move));
}

/** Body parts a drill loads, for Injured mode. */
const LOADS: Readonly<Record<Region, readonly MoveId[]>> = {
  shoulder: ['push', 'pull', 'row', 'hang', 'plank', 'chestopener'],
  elbow: ['push', 'pull', 'row', 'hang'],
  wrist: ['push', 'plank'],
  back: ['row', 'pull', 'bridge', 'carry', 'crunch', 'legraise'],
  hip: ['squat', 'lunge', 'kick', 'hipopener', 'bridge'],
  knee: ['squat', 'lunge', 'jump', 'kick', 'run', 'wallsit'],
  ankle: ['jump', 'run', 'walk', 'balance', 'footwork', 'kick'],
};

export function loadsRegion(drill: Exercise, region: Region): boolean {
  const move = moveForExercise(drill.id);
  return move !== undefined && LOADS[region].includes(move);
}

/** Can this body, in this room, do this drill at all? */
export function canDo(
  drill: Exercise,
  facts: Facts,
  opts: {injured?: Region} = {},
): boolean {
  const venues = allowedVenues(facts);
  if (!drill.venues.some(v => venues.has(v))) {
    return false;
  }
  if (!propsFor(drill.id).every(p => facts.kit.includes(p))) {
    return false;
  }
  if (facts.noise === 'quiet' && isLoud(drill)) {
    return false;
  }
  const injured = opts.injured ?? facts.injured;
  if (injured && loadsRegion(drill, injured)) {
    return false;
  }
  if (facts.packs && !inScope(drill.id, facts.packs)) {
    return false;
  }
  return true;
}

/** Drills this kit can do right now. */
export function usableDrills(
  facts: Facts,
  opts: {injured?: Region} = {},
): Exercise[] {
  return EXERCISE_LIBRARY.filter(drill => canDo(drill, facts, opts));
}

/**
 * How many more drills one piece of kit would unlock — the number the
 * setup tiles show, because "15 drills and the Pull track" teaches more
 * than a paragraph.
 */
export function unlockCount(item: KitItem, facts: Facts): number {
  if (facts.kit.includes(item)) {
    return 0;
  }
  const withIt: Facts = {...facts, kit: [...facts.kit, item]};
  return usableDrills(withIt).length - usableDrills(facts).length;
}
