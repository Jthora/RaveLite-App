import type {Exercise} from '../exercises/types';
import {disciplineOf, type DisciplineId} from '../exercises/disciplines';
import {moveForExercise, type MoveId} from '../exercises/moves';
import type {KitItem, Region} from './kit';

/**
 * Which parts of the body a drill loads, for hurt mode.
 *
 * Hurt mode used to guess from the move type alone, and missed a lot: a
 * hurt shoulder still got brick halos and every spinning prop, a hurt
 * wrist still got crow pose, down dog and cartwheels, and there was no
 * neck. Now five things are read together, and a drill loads a part if
 * any one of them says so:
 *
 *   1. what the drill says itself (`Exercise.loads`), when it says it;
 *   2. its move type (`BY_MOVE`);
 *   3. its discipline, for the practice paths (`BY_DISCIPLINE`);
 *   4. the kit it needs — a hang point loads the shoulders, a flow prop
 *      the arms (`BY_NEED`);
 *   5. the drill's own stop lines: "stop if the neck hurts" was written
 *      by whoever wrote the drill, so it is the plainest signal there is;
 *
 * plus `BY_DRILL`, the drills the rest still miss. Erring wide is the
 * point: skipping a drill that would have been fine costs a drill, and
 * loading an injury costs weeks. `loads.test.ts` fails for any drill that
 * moves the body but loads nothing.
 */

const UPPER: readonly Region[] = ['shoulder', 'elbow', 'wrist'];
const LEGS: readonly Region[] = ['hip', 'knee', 'ankle'];

const BY_MOVE: Readonly<Partial<Record<MoveId, readonly Region[]>>> = {
  push: UPPER,
  pull: [...UPPER, 'back'],
  row: [...UPPER, 'back'],
  hang: UPPER,
  squat: LEGS,
  lunge: LEGS,
  wallsit: ['hip', 'knee'],
  plank: [...UPPER, 'back'],
  sideplank: [...UPPER, 'back', 'hip'],
  crunch: ['back', 'neck'],
  legraise: ['back', 'hip'],
  bridge: ['back', 'hip'],
  balance: LEGS,
  carry: [...UPPER, 'back'],
  run: LEGS,
  walk: ['ankle'],
  jump: [...LEGS, 'back'],
  kick: [...LEGS, 'back'],
  posture: ['neck', 'shoulder'],
  chestopener: ['shoulder'],
  hipopener: ['hip', 'knee'],
  hamstring: ['back', 'hip'],
  staff: UPPER,
  footwork: ['knee', 'ankle'],
};

const BY_DISCIPLINE: Readonly<Record<DisciplineId, readonly Region[]>> = {
  staff: UPPER,
  doubleStaff: UPPER,
  dragonStaff: [...UPPER, 'back'],
  poi: UPPER,
  ropeDart: UPPER,
  hoop: [...UPPER, 'back', 'hip'],
  fans: UPPER,
  contactBall: UPPER,
  buugeng: UPPER,
  wand: UPPER,
  gloves: ['wrist'],
  flags: UPPER,
  juggling: UPPER,
  devilSticks: UPPER,
  dance: [...LEGS, 'back'],
  danceCombat: [...UPPER, 'back', ...LEGS],
};

const BY_NEED: Readonly<Partial<Record<KitItem, readonly Region[]>>> = {
  hangLow: UPPER,
  hangHigh: UPPER,
  frame: UPPER,
  bricks: [...UPPER, 'back'],
  jugs: [...UPPER, 'back'],
  sandbag: [...UPPER, 'back'],
  band: ['shoulder', 'elbow'],
  rope: ['knee', 'ankle'],
  stairs: ['knee', 'ankle'],
  hill: LEGS,
  kerb: ['knee', 'ankle'],
  beam: LEGS,
  staff: UPPER,
  doubleStaff: UPPER,
  dragonStaff: [...UPPER, 'back'],
  poi: UPPER,
  hoop: [...UPPER, 'back', 'hip'],
  fans: UPPER,
  wand: UPPER,
  ropeDart: UPPER,
  contactBall: UPPER,
  buugeng: UPPER,
  flags: UPPER,
  gloves: ['wrist'],
  juggling: UPPER,
  devilSticks: UPPER,
};

/** Drills the signals above still miss. */
const BY_DRILL: Readonly<Record<string, readonly Region[]>> = {
  'air.brick-halo': ['shoulder', 'neck', 'wrist'],
  'earth.crow-progression': [...UPPER, 'neck'],
  'water.down-dog-cobra': [...UPPER, 'back'],
  'water.sun-salutation': [...UPPER, 'back', 'hip'],
  'fire.cartwheel': [...UPPER, 'neck', ...LEGS],
  'fire.kick-flip-foundations': [...UPPER, 'neck', 'back', ...LEGS],
  'fire.shoulder-roll': ['shoulder', 'neck', 'back'],
  'water.freeze-hold': [...UPPER, 'neck'],
  'water.breaking-baby-freeze': [...UPPER, 'neck'],
  'water.capoeira-au': [...UPPER, 'neck', ...LEGS],
  'water.capoeira-negativa-role': [...UPPER, 'neck', 'back'],
  'water.contact-head-roll': ['neck', 'shoulder'],
  'water.contact-neck-roll': ['neck', 'shoulder'],
  'water.dragon-staff-neck-roll': ['neck', ...UPPER, 'back'],
  'water.rope-dart-neck-wrap': ['neck', ...UPPER],
  'water.staff-halo-roll': ['neck', ...UPPER],
  'water.devil-stick-leg-roll': [...UPPER, ...LEGS],
  'water.rope-dart-foot-launch': [...UPPER, ...LEGS],
  'fire.jab-cross': ['shoulder', 'elbow', 'wrist', 'back'],
  'fire.hook-uppercut': ['shoulder', 'elbow', 'wrist', 'back'],
  'fire.elbow-strikes': ['shoulder', 'elbow', 'back'],
  'fire.block-drill': ['shoulder', 'elbow', 'wrist'],
  'water.body-isolations': ['neck', 'shoulder', 'back', 'hip'],
  'water.body-wave': ['neck', 'back', 'hip', 'knee'],
  'water.arm-wave': ['shoulder', 'elbow', 'wrist'],
  'water.side-line-stretch': ['shoulder', 'back', 'hip'],
  'water.juggle-toss': UPPER,
  'water.off-hand-task': ['wrist'],
  'water.foot-roll': ['ankle'],
  'water.cloud-hands': ['shoulder', 'back', 'hip', 'knee'],
  'water.grasp-sparrows-tail': ['shoulder', 'back', 'hip', 'knee'],
  'fire.breakfall': ['neck', 'shoulder', 'wrist', 'back', 'hip'],
};

const PARTS: ReadonlyArray<[Region, RegExp]> = [
  ['neck', /\bneck\b/i],
  ['shoulder', /\bshoulders?\b/i],
  ['elbow', /\belbows?\b/i],
  ['wrist', /\bwrists?\b/i],
  ['back', /\blower back\b/i],
  ['hip', /\bhips?\b/i],
  ['knee', /\bknees?\b/i],
  ['ankle', /\bankles?\b/i],
];

/** A cue that names a part to stop for: "stop if a wrist hurts". */
const STOP_FOR =
  /\bstop\b[^;]*\b(if|when|before)\b|\bhurts?\b|\bache|\bnever force\b|\bpain\b/i;

function fromStopLines(cues: readonly string[] | undefined): Region[] {
  const out: Region[] = [];
  for (const cue of cues ?? []) {
    if (!STOP_FOR.test(cue)) {
      continue;
    }
    for (const [region, word] of PARTS) {
      if (word.test(cue)) {
        out.push(region);
      }
    }
  }
  return out;
}

/**
 * Everything a drill loads. `needs` is what the drill needs beyond a
 * place to stand (`kit.needsFor`), passed in so this file needs no kit.
 */
export function regionsOf(
  drill: Exercise,
  needs: readonly (KitItem | readonly KitItem[])[],
): ReadonlySet<Region> {
  const out = new Set<Region>(drill.loads ?? []);
  const add = (regions: readonly Region[] | undefined) =>
    regions?.forEach(r => out.add(r));
  const move = moveForExercise(drill.id);
  add(move ? BY_MOVE[move] : undefined);
  const discipline = disciplineOf(drill.id);
  add(discipline ? BY_DISCIPLINE[discipline] : undefined);
  for (const need of needs) {
    for (const item of typeof need === 'string' ? [need] : need) {
      add(BY_NEED[item]);
    }
  }
  add(BY_DRILL[drill.id]);
  add(fromStopLines(drill.cues));
  return out;
}
