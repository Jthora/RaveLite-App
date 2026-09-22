import {EXERCISE_LIBRARY} from '../exercises/library';
import {inScope, type PackId} from './packs';
import type {Exercise, Venue} from '../exercises/types';
import {moveForExercise, type MoveId} from '../exercises/moves';
import {DISCIPLINES} from '../exercises/disciplines';

/**
 * Where you train, what is there, what you carry, and how loud you can be.
 *
 * The app was built around one person's kit — a mat, a backyard, a porch
 * edge to hang from and a stack of bricks. Everyone else has something
 * else. This decides what a given body in a given set of places can
 * actually do, and every place that picks a drill asks it first.
 *
 * **Kit belongs to places.** A low ceiling is true of a basement, not of
 * a person; ticking it used to take six jumps away from a yard with sky
 * over it. So a person has places — a room, a yard, the streets — each
 * with its own things and its own limits, and carries a few things
 * between them: a band, a rope, a staff. A drill is doable if any one
 * place allows it, with what you carry added to every place.
 *
 * A profile written before places has only the flat list. It reads as a
 * single place holding everything, which is exactly what it meant then.
 */

export type KitItem =
  // Under you
  | 'floor' // always true: somewhere to stand
  | 'mat'
  | 'grass'
  | 'sand'
  // Around you
  | 'wall'
  | 'doorway'
  | 'chair' // a sturdy chair, a step, a bed edge
  | 'table' // a table, a desk edge, a counter
  | 'stairs'
  | 'hallway'
  | 'bench'
  | 'rail' // a railing, a post, a fence
  | 'beam' // something narrow to balance on: a log, a low wall, a 2×4
  | 'mirror' // big enough to see yourself move in
  | 'kerb'
  | 'hill'
  // To hang from — asked as a question, not two tiles; see `Hang`
  | 'hangLow' // feet reach the ground: rows, bent-knee hangs
  | 'hangHigh' // you hang clear: full hangs, leg raises, pull-ups
  | 'frame' // a playground frame: monkey bars, parallel bars
  // What a place is. Set by its kind, never ticked.
  | 'yard'
  | 'streets'
  | 'park'
  | 'stairwell'
  // Something heavy
  | 'bricks' // bricks, books in a pack, any carryable load
  | 'jugs'
  | 'sandbag'
  // In your hands
  | 'ball'
  | 'rope'
  | 'band'
  // Flow toys — the rave's own kit
  | 'staff'
  | 'doubleStaff'
  | 'poi'
  | 'hoop'
  | 'fans'
  | 'wand'
  | 'ropeDart'
  | 'contactBall'
  | 'buugeng'
  | 'dragonStaff'
  | 'flags'
  | 'gloves' // light gloves: gloving
  | 'juggling' // balls, bean bags or clubs
  | 'devilSticks';

/**
 * What a place takes away.
 *
 * Every constraint the author described is one of these, not an absence:
 * a low basement ceiling, a buggy yard, neighbours below. The model had
 * exactly one — `noise` — doing the work of all of them, and *not having
 * a yard* is a completely different program from *having a yard full of
 * mosquitos in July*.
 *
 * A limit only ever removes drills. It must never scale the program
 * down: that is what the day shape is for, and two things doing one job
 * is how this app starts lying.
 */
export type LimitId =
  | 'lowCeiling' // no jumps, no overhead, no staff above the head
  | 'below' // neighbours underneath: nothing with impact
  | 'watched' // people around: no floor work, nothing that looks odd
  | 'tight' // less than arm's length in any direction
  | 'barefoot'; // no shoes: no sprinting, bounding or kerb work

export const LIMITS: readonly {
  id: LimitId;
  label: string;
  note: string;
}[] = [
  {
    id: 'lowCeiling',
    label: 'A low ceiling',
    note: 'Nothing jumped, spun or pressed overhead.',
  },
  {
    id: 'below',
    label: 'Neighbours below',
    note: 'Nothing they would hear through the floor.',
  },
  {
    id: 'watched',
    label: 'People around',
    note: 'Nothing on the floor, nothing odd-looking.',
  },
  {
    id: 'tight',
    label: 'Not much room',
    note: "Less than arm's length. No staff, no broad movement.",
  },
  {
    id: 'barefoot',
    label: 'No shoes',
    note: 'A hard floor. No sprinting, bounding or kerb work.',
  },
];

/**
 * Things you take with you. They are in every place you are, so they
 * are claimed once, not per place.
 */
export const CARRIED: ReadonlySet<KitItem> = new Set<KitItem>([
  'bricks',
  'jugs',
  'sandbag',
  'ball',
  'rope',
  'band',
  'staff',
  'doubleStaff',
  'poi',
  'hoop',
  'fans',
  'wand',
  'ropeDart',
  'contactBall',
  'buugeng',
  'dragonStaff',
  'flags',
  'gloves',
  'juggling',
  'devilSticks',
]);

/** What a place *is*. Its kind puts one in; nobody ticks it. */
const ANCHORS: ReadonlySet<KitItem> = new Set<KitItem>([
  'yard',
  'streets',
  'park',
  'stairwell',
]);

export const isCarried = (item: KitItem): boolean => CARRIED.has(item);

/**
 * What a room can do, grouped the way somebody would look for it.
 *
 * Thirty loose tiles is a wall; a handful of groups is a list. Places
 * show the first three, and only the tiles their kind offers; what you
 * carry is the last three, shown once.
 */
export interface KitGroup {
  title: string;
  items: readonly KitItem[];
}

export const PLACE_GROUPS: readonly KitGroup[] = [
  {title: 'Under you', items: ['floor', 'mat', 'grass', 'sand']},
  {
    title: 'Around you',
    items: [
      'wall',
      'doorway',
      'chair',
      'table',
      'stairs',
      'hallway',
      'bench',
      'rail',
      'beam',
      'kerb',
      'hill',
      'mirror',
    ],
  },
  {title: 'To hang from', items: ['hangLow', 'hangHigh', 'frame']},
];

export const CARRIED_GROUPS: readonly KitGroup[] = [
  {title: 'Something heavy', items: ['bricks', 'jugs', 'sandbag']},
  {title: 'In your hands', items: ['band', 'rope', 'ball']},
  {
    title: 'Flow toys',
    items: [
      'staff',
      'doubleStaff',
      'poi',
      'hoop',
      'fans',
      'wand',
      'ropeDart',
      'contactBall',
      'buugeng',
      'dragonStaff',
      'flags',
      'gloves',
      'juggling',
      'devilSticks',
    ],
  },
];

export const KIT_GROUPS: readonly KitGroup[] = [
  ...PLACE_GROUPS,
  ...CARRIED_GROUPS,
];

export const KIT_ITEMS: readonly KitItem[] = [
  ...KIT_GROUPS.flatMap(g => [...g.items]),
  ...ANCHORS,
];

export const KIT_LABELS: Readonly<Record<KitItem, string>> = {
  floor: 'Somewhere to stand',
  mat: 'A mat or carpet',
  grass: 'Grass',
  sand: 'Sand',
  wall: 'A wall',
  doorway: 'A doorframe',
  chair: 'A sturdy chair or step',
  table: 'A table or desk edge',
  stairs: 'Stairs',
  hallway: 'A hallway',
  bench: 'A bench',
  rail: 'A railing or post',
  beam: 'A beam or log',
  mirror: 'A big mirror',
  kerb: 'A kerb',
  hill: 'A hill',
  // One hang point used to mean two very different rooms. A low bar
  // allows rows, bent-knee hangs and assisted pull-ups; a high one
  // allows everything. The program used to assume high.
  hangLow: 'Something low to hang from',
  hangHigh: 'Something high to hang from',
  frame: 'A playground frame',
  yard: 'A yard or garden',
  streets: 'Streets to walk or run',
  park: 'A park',
  stairwell: 'A stairwell',
  bricks: 'Bricks or a loaded pack',
  jugs: 'Water jugs',
  sandbag: 'A sandbag',
  ball: 'A ball',
  rope: 'A skipping rope',
  band: 'A resistance band',
  staff: 'A staff',
  doubleStaff: 'Double staffs',
  poi: 'Poi',
  hoop: 'A hoop',
  fans: 'Flow fans',
  wand: 'A levitation wand',
  ropeDart: 'A rope dart',
  contactBall: 'A contact ball',
  buugeng: 'Buugeng',
  dragonStaff: 'A dragon staff',
  flags: 'Flow flags',
  gloves: 'Light gloves',
  juggling: 'Juggling balls or clubs',
  devilSticks: 'Devil sticks',
};

/** What each one is for, when the label alone is not obvious. */
export const KIT_NOTES: Readonly<Partial<Record<KitItem, string>>> = {
  hangLow:
    'Your feet reach the ground. Rows, bent-knee hangs, assisted pull-ups.',
  hangHigh: 'You hang clear of the floor. Full hangs, leg raises, pull-ups.',
  table: 'Anything waist height and solid enough to lean on.',
  kerb: 'A step down at the roadside — calf and ankle work.',
  beam: 'Anything narrow and solid to walk along. A 2×4 on the floor counts.',
  frame: 'Monkey bars and parallel bars.',
  mirror: 'Full-length, or big enough to see yourself move in.',
  jugs: 'Full ones, with handles. About 4 kg (9 lb) each.',
  bricks: 'Or books in a backpack — anything heavy you can carry.',
  gloves: 'LED gloves — gloving needs no room at all, even at a desk.',
  staff: 'Any staff you spin: a bo, a contact staff, a light-up staff.',
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

// ─── Places ─────────────────────────────────────────────────────────────

export type PlaceKind =
  | 'room'
  | 'basement'
  | 'house'
  | 'desk'
  | 'stairwell'
  | 'yard'
  | 'porch'
  | 'park'
  | 'streets'
  | 'beach';

export interface PlaceKindSpec {
  id: PlaceKind;
  /** "A basement" — what the picker calls it. */
  name: string;
  detail: string;
  outdoor: boolean;
  /** What it is, put in by the kind and never shown as a tile. */
  anchor?: KitItem;
  /** Ticked when the place is added. A guess, for the tiles to refine. */
  starts: readonly KitItem[];
  /** The tiles its page shows. A basement never asks about sand. */
  offers: readonly KitItem[];
  /** Whether "something to hang from here?" is worth asking. */
  hangs: boolean;
  limits: readonly LimitId[];
}

export const PLACE_KINDS: readonly PlaceKindSpec[] = [
  {
    id: 'room',
    name: 'A room',
    detail: 'A bedroom, a living room, a corner with a mat.',
    outdoor: false,
    starts: ['wall', 'doorway', 'table'],
    offers: ['mat', 'wall', 'doorway', 'table', 'chair', 'mirror', 'beam'],
    hangs: true,
    limits: [],
  },
  {
    id: 'basement',
    name: 'A basement',
    detail: 'Room to move, but not upward.',
    outdoor: false,
    starts: ['wall', 'mat'],
    offers: [
      'mat',
      'wall',
      'doorway',
      'chair',
      'table',
      'stairs',
      'mirror',
      'beam',
    ],
    hangs: true,
    limits: ['lowCeiling'],
  },
  {
    id: 'house',
    name: 'The rest of the house',
    detail: 'Stairs, a hallway, the furniture.',
    outdoor: false,
    starts: ['wall', 'doorway', 'chair', 'table', 'stairs'],
    offers: [
      'stairs',
      'hallway',
      'chair',
      'table',
      'wall',
      'doorway',
      'mat',
      'mirror',
    ],
    hangs: false,
    limits: [],
  },
  {
    id: 'desk',
    name: 'A desk at work',
    detail: 'People around, not much room, nothing on the floor.',
    outdoor: false,
    starts: ['wall', 'chair', 'table'],
    offers: ['wall', 'doorway', 'chair', 'table', 'stairs', 'hallway'],
    hangs: false,
    limits: ['watched', 'tight'],
  },
  {
    id: 'stairwell',
    name: 'A stairwell',
    detail: 'Flights of stairs in a building.',
    outdoor: false,
    anchor: 'stairwell',
    starts: ['rail', 'wall'],
    offers: ['rail', 'wall'],
    hangs: false,
    limits: [],
  },
  {
    id: 'yard',
    name: 'A yard or garden',
    detail: 'Outside, with room to move.',
    outdoor: true,
    anchor: 'yard',
    starts: ['grass'],
    offers: [
      'grass',
      'sand',
      'wall',
      'bench',
      'rail',
      'beam',
      'stairs',
      'hill',
    ],
    hangs: true,
    limits: [],
  },
  {
    id: 'porch',
    name: 'A porch, deck or balcony',
    detail: 'Outside, but only a little room.',
    outdoor: true,
    starts: ['rail'],
    offers: ['rail', 'stairs', 'bench', 'chair', 'wall'],
    hangs: true,
    limits: [],
  },
  {
    id: 'park',
    name: 'A park or playground',
    detail: 'Grass, benches, maybe a frame.',
    outdoor: true,
    anchor: 'park',
    starts: ['grass', 'bench'],
    offers: [
      'grass',
      'sand',
      'bench',
      'rail',
      'beam',
      'frame',
      'stairs',
      'hill',
      'kerb',
    ],
    hangs: true,
    limits: [],
  },
  {
    id: 'streets',
    name: 'The streets',
    detail: 'Out the door: pavement, kerbs, a hill, a loop of the block.',
    outdoor: true,
    anchor: 'streets',
    starts: ['kerb'],
    offers: ['kerb', 'hill', 'stairs', 'bench', 'rail', 'wall'],
    hangs: false,
    limits: [],
  },
  {
    id: 'beach',
    name: 'A beach',
    detail: 'Sand, and plenty of it.',
    outdoor: true,
    starts: ['sand'],
    offers: ['sand', 'grass', 'bench', 'rail', 'beam', 'hill'],
    hangs: false,
    limits: [],
  },
];

const KIND_BY_ID = new Map(PLACE_KINDS.map(k => [k.id, k]));

export function placeKind(id: PlaceKind): PlaceKindSpec {
  // A kind this build does not know (a newer version wrote it) reads as a
  // room rather than taking the app down.
  return KIND_BY_ID.get(id) ?? PLACE_KINDS[0];
}

export interface TrainingPlace {
  /** Stable, so the page can say which place is open. */
  id: string;
  kind: PlaceKind;
  /** What it is called, when the person has named it. */
  name?: string;
  kit: KitItem[];
  limits: LimitId[];
}

export const placeName = (place: TrainingPlace): string =>
  place.name ?? placeKind(place.kind).name;

export interface Facts {
  /**
   * What you carry. Before places existed this was everything, and a
   * profile without `places` still reads it that way.
   */
  kit: KitItem[];
  /**
   * Where you train. Absent on a profile written before places — then
   * `kit` and `limits` are one place, as they always were.
   */
  places?: TrainingPlace[];
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
  /**
   * Limits on every place at once. The places editor never writes this —
   * limits belong to a place — but a profile from before places, and a
   * mode, can.
   */
  limits?: LimitId[];
  corrections: ('UCS' | 'APT' | 'Hourglass')[];
  heightInches?: number;
}

/**
 * The barest room the app assumes anybody has.
 *
 * A doorframe is in here rather than being claimed, because the drills
 * that need one are the *stand-ins* — the towel door row is what a room
 * without a bar gets instead of a pull-up. Requiring it to be ticked
 * would take the fallback away from exactly the room that needs it,
 * which the Phase 1 tests caught the moment it was tried.
 *
 * A table edge is here for the same reason — it is what the Hang track
 * falls back to — and both stay as tiles, for a studio with no usable
 * frame or a room with nothing waist-high.
 *
 * Flat on purpose: it is one room, and `toPlaces` turns it into one.
 */
export const DEFAULT_FACTS: Facts = {
  kit: ['floor', 'wall', 'doorway', 'table'],
  noise: 'normal',
  corrections: [],
};

// ─── What each thing opens ──────────────────────────────────────────────

/** Venues each piece of kit opens up. */
const VENUES_FOR: Readonly<Record<KitItem, readonly Venue[]>> = {
  floor: ['standing', 'desk', 'house'],
  mat: ['mat'],
  grass: ['yard'],
  sand: ['yard'],
  wall: ['wall'],
  doorway: ['wall'],
  chair: [],
  table: [],
  stairs: ['house'],
  hallway: ['house'],
  bench: [],
  rail: [],
  beam: [],
  mirror: [],
  kerb: ['neighborhood'],
  hill: [],
  // Either kind of hang point opens the porch; which drills it allows is
  // decided per drill in NEEDS, not here.
  hangLow: ['porch'],
  hangHigh: ['porch'],
  frame: ['porch'],
  yard: ['yard'],
  streets: ['neighborhood'],
  park: ['yard', 'neighborhood'],
  stairwell: ['house'],
  bricks: [],
  jugs: [],
  sandbag: [],
  ball: [],
  rope: [],
  band: [],
  staff: [],
  doubleStaff: [],
  poi: [],
  hoop: [],
  fans: [],
  wand: [],
  ropeDart: [],
  contactBall: [],
  buugeng: [],
  dragonStaff: [],
  flags: [],
  gloves: [],
  juggling: [],
  devilSticks: [],
};

/**
 * Some things are other things. A playground frame has high bars; a
 * stairwell is stairs. Letting one imply the other means a tile never
 * has to be ticked twice to mean one thing.
 */
const IMPLIES: Readonly<Partial<Record<KitItem, readonly KitItem[]>>> = {
  frame: ['hangHigh'],
  stairwell: ['stairs'],
};

/** A need: one thing, or any one of several. */
export type Need = KitItem | readonly KitItem[];

const SOFT_GROUND: readonly KitItem[] = ['grass', 'mat', 'sand'];
const ANY_LOAD: readonly KitItem[] = ['bricks', 'jugs', 'sandbag'];
/** Something at face height to tie a band round. */
const ANCHOR_POINT: readonly KitItem[] = [
  'doorway',
  'rail',
  'frame',
  'hangLow',
  'hangHigh',
];
const FLOW_TOYS: readonly KitItem[] = [
  'poi',
  'hoop',
  'fans',
  'wand',
  'ropeDart',
  'contactBall',
  'buugeng',
  'doubleStaff',
  'dragonStaff',
  'flags',
  'gloves',
  'juggling',
  'devilSticks',
];
/** Props that spin in planes — the ones a mirror can square up. */
const PLANE_PROPS: readonly KitItem[] = [
  'staff',
  'doubleStaff',
  'poi',
  'hoop',
  'fans',
  'buugeng',
  'flags',
];

/**
 * What a drill cannot be done without. Kept here rather than in the
 * library so the whole list can be reviewed at once — the same reason
 * the pictograms and the attribute mappings live in one file each.
 *
 * Only genuine requirements: a drill that merely *mentions* bricks as an
 * option (a deeper squat, a higher foot) is not listed. Shadow rope is a
 * rope you imagine, and a curb walk works on a painted line, so neither
 * is here.
 */
const NEEDS: Readonly<Record<string, readonly Need[]>> = {
  'air.brick-halo': ['bricks'],
  'earth.brick-farmer-walk': ['bricks'],
  'earth.brick-pinch': ['bricks'],
  'earth.cft-brick-lifts': ['bricks'],
  'earth.suitcase-carry': [ANY_LOAD],
  'fire.brick-pack-pullup': ['bricks', 'hangHigh'],
  // Feet-off-the-ground work needs a high point; the author's porch is
  // low, which is exactly the distinction this split exists for.
  'earth.hanging-knee-raise': ['hangHigh'],
  'earth.hanging-leg-raise': ['hangHigh'],
  'earth.hanging-tuck-hold': ['hangHigh'],
  'earth.one-arm-assisted-hang': ['hangHigh'],
  'fire.pullup-negative': ['hangHigh'],
  'fire.pullup-top-hold': ['hangHigh'],
  'fire.pullup-test': ['hangHigh'],
  // These work with your feet on the floor.
  'earth.porch-dead-hang': ['hangLow'],
  'earth.active-hang': ['hangLow'],
  'earth.grip-shifts': ['hangLow'],
  'fire.porch-pullup': ['hangLow'],
  'fire.assisted-pullup': ['hangLow'],
  'fire.scap-pull': ['hangLow'],
  'fire.inverted-row': ['hangLow'],
  'earth.table-edge-hold': ['table'],
  'fire.table-row': ['table'],
  // A towel is not kit: everybody has one, and a tile nobody would ever
  // untick is false precision. A doorframe is a real requirement.
  'fire.towel-door-row': ['doorway'],
  'fire.feet-up-towel-row': ['doorway'],
  'fire.doorframe-row': ['doorway'],
  'fire.one-arm-doorframe-row': ['doorway'],
  'fire.isometric-door-pull': ['doorway'],
  'air.doorway-pec-stretch': ['doorway'],
  'earth.stair-carry': ['bricks', 'stairs'],
  'air.stair-breath': ['stairs'],
  'earth.stair-step-up': ['stairs'],
  'earth.chair-dip': [['chair', 'bench']],
  'earth.copenhagen-plank': ['chair'],
  'earth.bulgarian-split-squat': ['chair'],
  'fire.decline-pushup': ['chair'],
  'fire.hill-sprints': ['hill'],
  'water.figure-8': ['staff'],
  'water.beat-locks': ['staff'],
  'water.sword-form-slow': ['staff'],
  'water.album-no-drop': ['staff'],
  'water.staff-combat-rounds': ['staff'],
  'air.wall-ball-catch': ['ball'],
  'water.foot-roll': ['ball'],

  // What you carry (kit/carried.ts)
  'air.band-pull-apart': ['band'],
  'air.band-face-pull': ['band', ANCHOR_POINT],
  'air.band-dislocate': [['band', 'staff']],
  'earth.banded-glute-bridge': ['band'],
  'earth.band-clamshell': ['band'],
  'earth.band-lateral-walk': ['band'],
  'fire.band-row': ['band'],
  'fire.band-pushup': ['band'],
  'fire.band-assisted-pullup': ['band', 'hangHigh'],
  'fire.skip-rope': ['rope'],
  'fire.skip-rope-intervals': ['rope'],
  'air.boxer-skip': ['rope'],
  'fire.double-under-progression': ['rope'],
  'air.ball-pec-release': ['ball', ['wall', 'doorway']],
  'water.ball-glute-release': ['ball'],
  'earth.jug-farmer-carry': ['jugs'],
  'earth.jug-goblet-squat': ['jugs'],
  'fire.jug-row': ['jugs'],
  'earth.sandbag-bear-hug-carry': ['sandbag'],
  'earth.sandbag-zercher-squat': ['sandbag'],
  'fire.sandbag-shouldering': ['sandbag'],

  // What a place has (kit/places.ts)
  'earth.bench-step-up': ['bench'],
  'earth.bench-hip-thrust': ['bench'],
  'fire.bench-jump-up': ['bench'],
  'fire.rail-row': ['rail'],
  'earth.rail-assisted-pistol': ['rail'],
  'water.rail-hamstring-stretch': ['rail'],
  'earth.beam-walk': ['beam'],
  'earth.cat-balance': [['beam', 'rail']],
  'fire.precision-jumps': [['beam', 'kerb']],
  'fire.monkey-bar-traverse': ['frame'],
  'fire.parallel-bar-dips': ['frame'],
  'earth.bar-l-sit': ['frame'],
  'fire.sand-sprints': ['sand'],
  'earth.sand-walk-barefoot': ['sand'],
  'fire.sand-broad-jumps': ['sand'],
  'fire.shoulder-roll': [SOFT_GROUND],
  'fire.breakfall': [SOFT_GROUND],
  'fire.cartwheel': [['grass', 'sand']],
  'fire.hallway-shuttles': ['hallway'],
  'earth.walking-lunges': [['hallway', 'yard', 'park', 'streets']],
  'earth.crawl-lines': [['hallway', 'yard', 'park']],
  'fire.stair-sprints': ['stairwell'],
  'fire.stair-bounds': ['stairwell'],
  'earth.heel-drops': [['kerb', 'stairs']],
  'fire.kerb-lateral-hops': ['kerb'],
  'fire.uphill-bounds': ['hill'],
  'air.hill-walk': ['hill'],

  // Flow toys (kit/flow.ts)
  'water.poi-weave': ['poi'],
  'water.poi-butterfly': ['poi'],
  'water.poi-flowers': ['poi'],
  'water.hoop-waist': ['hoop'],
  'water.hoop-isolation': ['hoop'],
  'water.hoop-flow-round': ['hoop'],
  'water.fan-reels': ['fans'],
  'water.fan-isolations': ['fans'],
  'water.wand-float': ['wand'],
  'water.wand-orbit': ['wand'],
  'water.rope-dart-wheel': ['ropeDart'],
  'water.rope-dart-wraps': ['ropeDart'],
  'water.contact-palm-spin': ['contactBall'],
  'water.contact-isolation': ['contactBall'],
  'water.contact-butterfly': ['contactBall'],
  'water.buugeng-flips': ['buugeng'],
  'water.buugeng-isolations': ['buugeng'],
  'water.double-staff-windmill': ['doubleStaff'],
  'water.double-staff-weave': ['doubleStaff'],
  'water.flow-toy-round': [FLOW_TOYS],
  'water.gloving-finger-rolls': ['gloves'],
  'water.gloving-tracing': ['gloves'],
  'water.gloving-tutting': ['gloves'],
  'water.flag-spins': ['flags'],
  'water.flag-weave': ['flags'],
  'water.dragon-staff-rolls': ['dragonStaff'],
  'water.dragon-staff-pass': ['dragonStaff'],
  'water.juggling-cascade': ['juggling'],
  'water.juggling-two-in-one': ['juggling'],
  'water.devil-stick-idle': ['devilSticks'],
  'water.devil-stick-flip': ['devilSticks'],

  // Dance combat has no prop of its own: the staff work needs a staff,
  // and anything that lands you on the ground needs somewhere soft.
  'water.staff-dance-combat-guards': ['staff'],
  'water.staff-dance-combat-spin-strike': ['staff'],
  'water.staff-dance-combat-back-pass': ['staff'],
  'water.staff-dance-combat-freestyle': ['staff'],
  'water.capoeira-negativa-role': [SOFT_GROUND],
  'water.capoeira-au': [SOFT_GROUND],
  'fire.capoeira-meia-lua-de-compasso': [SOFT_GROUND],
  'fire.tricking-tornado-kick': [SOFT_GROUND],
  'fire.tricking-pop-360': [SOFT_GROUND],
  'fire.tricking-butterfly-kick': [SOFT_GROUND],
  'fire.tricking-540-kick': [SOFT_GROUND],

  // Seeing yourself move (kit/mirror.ts)
  'air.mirror-posture-check': ['mirror'],
  'earth.mirror-squat-check': ['mirror'],
  'water.mirror-groove-check': ['mirror'],
  'water.mirror-plane-check': ['mirror', PLANE_PROPS],
  'fire.mirror-guard-check': ['mirror'],
};

/**
 * What each limit takes away, by move.
 *
 * A limit only ever subtracts. If everything in a track goes, the ladder
 * substitutes down and then the track goes quiet — the day is never
 * impossible, because that is what the day shape is for.
 */
const LIMIT_BLOCKS: Readonly<Record<LimitId, readonly MoveId[]>> = {
  // Nothing jumped, pressed overhead, or spun above the head.
  lowCeiling: ['jump', 'staff'],
  // Nothing they would hear through the floor.
  below: ['jump', 'staff', 'run'],
  // An office: nothing on the floor and nothing that looks odd.
  watched: ['jump', 'staff', 'kick', 'crunch', 'plank', 'legraise'],
  // Less than arm's length.
  tight: ['staff', 'kick', 'jump', 'run'],
  // A hard floor with no shoes.
  barefoot: ['jump', 'run'],
};

/** Venues a limit closes outright. */
const LIMIT_VENUES: Readonly<Partial<Record<LimitId, readonly Venue[]>>> = {
  watched: ['mat'],
  tight: ['mat', 'yard'],
  barefoot: ['neighborhood', 'yard'],
};

/** True when a limit rules this drill out. */
export function limited(drill: Exercise, limits: readonly LimitId[]): boolean {
  if (limits.length === 0) {
    return false;
  }
  const move = moveForExercise(drill.id);
  for (const id of limits) {
    if (move !== undefined && LIMIT_BLOCKS[id].includes(move)) {
      return true;
    }
    const closed = LIMIT_VENUES[id];
    if (closed && drill.venues.every(v => closed.includes(v))) {
      return true;
    }
  }
  return false;
}

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
  'fire.sandbag-shouldering',
  'fire.hallway-shuttles',
  'fire.stair-sprints',
]);

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

// ─── Spots: a place as the checks see it ────────────────────────────────

/** One place with everything that is true in it: its things, what you
 *  carry, what those imply, and its limits. */
interface Spot {
  kit: ReadonlySet<KitItem>;
  venues: ReadonlySet<Venue>;
  limits: readonly LimitId[];
}

function spotOf(items: Iterable<KitItem>, limits: readonly LimitId[]): Spot {
  const kit = new Set<KitItem>(['floor']);
  for (const item of items) {
    kit.add(item);
    for (const implied of IMPLIES[item] ?? []) {
      kit.add(implied);
    }
  }
  // Standing room is not something anyone has to claim.
  const venues = new Set<Venue>(['standing', 'desk', 'house']);
  for (const item of kit) {
    // A stored profile can hold an item this build has never heard of —
    // written by a newer version, or by one that named things
    // differently. Skip it rather than taking the whole app down over a
    // string.
    for (const venue of VENUES_FOR[item] ?? []) {
      venues.add(venue);
    }
  }
  return {kit, venues, limits};
}

const SPOTS = new WeakMap<Facts, readonly Spot[]>();

function spotsOf(facts: Facts): readonly Spot[] {
  const known = SPOTS.get(facts);
  if (known) {
    return known;
  }
  const everywhere = facts.limits ?? [];
  let spots: Spot[];
  if (!facts.places) {
    spots = [spotOf(facts.kit, everywhere)];
  } else if (facts.places.length === 0) {
    // Every place deleted still leaves somewhere to stand.
    spots = [spotOf(facts.kit, everywhere)];
  } else {
    spots = facts.places.map(place => {
      const anchor = placeKind(place.kind).anchor;
      return spotOf(
        [...place.kit, ...facts.kit, ...(anchor ? [anchor] : [])],
        [...(place.limits ?? []), ...everywhere],
      );
    });
  }
  SPOTS.set(facts, spots);
  return spots;
}

function needsMet(id: string, kit: ReadonlySet<KitItem>): boolean {
  return needsFor(id).every(need =>
    typeof need === 'string' ? kit.has(need) : need.some(k => kit.has(k)),
  );
}

function fits(drill: Exercise, spot: Spot): boolean {
  return (
    drill.venues.some(v => spot.venues.has(v)) &&
    needsMet(drill.id, spot.kit) &&
    !limited(drill, spot.limits)
  );
}

/** The union of venues across every place. */
export function allowedVenues(facts: Facts): Set<Venue> {
  const out = new Set<Venue>();
  for (const spot of spotsOf(facts)) {
    for (const venue of spot.venues) {
      out.add(venue);
    }
  }
  return out;
}

/** Every drill id that has a need — for the test that each one exists. */
export const neededDrillIds = (): string[] => Object.keys(NEEDS);

/** What a drill needs beyond a place to stand. */
export function needsFor(id: string): readonly Need[] {
  return NEEDS[id] ?? PATH_NEEDS.get(id) ?? [];
}

/**
 * Every move on a prop's path needs the prop, so the curricula need no
 * list of their own here — the path says which prop. Anything a move needs
 * beyond it (soft ground for an aerial) is in `NEEDS`, which wins.
 */
const PATH_NEEDS: ReadonlyMap<string, readonly Need[]> = new Map(
  DISCIPLINES.flatMap(d =>
    d.prop ? d.ids.map(id => [id, [d.prop!]] as const) : [],
  ),
);

/**
 * What stands between this person and a drill, in words: "A resistance
 * band", "Grass or a mat or carpet". Empty when nothing kit-shaped does.
 */
export function missingFor(drill: Exercise, facts: Facts): string[] {
  const have = new Set<KitItem>();
  for (const spot of spotsOf(facts)) {
    for (const item of spot.kit) {
      have.add(item);
    }
  }
  const out: string[] = [];
  for (const need of needsFor(drill.id)) {
    const options = typeof need === 'string' ? [need] : need;
    if (!options.some(k => have.has(k))) {
      out.push(options.map(k => lowerFirst(KIT_LABELS[k])).join(' or '));
    }
  }
  return out;
}

const VENUE_WORDS: Readonly<Record<Venue, string>> = {
  desk: 'a desk',
  standing: 'somewhere to stand',
  yard: 'somewhere outside with room',
  mat: 'a mat or carpet',
  wall: 'a wall',
  porch: 'something to hang from',
  house: 'a house',
  neighborhood: 'streets to walk or run',
};

/**
 * Why a drill is not available, in a few words — or undefined when it
 * is. The Library shows this under each drill it cannot offer, so the
 * reason has to be the real one: kit first, then where, then the person.
 */
export function whyNot(drill: Exercise, facts: Facts): string | undefined {
  if (canDo(drill, facts)) {
    return undefined;
  }
  const missing = missingFor(drill, facts);
  if (missing.length > 0) {
    return `Needs ${missing.join(', and ')}`;
  }
  const spots = spotsOf(facts);
  if (!spots.some(spot => drill.venues.some(v => spot.venues.has(v)))) {
    return `Needs ${drill.venues.map(v => VENUE_WORDS[v]).join(' or ')}`;
  }
  const injured = facts.injured;
  if (injured && loadsRegion(drill, injured)) {
    return `Loads your ${injured}`;
  }
  if (facts.noise === 'quiet' && isLoud(drill)) {
    return 'Too loud for where you train';
  }
  if (facts.packs && !inScope(drill.id, facts.packs)) {
    return 'In a pack you have switched off';
  }
  const blocking = new Set<LimitId>();
  for (const spot of spots) {
    for (const id of spot.limits) {
      if (limited(drill, [id])) {
        blocking.add(id);
      }
    }
  }
  if (blocking.size > 0) {
    const names = LIMITS.filter(l => blocking.has(l.id)).map(l =>
      l.label.replace(/^A /, 'a ').toLowerCase(),
    );
    return `Not with ${names.join(' or ')}`;
  }
  return 'Not where you train';
}

const lowerFirst = (s: string): string => s[0].toLowerCase() + s.slice(1);

/** Can this body, in these places, do this drill at all? */
export function canDo(
  drill: Exercise,
  facts: Facts,
  opts: {injured?: Region} = {},
): boolean {
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
  return spotsOf(facts).some(spot => fits(drill, spot));
}

/** Drills this kit can do right now. */
export function usableDrills(
  facts: Facts,
  opts: {injured?: Region} = {},
): Exercise[] {
  return EXERCISE_LIBRARY.filter(drill => canDo(drill, facts, opts));
}

const USABLE = new WeakMap<Facts, ReadonlySet<string>>();

function usableIds(facts: Facts): ReadonlySet<string> {
  const known = USABLE.get(facts);
  if (known) {
    return known;
  }
  const ids = new Set(usableDrills(facts).map(d => d.id));
  USABLE.set(facts, ids);
  return ids;
}

/**
 * How many drills a change would add. Adding kit or lifting a limit only
 * ever adds, so only drills not already usable need checking — which is
 * what keeps thirty tiles each asking this cheap enough for a phone.
 */
function gained(before: Facts, after: Facts): number {
  const had = usableIds(before);
  let n = 0;
  for (const drill of EXERCISE_LIBRARY) {
    if (!had.has(drill.id) && canDo(drill, after)) {
      n += 1;
    }
  }
  return n;
}

/**
 * How many more drills one piece of kit would unlock — the number the
 * tiles show, because "15 drills and the Pull track" teaches more than a
 * paragraph. Something you carry is asked of you; anything else of the
 * place it would go in (the first, when none is named).
 */
export function unlockCount(
  item: KitItem,
  facts: Facts,
  placeId?: string,
): number {
  return gained(facts, withItem(facts, item, true, placeId));
}

/** How many drills a limit on one place (or everywhere) takes away. */
export function limitCost(id: LimitId, facts: Facts, placeId?: string): number {
  return gained(
    withLimit(facts, id, true, placeId),
    withLimit(facts, id, false, placeId),
  );
}

/** Facts with one item added or taken away. Carried things go on you. */
export function withItem(
  facts: Facts,
  item: KitItem,
  on: boolean,
  placeId?: string,
): Facts {
  const toggle = (kit: readonly KitItem[]): KitItem[] =>
    on
      ? kit.includes(item)
        ? [...kit]
        : [...kit, item]
      : kit.filter(k => k !== item);
  if (!facts.places || isCarried(item)) {
    return {...facts, kit: toggle(facts.kit)};
  }
  const target = placeId ?? facts.places[0]?.id;
  return {
    ...facts,
    places: facts.places.map(p =>
      p.id === target ? {...p, kit: toggle(p.kit)} : p,
    ),
  };
}

/** Facts with one limit put on or lifted, on a place or everywhere. */
export function withLimit(
  facts: Facts,
  id: LimitId,
  on: boolean,
  placeId?: string,
): Facts {
  const toggle = (limits: readonly LimitId[]): LimitId[] =>
    on
      ? limits.includes(id)
        ? [...limits]
        : [...limits, id]
      : limits.filter(l => l !== id);
  if (!facts.places || placeId === undefined) {
    return {...facts, limits: toggle(facts.limits ?? [])};
  }
  return {
    ...facts,
    places: facts.places.map(p =>
      p.id === placeId ? {...p, limits: toggle(p.limits ?? [])} : p,
    ),
  };
}

// ─── Hanging, as a question ─────────────────────────────────────────────

/**
 * "Can your feet touch the ground while you hang?" is clearer than two
 * tiles called low and high, so a place is asked that instead.
 */
export type Hang = 'none' | 'low' | 'high' | 'both';

export function hangOf(place: TrainingPlace): Hang {
  const low = place.kit.includes('hangLow');
  const high = place.kit.includes('hangHigh');
  return low && high ? 'both' : low ? 'low' : high ? 'high' : 'none';
}

export function withHang(place: TrainingPlace, hang: Hang): TrainingPlace {
  const rest = place.kit.filter(k => k !== 'hangLow' && k !== 'hangHigh');
  const add: KitItem[] =
    hang === 'both'
      ? ['hangLow', 'hangHigh']
      : hang === 'low'
      ? ['hangLow']
      : hang === 'high'
      ? ['hangHigh']
      : [];
  return {...place, kit: [...rest, ...add]};
}

// ─── Adding places, and reading old profiles as places ─────────────────

/** A new place of a kind, pre-filled from its template. */
export function newPlace(
  kind: PlaceKind,
  taken: readonly TrainingPlace[],
): TrainingPlace {
  const spec = placeKind(kind);
  let n = 1;
  while (taken.some(p => p.id === `${kind}-${n}`)) {
    n += 1;
  }
  return {
    id: `${kind}-${n}`,
    kind,
    kit: [...spec.starts, ...(spec.anchor ? [spec.anchor] : [])],
    limits: [...spec.limits],
  };
}

/** Things that are only ever indoors in a flat profile. */
const INDOOR: ReadonlySet<KitItem> = new Set<KitItem>([
  'mat',
  'wall',
  'doorway',
  'chair',
  'table',
  'stairs',
  'hallway',
]);

/**
 * A profile from before places, as places — without changing what it
 * can do.
 *
 * Indoor things go in a room, and so do the old limits: every one of them
 * describes an indoor room, and leaving a low ceiling on the yard is the
 * mistake this whole model exists to stop. A yard, the streets, a park
 * and a stairwell each become a place of their own; a hang point becomes
 * a porch. A yard brings grass and the streets bring a kerb and a hill,
 * because that is what the program already assumed they had.
 */
export function toPlaces(facts: Facts): Facts {
  if (facts.places) {
    return facts;
  }
  const has = new Set(facts.kit);
  const carried = facts.kit.filter(isCarried);
  const places: TrainingPlace[] = [];
  const add = (kind: PlaceKind, kit: KitItem[], limits: LimitId[] = []) => {
    const place = newPlace(kind, places);
    const spec = placeKind(kind);
    places.push({
      ...place,
      kit: [...new Set([...(spec.anchor ? [spec.anchor] : []), ...kit])],
      limits,
    });
    return places[places.length - 1];
  };

  add(
    'room',
    facts.kit.filter(k => INDOOR.has(k)),
    [...(facts.limits ?? [])],
  );

  const outdoorLeftovers = (['grass', 'sand', 'bench', 'rail', 'beam'] as const)
    .filter(k => has.has(k))
    .map(k => k as KitItem);
  if (has.has('yard') || has.has('grass') || has.has('sand')) {
    add('yard', [
      ...(has.has('yard') ? (['grass'] as KitItem[]) : []),
      ...outdoorLeftovers,
    ]);
  } else if (outdoorLeftovers.length > 0) {
    // A bench or a rail with nowhere outside to be goes indoors.
    places[0].kit.push(...outdoorLeftovers);
  }
  const hangs = facts.kit.filter(
    k => k === 'hangLow' || k === 'hangHigh' || k === 'frame',
  );
  if (hangs.length > 0) {
    add('porch', hangs);
  }
  if (has.has('streets') || has.has('kerb') || has.has('hill')) {
    add('streets', [
      'kerb',
      ...(has.has('streets') || has.has('hill') ? (['hill'] as KitItem[]) : []),
    ]);
  }
  if (has.has('park')) {
    add('park', ['grass', 'bench']);
  }
  if (has.has('stairwell')) {
    add('stairwell', ['rail']);
  }

  return {...facts, kit: carried, places, limits: undefined};
}

/**
 * What the author has — the program as it was built.
 *
 * Written out flat, as it was before places, and turned into places the
 * same way every old profile is: so that this and a migrated install can
 * never disagree about what the author can do.
 */
export const AUTHOR_FACTS: Facts = toPlaces({
  kit: [
    'floor',
    'mat',
    'wall',
    'doorway',
    'table',
    'chair',
    'stairs',
    'hangLow',
    'hangHigh',
    'bricks',
    'staff',
    'ball',
    'yard',
    'streets',
  ],
  noise: 'free',
  corrections: ['UCS', 'APT', 'Hourglass'],
});

/**
 * The one thing that would add most, and where — for the line above the
 * tiles. Undefined when nothing adds anything.
 */
export function bestNext(
  facts: Facts,
): {item: KitItem; placeId?: string; count: number} | undefined {
  let best: {item: KitItem; placeId?: string; count: number} | undefined;
  const consider = (item: KitItem, placeId?: string) => {
    const count = unlockCount(item, facts, placeId);
    if (count > 0 && (!best || count > best.count)) {
      best = {item, placeId, count};
    }
  };
  for (const group of CARRIED_GROUPS) {
    for (const item of group.items) {
      if (!facts.kit.includes(item)) {
        consider(item);
      }
    }
  }
  for (const place of facts.places ?? []) {
    for (const item of placeKind(place.kind).offers) {
      if (!place.kit.includes(item)) {
        consider(item, place.id);
      }
    }
  }
  return best;
}
