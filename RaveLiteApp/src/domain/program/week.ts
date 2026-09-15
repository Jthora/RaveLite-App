import type {ElementId} from '../../theme/elements';
import type {TrackId, TrackPartner} from './types';

/**
 * The focus wheel — pure. Which attributes each day leans on, the morning
 * block that trains them, and the Saturday test.
 *
 * Fifteen attributes, three per element. Six are the daily core and come
 * from every day's rounds: Strength and Toughness (push, pull, squat, the
 * trunk and hangs), Breath, Awareness (posture), Focus (stillness) and
 * Resolve (answering the chimes). The other nine rotate, each twice a
 * week and never more than four days apart, so today isn't yesterday.
 *
 * Sweat lives in the morning block, before the shower: Power, Speed,
 * Stamina, Agility and Dexterity train there. The daytime rounds stay dry:
 * a focus day adds a set to its dry track (Mobility, Stillness or Breath)
 * and ends every second round with a focus partner (a hip opener, a
 * balance, a presence drill).
 *
 * Saturdays rotate with the 4-week block: the Air Force test, the Marine
 * PFT, the Marine combat fitness test, then max tests in the deload week.
 */

export type AttributeId =
  | 'power'
  | 'stamina'
  | 'speed'
  | 'awareness'
  | 'breath'
  | 'agility'
  | 'resolve'
  | 'focus'
  | 'presence'
  | 'strength'
  | 'toughness'
  | 'balance'
  | 'dexterity'
  | 'mobility'
  | 'recovery';

export interface Attribute {
  id: AttributeId;
  name: string;
  element: ElementId;
}

/** In the balance strip's element order. */
export const ATTRIBUTES: readonly Attribute[] = [
  {id: 'power', name: 'Power', element: 'fire'},
  {id: 'stamina', name: 'Stamina', element: 'fire'},
  {id: 'speed', name: 'Speed', element: 'fire'},
  {id: 'awareness', name: 'Awareness', element: 'air'},
  {id: 'breath', name: 'Breath', element: 'air'},
  {id: 'agility', name: 'Agility', element: 'air'},
  {id: 'resolve', name: 'Resolve', element: 'heart'},
  {id: 'focus', name: 'Focus', element: 'heart'},
  {id: 'presence', name: 'Presence', element: 'heart'},
  {id: 'strength', name: 'Strength', element: 'earth'},
  {id: 'toughness', name: 'Toughness', element: 'earth'},
  {id: 'balance', name: 'Balance', element: 'earth'},
  {id: 'dexterity', name: 'Dexterity', element: 'water'},
  {id: 'mobility', name: 'Mobility', element: 'water'},
  {id: 'recovery', name: 'Recovery', element: 'water'},
];

export function attributeById(id: AttributeId): Attribute {
  return ATTRIBUTES.find(a => a.id === id)!;
}

/** Trained by every day's rounds, so never a day's focus. */
export const DAILY_CORE: readonly AttributeId[] = [
  'strength',
  'toughness',
  'breath',
  'awareness',
  'focus',
  'resolve',
];

export interface MorningBlock {
  title: string;
  /** Library drill ids, one per morning chime, in order. */
  pieces: readonly string[];
}

export type SaturdayTestId = 'usaf' | 'usmc-pft' | 'usmc-cft' | 'max';

export interface SaturdayTest {
  id: SaturdayTestId;
  name: string;
  /** Standards events it tests (`STANDARD_EVENTS` ids). */
  events: readonly string[];
  block: MorningBlock;
}

export const SATURDAY_TESTS: Readonly<Record<SaturdayTestId, SaturdayTest>> = {
  usaf: {
    id: 'usaf',
    name: 'Air Force test',
    events: ['pushups-1min', 'situps-1min', 'run-2mi'],
    block: {
      title: 'Air Force test',
      pieces: ['fire.pushups', 'fire.situps', 'fire.run-2mi'],
    },
  },
  'usmc-pft': {
    id: 'usmc-pft',
    name: 'Marine PFT',
    events: ['pullups', 'plank', 'run-3mi'],
    block: {
      title: 'Marine PFT',
      pieces: ['fire.pullup-test', 'earth.plank-test', 'fire.run-3mi'],
    },
  },
  'usmc-cft': {
    id: 'usmc-cft',
    name: 'Marine CFT',
    events: ['cft-mtc', 'cft-acl', 'cft-manuf'],
    block: {
      title: 'Marine CFT',
      pieces: ['fire.cft-sprint', 'earth.cft-brick-lifts', 'fire.cft-maneuver'],
    },
  },
  max: {
    id: 'max',
    name: 'Max tests',
    events: [],
    block: {
      title: 'Strides and an easy run',
      pieces: ['fire.backyard-strides', 'fire.zone2-run', 'water.pigeon'],
    },
  },
};

/** Saturday tests in block order; the last lands on the deload week. */
export const TEST_ROTATION: readonly SaturdayTestId[] = [
  'usaf',
  'usmc-pft',
  'usmc-cft',
  'max',
];

/** This program week's Saturday test. */
export function testForWeek(week: number): SaturdayTestId {
  return TEST_ROTATION[(Math.max(1, week) - 1) % TEST_ROTATION.length];
}

export interface WheelDay {
  focus: readonly AttributeId[];
  /** Saturday's block comes from its test. */
  block?: MorningBlock;
}

/** By JS `getDay()`: 0 = Sunday. */
export const FOCUS_WHEEL: readonly WheelDay[] = [
  {
    focus: ['recovery', 'agility'],
    block: {
      title: 'Long walk and light skips',
      pieces: ['air.long-walk', 'air.shadow-rope', 'water.frog-stretch'],
    },
  },
  {
    focus: ['power', 'mobility', 'presence'],
    block: {
      title: 'Kicks and jumps',
      pieces: [
        'fire.kick-flip-foundations',
        'fire.jump-squat',
        'water.front-split-progression',
      ],
    },
  },
  {
    focus: ['speed', 'dexterity', 'balance'],
    block: {
      title: 'Strides and staff',
      pieces: [
        'fire.backyard-strides',
        'water.staff-combat-rounds',
        'earth.standing-hip-airplane',
      ],
    },
  },
  {
    focus: ['stamina', 'recovery'],
    block: {
      title: 'Easy run',
      pieces: [
        'fire.zone2-run',
        'air.nasal-recovery-walk',
        'water.calf-wall-stretch',
      ],
    },
  },
  {
    focus: ['agility', 'mobility', 'presence'],
    block: {
      title: 'Footwork and flow',
      pieces: ['water.beat-step', 'water.beat-locks', 'water.pancake-reach'],
    },
  },
  {
    focus: ['power', 'dexterity', 'balance'],
    block: {
      title: 'Bricks and staff',
      pieces: [
        'fire.fire-rounds',
        'earth.brick-farmer-walk',
        'water.staff-combat-rounds',
      ],
    },
  },
  {focus: ['stamina', 'speed']},
];

/** The dry track a focus day gives one more set. */
export const FOCUS_TRACK: Readonly<Partial<Record<AttributeId, TrackId>>> = {
  mobility: 'mobility',
  presence: 'stillness',
  recovery: 'breath',
};

/** Dry partner drills for focus rounds; sweaty focus waits for the morning. */
export const FOCUS_PARTNERS: Readonly<
  Partial<Record<AttributeId, readonly TrackPartner[]>>
> = {
  mobility: [
    {exerciseId: 'water.deep-squat-hold', seconds: 30},
    {exerciseId: 'earth.couch-stretch', seconds: 60},
  ],
  balance: [
    {exerciseId: 'earth.single-leg-balance', seconds: 30},
    {exerciseId: 'earth.standing-hip-airplane', seconds: 30},
    {exerciseId: 'earth.horse-stance', seconds: 45},
  ],
  presence: [
    {exerciseId: 'heart.rave-vision', seconds: 30},
    {exerciseId: 'heart.mirror-presence', seconds: 30},
  ],
  recovery: [
    {exerciseId: 'air.coherence-breath', seconds: 60},
    {exerciseId: 'water.calf-wall-stretch', seconds: 30},
  ],
  agility: [{exerciseId: 'earth.cossack-squat', seconds: 30}],
};

export interface DayFocus {
  /** JS `getDay()`. */
  weekday: number;
  focus: readonly AttributeId[];
  block: MorningBlock;
  /** Saturdays: this week's test. */
  test?: SaturdayTest;
}

/** The focus, morning block and any test for `date` in program `week`. */
export function dayFocus(date: Date, week: number): DayFocus {
  const weekday = date.getDay();
  const day = FOCUS_WHEEL[weekday];
  const test = weekday === 6 ? SATURDAY_TESTS[testForWeek(week)] : undefined;
  return {
    weekday,
    focus: day.focus,
    block: test?.block ?? day.block ?? SATURDAY_TESTS.max.block,
    ...(test ? {test} : {}),
  };
}

/** Extra sets a day's focus gives a track: one for its dry track. */
export function focusBonus(
  trackId: TrackId,
  focus: readonly AttributeId[],
): number {
  return focus.some(a => FOCUS_TRACK[a] === trackId) ? 1 : 0;
}
