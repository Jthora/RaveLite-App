/**
 * Bending a yard drill to the conditions — pure.
 *
 * Indoors is a basement with a low ceiling: most standing, mat and wall
 * work fits, but there's no room to run or walk laps, no hang point, no
 * height to jump or kick, and no space to dance or swing a staff.
 *
 * Only drills that can happen in the yard adapt; porch, mat and desk work
 * stays as it is. In order:
 *
 *   Rain, icy, or dangerous heat: outside is off. A drill that fits
 *     indoors moves inside; one that doesn't swaps for an indoor drill of
 *     the same element (a run becomes Fire conditioning, staff flow
 *     becomes Water mobility).
 *   Dark: a run swaps for indoor Fire conditioning and waits for first
 *     light, unless the operator runs in the dark (then: headlamp).
 *   Bugs likely: static work moves inside; the run and staff flow stay
 *     out, with repellent.
 *   Hot (caution): stay out, easy pace, drink first.
 *   Cold: warm up inside first.
 */
import {EXERCISE_LIBRARY} from '../exercises/library';
import {moveForExercise, type MoveId} from '../exercises/moves';
import type {Exercise, Target, Venue} from '../exercises/types';
import {seededPick} from '../reminders/scheduler';
import type {ElementId} from '../../theme/elements';
import type {Conditions} from './conditions';
import {clockHM, formatTemp} from './format';

export interface WeatherPrefs {
  units: 'C' | 'F';
  /** Run in the dark with a headlamp instead of waiting for light. */
  runInDark: boolean;
  /** Move static yard work inside when bugs are likely. */
  bugsMoveInside: boolean;
}

export const DEFAULT_WEATHER_PREFS: WeatherPrefs = {
  units: 'C',
  runInDark: false,
  bugsMoveInside: true,
};

export interface Adapted {
  drill: Exercise;
  /** Why the chime changed, for the card and the notification. */
  note?: string;
  /** A different drill than the plan picked. */
  swapped: boolean;
}

/** Moves that need what the basement lacks. */
const NEEDS_OUTSIDE: ReadonlySet<MoveId> = new Set<MoveId>([
  'run',
  'walk',
  'staff',
  'footwork',
  'jump',
  'kick',
  'carry',
]);
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
]);
/** What an indoor stand-in should train, by element, best first. */
const INDOOR_TAGS: Record<ElementId, readonly Target[]> = {
  fire: ['Conditioning', 'Strength'],
  water: ['Mobility'],
  air: ['Breath', 'Mobility'],
  earth: ['Core', 'Strength'],
  heart: ['Presence'],
};

export function needsOutside(drill: Exercise): boolean {
  if (FITS_INSIDE.has(drill.id)) {
    return false;
  }
  const move = moveForExercise(drill.id);
  return (
    (move !== undefined && NEEDS_OUTSIDE.has(move)) ||
    drill.targets.includes('PFT-Run')
  );
}

export function canGoInside(drill: Exercise): boolean {
  return !needsOutside(drill) && drill.venues.some(v => INDOOR_VENUES.has(v));
}

export function isRun(drill: Exercise): boolean {
  const move = moveForExercise(drill.id);
  return move === 'run' || move === 'walk' || drill.targets.includes('PFT-Run');
}

/** An indoor drill of the same element, stable for the same seed. */
export function indoorAlternative(
  drill: Exercise,
  seed: string,
): Exercise | undefined {
  for (const tag of INDOOR_TAGS[drill.element]) {
    const options = EXERCISE_LIBRARY.filter(
      o =>
        o.element === drill.element &&
        o.id !== drill.id &&
        o.targets.includes(tag) &&
        !o.targets.includes('Hydration') &&
        !o.targets.includes('Fuel') &&
        canGoInside(o),
    );
    // Prefer a stand-in of some substance for a long drill.
    const long = options.filter(
      o => o.approxSeconds >= Math.min(drill.approxSeconds, 120),
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
): Adapted {
  if (!drill.venues.includes('yard')) {
    return {drill, swapped: false};
  }
  const temp = (value?: number) =>
    value === undefined ? '' : formatTemp(value, prefs.units);
  const inside = canGoInside(drill);
  const swap = (why: string, tail: (alt: Exercise) => string): Adapted => {
    const alt = indoorAlternative(drill, seed);
    return alt
      ? {drill: alt, note: `${why} — ${tail(alt)}`, swapped: true}
      : {drill, note: `${why} — only if it's safe out`, swapped: false};
  };

  const off = c.icy
    ? 'Icy out'
    : c.heat === 'danger'
    ? `Feels ${temp(c.feelsC)}`
    : c.rain
    ? c.rainChance !== undefined && c.rainChance > 0
      ? `Rain ${c.rainChance}%`
      : 'Rain'
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
