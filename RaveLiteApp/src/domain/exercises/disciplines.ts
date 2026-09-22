import type {KitItem} from '../profile/kit';
import type {PackId} from '../profile/packs';
import type {ChartFamily} from '../program/charts';
import {
  BUUGENG_DRILLS,
  CONTACT_DRILLS,
  DANCE_COMBAT_DRILLS,
  DANCE_DRILLS,
  DEVIL_STICKS_DRILLS,
  DOUBLE_STAFF_DRILLS,
  DRAGON_STAFF_DRILLS,
  FANS_DRILLS,
  FLAGS_DRILLS,
  GLOVING_DRILLS,
  HOOP_DRILLS,
  JUGGLING_DRILLS,
  POI_DRILLS,
  ROPE_DART_DRILLS,
  STAFF_DRILLS,
  WAND_DRILLS,
} from './curricula';
import type {Exercise, Tier} from './types';

/**
 * Disciplines — a flow prop, dance, or dance combat, taught as a path.
 *
 * Each one is a curriculum in three tiers, easiest first, played at any
 * of five charts (see `program/charts.ts`). The moves written for the
 * author's own library before curricula existed keep their ids and their
 * places in chimes; they are slotted into the path here, at the tier
 * they belong to, ahead of the moves written for it.
 */
export type DisciplineId =
  | 'staff'
  | 'doubleStaff'
  | 'poi'
  | 'ropeDart'
  | 'hoop'
  | 'fans'
  | 'contactBall'
  | 'buugeng'
  | 'wand'
  | 'gloves'
  | 'flags'
  | 'dragonStaff'
  | 'juggling'
  | 'devilSticks'
  | 'dance'
  | 'danceCombat';

export interface Discipline {
  id: DisciplineId;
  name: string;
  family: ChartFamily;
  /** The prop it needs; dance and dance combat need none. */
  prop?: KitItem;
  /** The pack that carries it. */
  pack: PackId;
  /** Every move, basic first, easiest first within a tier. */
  ids: readonly string[];
}

export const TIERS: readonly {id: Tier; name: string}[] = [
  {id: 'basic', name: 'Basic'},
  {id: 'intermediate', name: 'Intermediate'},
  {id: 'advanced', name: 'Advanced'},
];

/**
 * Where the moves that existed before curricula sit on each path. They
 * have no `tier` field on purpose: a move with one is curriculum-only and
 * stays out of chimes, and these were in chimes first.
 */
const EXISTING: Readonly<
  Record<DisciplineId, readonly (readonly [string, Tier])[]>
> = {
  staff: [
    ['water.figure-8', 'basic'],
    ['water.beat-locks', 'intermediate'],
    ['water.album-no-drop', 'advanced'],
  ],
  doubleStaff: [
    ['water.double-staff-windmill', 'basic'],
    ['water.double-staff-weave', 'basic'],
  ],
  poi: [
    ['water.poi-weave', 'basic'],
    ['water.poi-butterfly', 'basic'],
    ['water.poi-flowers', 'intermediate'],
  ],
  ropeDart: [
    ['water.rope-dart-wheel', 'basic'],
    ['water.rope-dart-wraps', 'intermediate'],
  ],
  hoop: [
    ['water.hoop-waist', 'basic'],
    ['water.hoop-isolation', 'intermediate'],
    ['water.hoop-flow-round', 'intermediate'],
  ],
  fans: [
    ['water.fan-reels', 'basic'],
    ['water.fan-isolations', 'intermediate'],
  ],
  contactBall: [
    ['water.contact-palm-spin', 'basic'],
    ['water.contact-isolation', 'basic'],
    ['water.contact-butterfly', 'intermediate'],
  ],
  buugeng: [
    ['water.buugeng-flips', 'basic'],
    ['water.buugeng-isolations', 'intermediate'],
  ],
  wand: [
    ['water.wand-float', 'basic'],
    ['water.wand-orbit', 'intermediate'],
  ],
  gloves: [
    ['water.gloving-finger-rolls', 'basic'],
    ['water.gloving-tracing', 'basic'],
    ['water.gloving-tutting', 'intermediate'],
  ],
  flags: [
    ['water.flag-spins', 'basic'],
    ['water.flag-weave', 'basic'],
  ],
  dragonStaff: [
    ['water.dragon-staff-rolls', 'basic'],
    ['water.dragon-staff-pass', 'intermediate'],
  ],
  juggling: [
    ['water.juggling-cascade', 'basic'],
    ['water.juggling-two-in-one', 'intermediate'],
  ],
  devilSticks: [
    ['water.devil-stick-idle', 'basic'],
    ['water.devil-stick-flip', 'intermediate'],
  ],
  dance: [
    ['water.house-jack', 'basic'],
    ['water.two-step', 'basic'],
    ['water.grapevine', 'basic'],
    ['water.body-isolations', 'basic'],
    ['water.arm-wave', 'basic'],
    ['water.mirror-groove-check', 'basic'],
    ['water.body-wave', 'intermediate'],
    ['water.toprock', 'intermediate'],
    ['water.spin-spotting', 'intermediate'],
    ['water.groove-combo', 'intermediate'],
    ['water.beat-step', 'intermediate'],
    ['water.freeze-hold', 'intermediate'],
  ],
  danceCombat: [
    ['water.sword-form-slow', 'basic'],
    ['water.staff-combat-rounds', 'intermediate'],
  ],
};

const WRITTEN: Readonly<Record<DisciplineId, readonly Exercise[]>> = {
  staff: STAFF_DRILLS,
  doubleStaff: DOUBLE_STAFF_DRILLS,
  poi: POI_DRILLS,
  ropeDart: ROPE_DART_DRILLS,
  hoop: HOOP_DRILLS,
  fans: FANS_DRILLS,
  contactBall: CONTACT_DRILLS,
  buugeng: BUUGENG_DRILLS,
  wand: WAND_DRILLS,
  gloves: GLOVING_DRILLS,
  flags: FLAGS_DRILLS,
  dragonStaff: DRAGON_STAFF_DRILLS,
  juggling: JUGGLING_DRILLS,
  devilSticks: DEVIL_STICKS_DRILLS,
  dance: DANCE_DRILLS,
  danceCombat: DANCE_COMBAT_DRILLS,
};

const SPECS: readonly Omit<Discipline, 'ids'>[] = [
  {id: 'staff', name: 'Staff', family: 'flow', prop: 'staff', pack: 'staff'},
  {
    id: 'doubleStaff',
    name: 'Double staff',
    family: 'flow',
    prop: 'doubleStaff',
    pack: 'staff',
  },
  {id: 'poi', name: 'Poi', family: 'flow', prop: 'poi', pack: 'staff'},
  {
    id: 'ropeDart',
    name: 'Rope dart',
    family: 'flow',
    prop: 'ropeDart',
    pack: 'staff',
  },
  {id: 'hoop', name: 'Hoop', family: 'flow', prop: 'hoop', pack: 'staff'},
  {id: 'fans', name: 'Fans', family: 'flow', prop: 'fans', pack: 'staff'},
  {
    id: 'contactBall',
    name: 'Contact ball',
    family: 'flow',
    prop: 'contactBall',
    pack: 'staff',
  },
  {
    id: 'buugeng',
    name: 'Buugeng',
    family: 'flow',
    prop: 'buugeng',
    pack: 'staff',
  },
  {
    id: 'wand',
    name: 'Levitation wand',
    family: 'flow',
    prop: 'wand',
    pack: 'staff',
  },
  {
    id: 'gloves',
    name: 'Light gloves',
    family: 'flow',
    prop: 'gloves',
    pack: 'staff',
  },
  {id: 'flags', name: 'Flags', family: 'flow', prop: 'flags', pack: 'staff'},
  {
    id: 'dragonStaff',
    name: 'Dragon staff',
    family: 'flow',
    prop: 'dragonStaff',
    pack: 'staff',
  },
  {
    id: 'juggling',
    name: 'Juggling',
    family: 'flow',
    prop: 'juggling',
    pack: 'staff',
  },
  {
    id: 'devilSticks',
    name: 'Devil sticks',
    family: 'flow',
    prop: 'devilSticks',
    pack: 'staff',
  },
  {id: 'dance', name: 'Dance', family: 'dance', pack: 'dance'},
  {
    id: 'danceCombat',
    name: 'Dance combat',
    family: 'danceCombat',
    pack: 'dance-combat',
  },
];

const TIER_ORDER: readonly Tier[] = ['basic', 'intermediate', 'advanced'];

/** The existing moves at a tier, then the written ones. */
function path(id: DisciplineId): string[] {
  return TIER_ORDER.flatMap(tier => [
    ...EXISTING[id].filter(([, t]) => t === tier).map(([drill]) => drill),
    ...WRITTEN[id].filter(d => d.tier === tier).map(d => d.id),
  ]);
}

export const DISCIPLINES: readonly Discipline[] = SPECS.map(spec => ({
  ...spec,
  ids: path(spec.id),
}));

const BY_ID = new Map(DISCIPLINES.map(d => [d.id, d]));

export const disciplineById = (id: DisciplineId): Discipline | undefined =>
  BY_ID.get(id);

const TIER_OF = new Map<string, Tier>([
  ...Object.values(EXISTING).flatMap(list =>
    list.map(([drill, tier]) => [drill, tier] as const),
  ),
  ...Object.values(WRITTEN).flatMap(list =>
    list.map(d => [d.id, d.tier ?? 'basic'] as const),
  ),
]);

/** A move's tier on its path, or undefined for anything not on one. */
export const tierOf = (drillId: string): Tier | undefined =>
  TIER_OF.get(drillId);

const DISCIPLINE_OF = new Map<string, DisciplineId>(
  DISCIPLINES.flatMap(d => d.ids.map(id => [id, d.id] as const)),
);

/** Which path a move is on, if any. */
export const disciplineOf = (drillId: string): DisciplineId | undefined =>
  DISCIPLINE_OF.get(drillId);
