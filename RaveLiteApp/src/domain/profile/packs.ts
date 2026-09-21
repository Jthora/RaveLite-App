/**
 * Packs — what content exists at all.
 *
 * Facts gate what the room allows, the day shape sizes it, modes override
 * it for a while. A pack is the fourth axis and the coarsest: whether a
 * whole curriculum is part of this person's app.
 *
 * The rule is narrow on purpose. **A drill in no pack is always there.**
 * The base program — push, pull, squat, plank, hinge, breath, posture,
 * stillness, mobility — belongs to everyone, and nothing here can take it
 * away. Packs only add specialisms on top: the dancing, the fighting, the
 * flow props, the tests. Turning every pack off leaves a complete program, and
 * that is the test of whether the split is honest.
 *
 * **Three packs from the plan are not here, deliberately.**
 * `hangs-pulls` and `bricks-carries` are already gated — by kit, in
 * Phase 1: no hang point means the Pull ladder substitutes, no bricks
 * means no carries. A pack over the top would be a second switch for one
 * thing, and two switches for one thing is how a settings screen starts
 * lying. `desk-fixes` is the Posture and Mobility tracks, which are base
 * — as a pack it would be nearly empty, and switching it off would mean
 * offering someone a program with no posture work, which this app should
 * not do.
 */
import {EXERCISE_LIBRARY} from '../exercises/library';
import type {Exercise} from '../exercises/types';
import type {TrackId} from '../program/types';

export type PackId =
  | 'dance'
  | 'martial'
  | 'staff'
  | 'yoga-taichi'
  | 'jumps'
  | 'military-tests'
  | 'runs';

/** A named section of a pack's curriculum, as Practice lists it. */
export interface PackGroup {
  title: string;
  ids: readonly string[];
}

export interface Pack {
  id: PackId;
  name: string;
  /** One line, second person, for the pack picker. */
  detail: string;
  /** The curriculum, in the order it should be taught. */
  groups: readonly PackGroup[];
  /** Daily Sets tracks this pack turns on. */
  tracks?: readonly TrackId[];
  /**
   * Drills the pack owns that are not part of its taught curriculum —
   * test events, runs the plan schedules rather than you practising.
   */
  extras?: readonly string[];
}

export const PACKS: readonly Pack[] = [
  {
    id: 'dance',
    name: 'Dance',
    detail: 'Steps, waves and grooves. The floor is the point.',
    groups: [
      {
        title: 'Dance',
        ids: [
          'water.body-isolations',
          'water.body-wave',
          'water.arm-wave',
          'water.two-step',
          'water.grapevine',
          'water.toprock',
          'water.house-jack',
          'water.spin-spotting',
          'water.freeze-hold',
          'water.beat-step',
          'water.groove-combo',
          'water.mirror-groove-check',
          'heart.film-and-watch',
        ],
      },
    ],
  },
  {
    id: 'martial',
    name: 'Martial basics',
    detail: 'Strikes, blocks and kicks. Fundamentals, drilled properly.',
    tracks: ['kicks'],
    groups: [
      {
        title: 'Kicks',
        ids: [
          'fire.front-kick',
          'fire.roundhouse-kick',
          'fire.side-kick',
          'fire.back-kick',
          'fire.hook-kick',
          'fire.axe-kick',
          'fire.crescent-kick',
          'fire.knee-strike',
          'fire.spin-turn-drill',
          'fire.kick-combo',
          'fire.kick-flip-foundations',
        ],
      },
      {
        title: 'Strikes and blocks',
        ids: [
          'fire.jab-cross',
          'fire.hook-uppercut',
          'fire.elbow-strikes',
          'fire.block-drill',
          'fire.parry-slip',
          'earth.stance-transitions',
          'fire.combo-flow',
          'fire.shadow-strikes',
          'fire.mirror-guard-check',
          'heart.film-and-watch',
        ],
      },
      {
        // Fighting with a staff lives here, not in Flow arts: a staff is a
        // flow prop first, and somebody who spins one for the joy of it
        // should never be handed strikes and blocks for having it.
        title: 'With a staff',
        ids: ['water.sword-form-slow', 'water.staff-combat-rounds'],
      },
    ],
  },
  {
    // The id stays 'staff' because stored profiles name it; the pack is
    // every flow prop now. Practice only lists the props you have.
    id: 'staff',
    name: 'Flow arts',
    detail:
      'Staff, poi, hoop and the rest: spins, weaves and flow. No fighting.',
    groups: [
      {
        title: 'Staff',
        ids: ['water.figure-8', 'water.beat-locks', 'water.album-no-drop'],
      },
      {
        title: 'Double staff',
        ids: ['water.double-staff-windmill', 'water.double-staff-weave'],
      },
      {
        title: 'Poi',
        ids: ['water.poi-weave', 'water.poi-butterfly', 'water.poi-flowers'],
      },
      {
        title: 'Hoop',
        ids: [
          'water.hoop-waist',
          'water.hoop-isolation',
          'water.hoop-flow-round',
        ],
      },
      {title: 'Fans', ids: ['water.fan-reels', 'water.fan-isolations']},
      {
        title: 'Levitation wand',
        ids: ['water.wand-float', 'water.wand-orbit'],
      },
      {
        title: 'Rope dart',
        ids: ['water.rope-dart-wheel', 'water.rope-dart-wraps'],
      },
      {
        title: 'Contact ball',
        ids: [
          'water.contact-palm-spin',
          'water.contact-isolation',
          'water.contact-butterfly',
        ],
      },
      {
        title: 'Buugeng',
        ids: ['water.buugeng-flips', 'water.buugeng-isolations'],
      },
      {
        title: 'Dragon staff',
        ids: ['water.dragon-staff-rolls', 'water.dragon-staff-pass'],
      },
      {title: 'Flags', ids: ['water.flag-spins', 'water.flag-weave']},
      {
        title: 'Light gloves',
        ids: [
          'water.gloving-finger-rolls',
          'water.gloving-tracing',
          'water.gloving-tutting',
        ],
      },
      {
        title: 'Juggling',
        ids: ['water.juggling-cascade', 'water.juggling-two-in-one'],
      },
      {
        title: 'Devil sticks',
        ids: ['water.devil-stick-idle', 'water.devil-stick-flip'],
      },
      {
        title: 'Any prop',
        ids: [
          'water.flow-toy-round',
          'water.mirror-plane-check',
          'heart.film-and-watch',
        ],
      },
    ],
  },
  {
    id: 'yoga-taichi',
    name: 'Yoga and tai chi',
    detail: 'Shapes held, and shapes moved through slowly.',
    tracks: ['flow'],
    groups: [
      {
        title: 'Yoga and tai chi',
        ids: [
          'water.sun-salutation',
          'water.down-dog-cobra',
          'earth.warrior-flow',
          'earth.chair-pose',
          'earth.tree-pose',
          'earth.crow-progression',
          'water.cloud-hands',
          'water.brush-knee',
          'water.grasp-sparrows-tail',
          'water.tai-chi-walk',
          'heart.standing-post',
        ],
      },
    ],
  },
  {
    id: 'jumps',
    name: 'Jumps',
    detail: 'Leaving the ground and landing well. Loud, and hard on floors.',
    groups: [
      {
        title: 'Jumps',
        ids: [
          'fire.tuck-jump',
          'fire.skater-bound',
          'fire.pogo-hops',
          'fire.broad-jump',
          'fire.vertical-jump',
          'fire.jump-squat',
        ],
      },
    ],
  },
  {
    id: 'runs',
    name: 'Running',
    detail: 'Easy miles, intervals and hills, out of the door.',
    groups: [],
    extras: [
      'fire.zone2-run',
      'fire.interval-run',
      'fire.tempo-run',
      'fire.backyard-strides',
      'fire.block-loop',
      'fire.hill-sprints',
      // The graded distances belong to both: they are the tests, and they
      // are also just runs. Whoever carries either pack can do them.
      'fire.run-1.5',
      'fire.run-2mi',
      'fire.run-3mi',
    ],
  },
  {
    id: 'military-tests',
    name: 'Military tests',
    detail: 'USAF, USSF and USMC standards, scored on the real tables.',
    groups: [],
    extras: [
      'earth.plank-test',
      'earth.cft-brick-lifts',
      'fire.pullup-test',
      'fire.cft-sprint',
      'fire.cft-maneuver',
      'fire.run-1.5',
      'fire.run-2mi',
      'fire.run-3mi',
    ],
  },
];

const BY_ID = new Map(PACKS.map(pack => [pack.id, pack]));

export const packById = (id: PackId): Pack | undefined => BY_ID.get(id);

/** Every drill a pack owns, taught or not. */
export function drillsOf(pack: Pack): readonly string[] {
  return [...pack.groups.flatMap(g => [...g.ids]), ...(pack.extras ?? [])];
}

/** drill id → the packs that own it. A drill may be in more than one. */
const OWNERS: ReadonlyMap<string, PackId[]> = (() => {
  const out = new Map<string, PackId[]>();
  for (const pack of PACKS) {
    for (const id of drillsOf(pack)) {
      out.set(id, [...(out.get(id) ?? []), pack.id]);
    }
  }
  return out;
})();

/**
 * Whether this drill exists for someone carrying `packs`. A drill no pack
 * owns is base, and always exists — that is the whole rule.
 */
export function inScope(drillId: string, packs: readonly PackId[]): boolean {
  const owners = OWNERS.get(drillId);
  return owners === undefined || owners.some(id => packs.includes(id));
}

/** The curriculum these packs teach, in pack order. */
export function groupsFor(packs: readonly PackId[]): PackGroup[] {
  return PACKS.filter(p => packs.includes(p.id)).flatMap(p => [...p.groups]);
}

/** Daily Sets tracks these packs turn on. */
export function tracksFor(packs: readonly PackId[]): TrackId[] {
  return PACKS.filter(p => packs.includes(p.id)).flatMap(p => [
    ...(p.tracks ?? []),
  ]);
}

/** Drills these packs bring, for the "+N drills" line in the picker. */
export function drillCount(id: PackId): number {
  const pack = BY_ID.get(id);
  return pack ? drillsOf(pack).length : 0;
}

/** Everything the author has on, which is everything. */
export const ALL_PACKS: readonly PackId[] = PACKS.map(p => p.id);

const LIBRARY = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));

/** Drills in scope for these packs, before the room has its say. */
export function scopedDrills(packs: readonly PackId[]): Exercise[] {
  return EXERCISE_LIBRARY.filter(drill => inScope(drill.id, packs));
}

export const packDrill = (id: string): Exercise | undefined => LIBRARY.get(id);
