/**
 * Bending a yard drill to the conditions — pure.
 *
 * What fits indoors comes from the person's places (`indoorRoom`): runs,
 * walks and carries never go inside, and neither does a staff; jumping
 * and kicking can, unless every indoor place has a low ceiling; dance
 * footwork can, unless every indoor place is also tight on room. An
 * install from before places (the author's, whose indoors is a
 * low-ceilinged basement) keeps the basement: no height and no room.
 *
 * Only drills that can happen in the yard adapt; porch, mat and desk work
 * stays as it is. In order:
 *
 *   Thunder, icy, or dangerous heat: outside is off. A drill that fits
 *     indoors moves inside; one that doesn't swaps for an indoor drill of
 *     the same element (a run becomes Fire conditioning, staff flow
 *     becomes Water mobility).
 *   Rain: the same — unless the operator trains in it. Some people run
 *     in the rain on purpose, as the harder session; that is theirs to
 *     choose, per runs or for everything. Thunder is never a choice.
 *   Dark: a run swaps for indoor Fire conditioning and waits for first
 *     light, unless the operator runs in the dark (then: headlamp).
 *   Bugs likely: static work moves inside; the run and staff flow stay
 *     out, with repellent.
 *   Hot (caution): stay out, easy pace, drink first.
 *   Cold: warm up inside first.
 */
import {EXERCISE_LIBRARY, isCurriculum} from '../exercises/library';
import {moveForExercise, type MoveId} from '../exercises/moves';
import {canDo, placeKind, type Facts, type LimitId} from '../profile/kit';
import {loadFacts} from '../profile/repository';
import type {Exercise, Target, Venue} from '../exercises/types';
import {seededPick} from '../reminders/scheduler';
import type {ElementId} from '../../theme/elements';
import type {Conditions} from './conditions';
import {clockHM, formatTemp} from './format';

/** What rain does: move you inside, or not. */
export type RainChoice = 'inside' | 'runs' | 'train';

export interface WeatherPrefs {
  units: 'C' | 'F';
  /**
   * Inside (the default), run in it (runs stay out, the rest moves in),
   * or train in it (everything stays out). Thunder moves everything
   * inside whatever this says.
   */
  rain: RainChoice;
  /** Run in the dark with a headlamp instead of waiting for light. */
  runInDark: boolean;
  /** Move static yard work inside when bugs are likely. */
  bugsMoveInside: boolean;
  /**
   * The house is air conditioned, so a hot day only costs water for the
   * time actually spent out in it.
   */
  airConditioned: boolean;
}

export const DEFAULT_WEATHER_PREFS: WeatherPrefs = {
  units: 'C',
  rain: 'inside',
  runInDark: false,
  bugsMoveInside: true,
  airConditioned: true,
};

export interface Adapted {
  drill: Exercise;
  /** Why the chime changed, for the card and the notification. */
  note?: string;
  /** A different drill than the plan picked. */
  swapped: boolean;
}

/** Moves that need outdoors whatever the house is like. */
const ALWAYS_OUTSIDE: ReadonlySet<MoveId> = new Set<MoveId>([
  'run',
  'walk',
  'carry',
  'staff',
]);
/** Moves that need height. */
const NEEDS_HEIGHT: ReadonlySet<MoveId> = new Set<MoveId>(['jump', 'kick']);
/** Moves that need floor space. */
const NEEDS_ROOM: ReadonlySet<MoveId> = new Set<MoveId>(['footwork']);

/** What the indoor places allow. */
export interface IndoorRoom {
  lowCeiling: boolean;
  tight: boolean;
}

/** The author's basement, and the assumption before places existed. */
export const BASEMENT: IndoorRoom = {lowCeiling: true, tight: true};

/**
 * The best of this person's indoor places: height if any has no low
 * ceiling, room if any is not tight. `legacy` keeps the basement for an
 * install from before setup, whose places were split from a flat list and
 * never asked about the ceiling.
 */
export function indoorRoom(facts: Facts, legacy: boolean): IndoorRoom {
  const inside = (facts.places ?? []).filter(p => !placeKind(p.kind).outdoor);
  if (legacy || inside.length === 0) {
    return BASEMENT;
  }
  const has = (p: (typeof inside)[number], limit: LimitId) =>
    (p.limits ?? []).includes(limit) || (facts.limits ?? []).includes(limit);
  return {
    lowCeiling: inside.every(p => has(p, 'lowCeiling')),
    tight: inside.every(p => has(p, 'lowCeiling') || has(p, 'tight')),
  };
}
/** Drills whose pictogram suggests otherwise but that fit a low ceiling. */
const FITS_INSIDE: ReadonlySet<string> = new Set([
  'fire.fire-rounds',
  'earth.brick-pinch',
]);
const INDOOR_VENUES: ReadonlySet<Venue> = new Set<Venue>([
  'desk',
  'standing',
  'mat',
  'wall',
  'house',
]);
/** What an indoor stand-in should train, by element, best first. */
const INDOOR_TAGS: Record<ElementId, readonly Target[]> = {
  fire: ['Conditioning', 'Strength'],
  water: ['Mobility'],
  air: ['Breath', 'Mobility'],
  earth: ['Core', 'Strength'],
  heart: ['Presence'],
};

export function needsOutside(
  drill: Exercise,
  room: IndoorRoom = BASEMENT,
): boolean {
  if (FITS_INSIDE.has(drill.id)) {
    return false;
  }
  if (drill.targets.includes('PFT-Run')) {
    return true;
  }
  const move = moveForExercise(drill.id);
  if (move === undefined) {
    return false;
  }
  return (
    ALWAYS_OUTSIDE.has(move) ||
    (NEEDS_HEIGHT.has(move) && room.lowCeiling) ||
    (NEEDS_ROOM.has(move) && room.tight)
  );
}

export function canGoInside(
  drill: Exercise,
  room: IndoorRoom = BASEMENT,
): boolean {
  return (
    !needsOutside(drill, room) && drill.venues.some(v => INDOOR_VENUES.has(v))
  );
}

export function isRun(drill: Exercise): boolean {
  const move = moveForExercise(drill.id);
  return move === 'run' || move === 'walk' || drill.targets.includes('PFT-Run');
}

/** An indoor drill of the same element, stable for the same seed. */
export function indoorAlternative(
  drill: Exercise,
  seed: string,
  room: IndoorRoom = BASEMENT,
): Exercise | undefined {
  for (const tag of INDOOR_TAGS[drill.element]) {
    const options = EXERCISE_LIBRARY.filter(
      o =>
        o.element === drill.element &&
        o.id !== drill.id &&
        o.targets.includes(tag) &&
        !o.targets.includes('Hydration') &&
        !o.targets.includes('Fuel') &&
        !o.targets.includes('Test') &&
        !isCurriculum(o) &&
        canGoInside(o, room) &&
        canDo(o, loadFacts()),
    );
    // Prefer a stand-in of some substance for a long drill: swapping a
    // half-hour run for two minutes of anything is not a swap.
    const long = options.filter(
      o => o.approxSeconds >= Math.min(drill.approxSeconds, 240),
    );
    const pick = seededPick(long.length > 0 ? long : options, seed);
    if (pick) {
      return pick;
    }
  }
  return undefined;
}

export function adaptDrill(
  drill: Exercise,
  c: Conditions,
  prefs: WeatherPrefs,
  seed: string,
  room: IndoorRoom = BASEMENT,
): Adapted {
  if (!drill.venues.includes('yard')) {
    return {drill, swapped: false};
  }
  const temp = (value?: number) =>
    value === undefined ? '' : formatTemp(value, prefs.units);
  const inside = canGoInside(drill, room);
  const swap = (why: string, tail: (alt: Exercise) => string): Adapted => {
    const alt = indoorAlternative(drill, seed, room);
    return alt
      ? {drill: alt, note: `${why} — ${tail(alt)}`, swapped: true}
      : {drill, note: `${why} — only if it's safe outside`, swapped: false};
  };

  const rainText =
    c.rainChance !== undefined && c.rainChance > 0
      ? `Rain ${c.rainChance}%`
      : 'Rain';
  // Training in the rain is chosen, per runs or for everything.
  const outInRain =
    prefs.rain === 'train' || (prefs.rain === 'runs' && isRun(drill));
  const off = c.icy
    ? 'Icy out'
    : c.heat === 'danger'
    ? `Feels ${temp(c.feelsC)}`
    : c.storm
    ? 'Thunder'
    : c.rain && !outInRain
    ? rainText
    : undefined;
  if (off) {
    return inside
      ? {drill, note: `${off} — do it inside`, swapped: false}
      : swap(off, alt => `${alt.name} inside instead`);
  }
  if (c.dark && isRun(drill)) {
    const until = c.firstLight ? ` till ${clockHM(c.firstLight)}` : '';
    if (prefs.runInDark) {
      return {
        drill,
        note: `Dark${until} — headlamp and reflective gear`,
        swapped: false,
      };
    }
    return swap(
      `Dark${until}`,
      alt => `${alt.name} inside; run after first light`,
    );
  }
  if (c.rain) {
    return {
      drill,
      note: isRun(drill)
        ? `${rainText} — take shorter strides, wear something bright`
        : `${rainText} — watch your footing and your grip`,
      swapped: false,
    };
  }
  if (c.bugs === 'high' && prefs.bugsMoveInside) {
    return {
      drill,
      note: inside
        ? 'Bugs likely — do it inside'
        : 'Bugs likely — repellent first',
      swapped: false,
    };
  }
  if (c.heat === 'caution') {
    return {
      drill,
      note: `Feels ${temp(c.feelsC)} — ${
        isRun(drill) ? 'easy pace, ' : ''
      }drink first`,
      swapped: false,
    };
  }
  if (c.cold) {
    return {
      drill,
      note: `Feels ${temp(c.feelsC)} — warm up inside first`,
      swapped: false,
    };
  }
  return {drill, swapped: false};
}
