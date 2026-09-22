import type {MoveId} from '../moves';
import type {Exercise} from '../types';
import {
  DOUBLE_STAFF_DRILLS,
  DOUBLE_STAFF_MOVES,
  STAFF_DRILLS,
  STAFF_MOVES,
} from './staff';
import {POI_DRILLS, POI_MOVES, ROPE_DART_DRILLS, ROPE_DART_MOVES} from './poi';
import {FANS_DRILLS, FANS_MOVES, HOOP_DRILLS, HOOP_MOVES} from './hoop';
import {
  BUUGENG_DRILLS,
  BUUGENG_MOVES,
  CONTACT_DRILLS,
  CONTACT_MOVES,
  WAND_DRILLS,
  WAND_MOVES,
} from './contact';
import {
  DRAGON_STAFF_DRILLS,
  DRAGON_STAFF_MOVES,
  FLAGS_DRILLS,
  FLAGS_MOVES,
  GLOVING_DRILLS,
  GLOVING_MOVES,
} from './gloving';
import {
  DEVIL_STICKS_DRILLS,
  DEVIL_STICKS_MOVES,
  JUGGLING_DRILLS,
  JUGGLING_MOVES,
} from './juggling';
import {DANCE_DRILLS, DANCE_MOVES} from './dance';
import {DANCE_COMBAT_DRILLS, DANCE_COMBAT_MOVES} from './danceCombat';

/**
 * Curricula — the flow props, dance and dance combat, each a path of
 * moves in three tiers (see `../disciplines.ts`). Every move here carries
 * a `tier`, which is also what keeps it out of chimes: these are for when
 * you pick the prop up, not for a random desk-side ping.
 */
export {
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
};

export const CURRICULUM_DRILLS: readonly Exercise[] = [
  ...STAFF_DRILLS,
  ...DOUBLE_STAFF_DRILLS,
  ...POI_DRILLS,
  ...ROPE_DART_DRILLS,
  ...HOOP_DRILLS,
  ...FANS_DRILLS,
  ...CONTACT_DRILLS,
  ...BUUGENG_DRILLS,
  ...WAND_DRILLS,
  ...GLOVING_DRILLS,
  ...FLAGS_DRILLS,
  ...DRAGON_STAFF_DRILLS,
  ...JUGGLING_DRILLS,
  ...DEVIL_STICKS_DRILLS,
  ...DANCE_DRILLS,
  ...DANCE_COMBAT_DRILLS,
];

export const CURRICULUM_MOVES: Readonly<Record<string, MoveId>> = {
  ...STAFF_MOVES,
  ...DOUBLE_STAFF_MOVES,
  ...POI_MOVES,
  ...ROPE_DART_MOVES,
  ...HOOP_MOVES,
  ...FANS_MOVES,
  ...CONTACT_MOVES,
  ...BUUGENG_MOVES,
  ...WAND_MOVES,
  ...GLOVING_MOVES,
  ...FLAGS_MOVES,
  ...DRAGON_STAFF_MOVES,
  ...JUGGLING_MOVES,
  ...DEVIL_STICKS_MOVES,
  ...DANCE_MOVES,
  ...DANCE_COMBAT_MOVES,
};
