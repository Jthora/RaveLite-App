import type {ElementId} from '../../theme/elements';

/**
 * The fifteen attributes — five elements × three modalities.
 *
 * A modality is *how* an element moves: cardinal starts it, fixed holds
 * it, mutable changes it. Read a row and you get one element's range;
 * read a column and you get one kind of training — the first move, the
 * hold, the change. A week heavy on holds and light on change shows as a
 * lopsided column, the same way a neglected element shows as a short bar.
 *
 * The four natural elements take the zodiac's twelve seats. Core needs
 * its own three, so it borrows alchemy's tria prima: Sulfur ignites,
 * Salt holds its form, Mercury moves between.
 *
 * Attributes are never spent or assigned — they grow by doing (see
 * `levels.ts` for the curve and `trains.ts` for what feeds what).
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

export type Modality = 'cardinal' | 'fixed' | 'mutable';

export interface Attribute {
  id: AttributeId;
  name: string;
  element: ElementId;
  modality: Modality;
  /** The sign or principle whose gesture this is. */
  sign: string;
  /** One line: what it is. */
  gist: string;
  /** How you train it. */
  how: string;
  /**
   * Standards events that can set the level past the practice cap.
   * Empty means this one has no test yet, so practice is all there is.
   */
  events: readonly string[];
}

/** In the balance strip's element order, cardinal → fixed → mutable. */
export const ATTRIBUTES: readonly Attribute[] = [
  {
    id: 'power',
    name: 'Power',
    element: 'fire',
    modality: 'cardinal',
    sign: 'Aries',
    gist: 'Force from a standing start.',
    how: 'Jump squats, explosive push-ups, burpees, kicks.',
    events: [],
  },
  {
    id: 'stamina',
    name: 'Stamina',
    element: 'fire',
    modality: 'fixed',
    sign: 'Leo',
    gist: 'Output held for a long time.',
    how: 'Easy runs, the rounds across the day, fire rounds.',
    events: ['run-2mi', 'run-3mi'],
  },
  {
    id: 'speed',
    name: 'Speed',
    element: 'fire',
    modality: 'mutable',
    sign: 'Sagittarius',
    gist: 'Output that changes pace.',
    how: 'Strides, interval runs, sprints, fast hands.',
    events: ['cft-mtc'],
  },
  {
    id: 'awareness',
    name: 'Awareness',
    element: 'air',
    modality: 'cardinal',
    sign: 'Libra',
    gist: 'Noticing things early, so you act first.',
    how: 'Eye breaks, reaction catches, walking with your eyes closed.',
    events: [],
  },
  {
    id: 'breath',
    name: 'Breath',
    element: 'air',
    modality: 'fixed',
    sign: 'Aquarius',
    gist: 'Breath control and calm.',
    how: 'Box breathing, exhale holds, crocodile breathing, posture resets.',
    events: ['breath-hold', 'exhale-hold'],
  },
  {
    id: 'agility',
    name: 'Agility',
    element: 'air',
    modality: 'mutable',
    sign: 'Gemini',
    gist: 'Changing direction quickly and lightly.',
    how: 'Rope skips, footwork, kick-flip groundwork.',
    events: ['rope-skips'],
  },
  {
    id: 'resolve',
    name: 'Resolve',
    element: 'heart',
    modality: 'cardinal',
    sign: 'Sulfur',
    gist: 'Getting started: setting intent and answering chimes.',
    how: 'Morning intent, the first chime on a dark morning, fuel checks.',
    events: ['sets-done'],
  },
  {
    id: 'focus',
    name: 'Focus',
    element: 'heart',
    modality: 'fixed',
    sign: 'Salt',
    gist: 'Holding your attention. It also speeds up XP for every attribute.',
    how: 'Still sits, single-point focus, the evening review.',
    events: ['still-sit'],
  },
  {
    id: 'presence',
    name: 'Presence',
    element: 'heart',
    modality: 'mutable',
    sign: 'Mercury',
    gist: 'Expressing yourself and responding to others.',
    how: 'Voice and posture, dancing out, teaching a move, performing a flow.',
    events: [],
  },
  {
    id: 'strength',
    name: 'Strength',
    element: 'earth',
    modality: 'cardinal',
    sign: 'Capricorn',
    gist: 'Moving load.',
    how: 'Push, pull and squat ladders; rows and porch pull-ups.',
    events: ['pushups-2min', 'pullups', 'squats'],
  },
  {
    id: 'toughness',
    name: 'Toughness',
    element: 'earth',
    modality: 'fixed',
    sign: 'Taurus',
    gist: 'Holding load.',
    how: 'Planks, hangs, brick carries, wall sits, horse stance.',
    events: ['plank', 'dead-hang', 'wall-sit', 'side-plank'],
  },
  {
    id: 'balance',
    name: 'Balance',
    element: 'earth',
    modality: 'mutable',
    sign: 'Virgo',
    gist: 'Staying steady through constant small adjustments.',
    how: 'Single-leg work, eyes-closed balance, hip airplanes, stances.',
    events: ['balance'],
  },
  {
    id: 'dexterity',
    name: 'Dexterity',
    element: 'water',
    modality: 'cardinal',
    sign: 'Cancer',
    gist: 'Hand skill that starts a flow.',
    how: 'Staff figure-8 with each hand, sword form, juggling, beat locks.',
    events: ['staff-flow'],
  },
  {
    id: 'mobility',
    name: 'Mobility',
    element: 'water',
    modality: 'fixed',
    sign: 'Scorpio',
    gist: 'Holding and deepening your range of motion.',
    how: 'Long holds: pigeon, frog, the splits progression, deep squats.',
    events: ['deep-squat-hold'],
  },
  {
    id: 'recovery',
    name: 'Recovery',
    element: 'water',
    modality: 'mutable',
    sign: 'Pisces',
    gist: 'How your body adapts and restores.',
    how: 'Drinking water, easy walks, soft tissue work, sleep, deload weeks.',
    events: [],
  },
];

export interface ModalityInfo {
  id: Modality;
  name: string;
  gist: string;
}

export const MODALITIES: readonly ModalityInfo[] = [
  {
    id: 'cardinal',
    name: 'Cardinal',
    gist: 'Starting: the first move, force from stillness',
  },
  {
    id: 'fixed',
    name: 'Fixed',
    gist: 'Holding: capacity, endurance, stillness',
  },
  {
    id: 'mutable',
    name: 'Mutable',
    gist: 'Changing: pace, range, direction, restoring',
  },
];

const BY_ID = new Map(ATTRIBUTES.map(a => [a.id, a]));

export function attributeById(id: AttributeId): Attribute {
  return BY_ID.get(id)!;
}

/** One element's three, cardinal → fixed → mutable. */
export function attributesOf(element: ElementId): Attribute[] {
  return ATTRIBUTES.filter(a => a.element === element);
}
