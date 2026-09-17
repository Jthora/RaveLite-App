import type {ActivityItem} from '../activity/activity';
import {EXERCISE_LIBRARY} from '../exercises/library';
import type {Target} from '../exercises/types';
import type {TrackId} from '../program/types';
import type {ElementId} from '../../theme/elements';
import type {AttributeId} from './attributes';

/**
 * What every kind of work feeds.
 *
 * Nothing is assigned by hand: each thing done hands its effort points to
 * one or two attributes. A pair is `[leads, rides along]` — the second
 * takes half. The lookup goes, in order:
 *
 *   1. a Train-log metric — the thing measured says what it trained;
 *   2. a named drill, where the tags alone would get it wrong;
 *   3. the Daily Sets track the set belongs to;
 *   4. the drill's tags, in the order below;
 *   5. its element, so nothing done is ever worth nothing.
 *
 * The tag order matters: a drill is usually tagged three or four ways, and
 * the first tag that matches wins. Grip and Core sit above Strength
 * because a hang is a hold; a run's Conditioning beats everything because
 * that is what a run is.
 */

export interface Trained {
  id: AttributeId;
  /** Share of the item's effort points: 1 for the lead, 0.5 for the rider. */
  share: number;
}

type Pair = readonly [AttributeId] | readonly [AttributeId, AttributeId];

/** A Daily Sets track's own work. */
const TRACK_ATTRS: Record<TrackId, Pair> = {
  push: ['strength', 'power'],
  'push-variants': ['strength', 'power'],
  row: ['strength'],
  pull: ['strength', 'toughness'],
  squat: ['strength', 'power'],
  'legs-up': ['toughness'],
  crunch: ['toughness'],
  side: ['toughness'],
  plank: ['toughness'],
  hang: ['toughness', 'strength'],
  posture: ['breath', 'awareness'],
  breath: ['breath'],
  mobility: ['mobility'],
  stillness: ['focus'],
  pelvis: ['strength', 'mobility'],
  kicks: ['mobility', 'agility'],
};

/** Drills whose tags would land them in the wrong seat. */
const EXERCISE_ATTRS: Record<string, Pair> = {
  // Air — the eye break is the only Awareness work in an ordinary day.
  'air.eye-break': ['awareness'],
  'air.long-walk': ['recovery', 'breath'],
  'air.nasal-recovery-walk': ['recovery', 'breath'],
  'air.shadow-rope': ['agility', 'stamina'],
  'air.leg-swings': ['mobility', 'agility'],
  // Earth — holds are Toughness, loaded moves are Strength.
  'earth.wall-sit': ['toughness'],
  'earth.horse-stance': ['toughness', 'balance'],
  'earth.porch-dead-hang': ['toughness', 'strength'],
  'earth.active-hang': ['toughness', 'strength'],
  'earth.one-arm-assisted-hang': ['toughness', 'strength'],
  'earth.brick-pinch': ['toughness', 'strength'],
  'earth.single-leg-balance': ['balance'],
  'earth.standing-hip-airplane': ['balance', 'strength'],
  'earth.pause-squat': ['strength'],
  'earth.split-squat': ['strength', 'balance'],
  'earth.bulgarian-split-squat': ['strength', 'balance'],
  'earth.shrimp-squat': ['strength', 'balance'],
  'earth.cossack-squat': ['strength', 'mobility'],
  'earth.cft-brick-lifts': ['strength', 'stamina'],
  // Fire — explosive work is Power, pace work is Speed.
  'fire.jump-squat': ['power', 'agility'],
  'fire.burpee': ['power', 'stamina'],
  'fire.kick-flow': ['agility', 'power'],
  'fire.kick-flip-foundations': ['agility', 'power'],
  'fire.backyard-strides': ['speed', 'stamina'],
  'fire.interval-run': ['speed', 'stamina'],
  'fire.tempo-run': ['stamina', 'speed'],
  'fire.cft-sprint': ['speed', 'stamina'],
  'fire.cft-maneuver': ['power', 'stamina'],
  'fire.situps': ['toughness', 'strength'],
  // Water — flow is in the hands; a stretch is range however it's tagged.
  'water.beat-step': ['agility', 'dexterity'],
  'water.staff-combat-rounds': ['dexterity', 'stamina'],
  'water.worlds-greatest-stretch': ['mobility'],
  'water.front-split-progression': ['mobility'],
  'water.side-split-progression': ['mobility'],
  // Core — every heart drill is tagged Presence; most of them aren't.
  'heart.morning-intent': ['resolve'],
  'heart.fuel-check': ['resolve'],
  'heart.evening-review': ['focus', 'resolve'],
  'heart.still-sit': ['focus'],
  'heart.single-point-focus': ['focus'],
  'heart.pulse-check': ['recovery', 'focus'],
  'heart.mirror-presence': ['presence'],
  'heart.rave-vision': ['presence'],
  // The mat, the backyard, the neighborhood and the house.
  'air.listening-walk': ['awareness', 'recovery'],
  'air.ruler-drop': ['awareness'],
  'air.wall-ball-catch': ['awareness', 'agility'],
  'air.stair-breath': ['breath', 'stamina'],
  'earth.curb-walk': ['balance'],
  'earth.stair-step-up': ['strength', 'balance'],
  'earth.stair-carry': ['toughness', 'strength'],
  'earth.chair-dip': ['strength'],
  'earth.bear-crawl': ['toughness', 'strength'],
  'fire.hill-sprints': ['power', 'speed'],
  'fire.block-loop': ['stamina'],
  'fire.shadow-strikes': ['speed', 'agility'],
  'fire.broad-jump': ['power'],
  'water.juggle-toss': ['dexterity'],
  'water.off-hand-task': ['dexterity'],
  'water.legs-up-the-wall': ['recovery'],
  'water.foot-roll': ['mobility', 'recovery'],
  'water.hip-cars': ['mobility'],
  'water.shoulder-cars': ['mobility'],
  'heart.voice-work': ['presence'],
  'heart.teach-a-move': ['presence'],
  'heart.dawn-sit': ['focus', 'resolve'],
};

/** What a measured thing says you trained. */
const METRIC_ATTRS: Record<string, Pair> = {
  'builtin.run-3mi': ['stamina'],
  'builtin.run-2mi': ['stamina'],
  'builtin.run-1.5mi': ['stamina', 'speed'],
  'builtin.run-custom': ['stamina'],
  'builtin.pushups-amrap': ['strength'],
  'builtin.pushups-2min': ['strength', 'stamina'],
  'builtin.pushups-1min': ['strength', 'stamina'],
  'builtin.situps-2min': ['toughness', 'strength'],
  'builtin.situps-1min': ['toughness', 'strength'],
  'builtin.pullups-amrap': ['strength', 'toughness'],
  'builtin.burpees-2min': ['power', 'stamina'],
  'builtin.cft-mtc': ['speed', 'stamina'],
  'builtin.cft-acl': ['strength', 'stamina'],
  'builtin.cft-manuf': ['power', 'agility'],
  'builtin.breath-hold': ['breath'],
  'builtin.exhale-hold': ['breath'],
  'builtin.box-breath-2min': ['breath', 'focus'],
  'builtin.skipping-2min': ['agility'],
  'builtin.crunches-2min': ['toughness'],
  'builtin.leg-hipup': ['toughness'],
  'builtin.side-ups-amrap': ['toughness'],
  'builtin.squats-amrap': ['strength'],
  'builtin.plank': ['toughness'],
  'builtin.side-plank': ['toughness'],
  'builtin.deadhang': ['toughness', 'strength'],
  'builtin.wall-sit': ['toughness'],
  'builtin.farmer-carry': ['toughness', 'strength'],
  'builtin.weighted-carry-time': ['toughness', 'strength'],
  'builtin.balance-hold': ['balance'],
  'builtin.still-sit': ['focus'],
  'builtin.flow-no-drop': ['dexterity'],
  'builtin.flow-hold': ['mobility'],
  'builtin.deep-squat-hold': ['mobility'],
  'builtin.shoulder-cars': ['mobility'],
  'builtin.hip-cars': ['mobility'],
  'builtin.staff-session': ['dexterity', 'presence'],
  'builtin.bike-ride': ['stamina', 'recovery'],
  'builtin.ruck': ['toughness', 'strength'],
  'builtin.walk-session': ['recovery', 'breath'],
  'builtin.yoga-video': ['mobility', 'breath'],
  'builtin.tai-chi-video': ['balance', 'presence'],
  'builtin.quiet-cardio-video': ['stamina', 'agility'],
};

/** First tag that matches wins. */
const TAG_ATTRS: readonly (readonly [Target, AttributeId])[] = [
  ['Hydration', 'recovery'],
  ['Fuel', 'resolve'],
  ['PFT-Run', 'stamina'],
  ['Conditioning', 'stamina'],
  ['Grip', 'toughness'],
  ['Core', 'toughness'],
  ['Flow', 'dexterity'],
  ['Agility', 'agility'],
  ['Coordination', 'dexterity'],
  ['Mobility', 'mobility'],
  ['Breath', 'breath'],
  ['Presence', 'presence'],
  ['PFT-Pushups', 'strength'],
  ['PFT-Situps', 'toughness'],
  ['Strength', 'strength'],
  ['UCS', 'mobility'],
  ['Hourglass', 'breath'],
  ['APT', 'strength'],
];

/** Nothing done is worth nothing: an unmapped drill feeds its element. */
const ELEMENT_ATTRS: Record<ElementId, AttributeId> = {
  fire: 'stamina',
  air: 'breath',
  earth: 'strength',
  water: 'mobility',
  heart: 'focus',
};

const EXERCISES = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));

/** What a drill trains, on its own or as a set on a track. */
export function attributesForDrill(
  exerciseId: string | undefined,
  trackId?: TrackId,
): readonly AttributeId[] {
  if (exerciseId && EXERCISE_ATTRS[exerciseId]) {
    return EXERCISE_ATTRS[exerciseId];
  }
  if (trackId && TRACK_ATTRS[trackId]) {
    return TRACK_ATTRS[trackId];
  }
  const exercise = exerciseId ? EXERCISES.get(exerciseId) : undefined;
  if (exercise) {
    for (const [tag, id] of TAG_ATTRS) {
      if (exercise.targets.includes(tag)) {
        return [id];
      }
    }
    return [ELEMENT_ATTRS[exercise.element]];
  }
  return [];
}

function pairFor(item: ActivityItem): Pair {
  if (item.kindId && METRIC_ATTRS[item.kindId]) {
    return METRIC_ATTRS[item.kindId];
  }
  if (item.exerciseId && EXERCISE_ATTRS[item.exerciseId]) {
    return EXERCISE_ATTRS[item.exerciseId];
  }
  if (item.trackId && TRACK_ATTRS[item.trackId as TrackId]) {
    return TRACK_ATTRS[item.trackId as TrackId];
  }
  if (item.hydration) {
    return ['recovery'];
  }
  const exercise = item.exerciseId ? EXERCISES.get(item.exerciseId) : undefined;
  if (exercise) {
    for (const [tag, id] of TAG_ATTRS) {
      if (exercise.targets.includes(tag)) {
        return [id];
      }
    }
  }
  return [ELEMENT_ATTRS[item.element]];
}

/** The attributes one thing done feeds, and each one's share of its points. */
export function attributesForItem(item: ActivityItem): Trained[] {
  const [lead, rider] = pairFor(item);
  return rider
    ? [
        {id: lead, share: 1},
        {id: rider, share: 0.5},
      ]
    : [{id: lead, share: 1}];
}

/** Raw XP per attribute from a day's — or a week's — activity. */
export function xpFromActivity(
  items: readonly ActivityItem[],
): Partial<Record<AttributeId, number>> {
  const out: Partial<Record<AttributeId, number>> = {};
  for (const item of items) {
    for (const {id, share} of attributesForItem(item)) {
      out[id] = (out[id] ?? 0) + item.points * share;
    }
  }
  return out;
}
