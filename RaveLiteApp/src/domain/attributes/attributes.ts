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
    sign: 'Aries · the ram, head-first',
    gist: 'Force from a standing start.',
    how: 'Jump squats, explosive push-ups, burpees, kicks.',
    events: [],
  },
  {
    id: 'stamina',
    name: 'Stamina',
    element: 'fire',
    modality: 'fixed',
    sign: 'Leo · the sun, ruler of the heart',
    gist: 'Output held for a long time.',
    how: 'Easy runs, the rounds across the day, fire rounds.',
    events: ['run-2mi', 'run-3mi'],
  },
  {
    id: 'speed',
    name: 'Speed',
    element: 'fire',
    modality: 'mutable',
    sign: 'Sagittarius · the archer, ruler of the thighs',
    gist: 'Output that changes pace.',
    how: 'Strides, interval runs, sprints, fast hands.',
    events: ['cft-mtc'],
  },
  {
    id: 'awareness',
    name: 'Awareness',
    element: 'air',
    modality: 'cardinal',
    sign: 'Libra · weighing what you sense',
    gist: 'Sensing first, so you act first.',
    how: 'Eye breaks, reaction catches, walking with your eyes closed.',
    events: [],
  },
  {
    id: 'breath',
    name: 'Breath',
    element: 'air',
    modality: 'fixed',
    sign: 'Aquarius · the vessel held steady',
    gist: 'Breath held, and calm.',
    how: 'Box breathing, exhale holds, crocodile breathing, posture resets.',
    events: ['breath-hold', 'exhale-hold'],
  },
  {
    id: 'agility',
    name: 'Agility',
    element: 'air',
    modality: 'mutable',
    sign: 'Gemini · the twins, ruler of arms and nerves',
    gist: 'Lightness that changes direction.',
    how: 'Rope skips, footwork, kick-flip groundwork.',
    events: ['rope-skips'],
  },
  {
    id: 'resolve',
    name: 'Resolve',
    element: 'heart',
    modality: 'cardinal',
    sign: 'Sulfur · the soul that ignites',
    gist: 'Starting: intent, answering the call.',
    how: 'Morning intent, the first chime on a dark morning, fuel checks.',
    events: ['sets-done'],
  },
  {
    id: 'focus',
    name: 'Focus',
    element: 'heart',
    modality: 'fixed',
    sign: 'Salt · the form that holds',
    gist: 'Attention held. It also speeds everything else up.',
    how: 'Still sits, single-point focus, the evening review.',
    events: ['still-sit'],
  },
  {
    id: 'presence',
    name: 'Presence',
    element: 'heart',
    modality: 'mutable',
    sign: 'Mercury · quicksilver',
    gist: 'Expression that responds.',
    how: 'Voice and bearing, dancing out, teaching a move, a flow performed.',
    events: [],
  },
  {
    id: 'strength',
    name: 'Strength',
    element: 'earth',
    modality: 'cardinal',
    sign: 'Capricorn · the goat, ruler of the bones',
    gist: 'Moving load.',
    how: 'Push, pull and squat ladders; rows and porch pull-ups.',
    events: ['pushups-2min', 'pullups', 'squats'],
  },
  {
    id: 'toughness',
    name: 'Toughness',
    element: 'earth',
    modality: 'fixed',
    sign: 'Taurus · the bull',
    gist: 'Holding load.',
    how: 'Planks, hangs, brick carries, wall sits, horse stance.',
    events: ['plank', 'dead-hang', 'wall-sit', 'side-plank'],
  },
  {
    id: 'balance',
    name: 'Balance',
    element: 'earth',
    modality: 'mutable',
    sign: 'Virgo · precision',
    gist: 'The base, constantly adjusting.',
    how: 'Single-leg work, eyes-closed balance, hip airplanes, stances.',
    events: ['balance'],
  },
  {
    id: 'dexterity',
    name: 'Dexterity',
    element: 'water',
    modality: 'cardinal',
    sign: 'Cancer · the crab’s claws',
    gist: 'Flow started by the hands.',
    how: 'Staff figure-8 with each hand, sword form, juggling, beat locks.',
    events: ['staff-flow'],
  },
  {
    id: 'mobility',
    name: 'Mobility',
    element: 'water',
    modality: 'fixed',
    sign: 'Scorpio · depth',
    gist: 'Range held and deepened.',
    how: 'Long holds — pigeon, frog, the splits progression, deep squats.',
    events: ['deep-squat-hold'],
  },
  {
    id: 'recovery',
    name: 'Recovery',
    element: 'water',
    modality: 'mutable',
    sign: 'Pisces · sleep and dissolving',
    gist: 'The body adapting and restoring.',
    how: 'Water, easy walks, soft tissue, the sleep window, deload weeks.',
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
    gist: 'Initiate — the first move, force from stillness',
  },
  {
    id: 'fixed',
    name: 'Fixed',
    gist: 'Sustain — holding: capacity, endurance, stillness',
  },
  {
    id: 'mutable',
    name: 'Mutable',
    gist: 'Adapt — changing: pace, range, direction, restoring',
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
