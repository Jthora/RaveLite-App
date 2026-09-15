/**
 * Fitness standards — the military tests the operator trains toward: the
 * Air Force and Space Force tests, the Marine PFT and combat fitness test,
 * and MARSOC's screening marks.
 *
 * Each event's target is its top score for ages 35–40, by sex; the table
 * the operator chose leads and the other shows beside it, and any target
 * can be changed. Results come from Train log tests. A longer run counts at
 * the same pace, so the 3.2-mile loop times the 3-mile event.
 *
 * The figures come from 2025–2026 news and calculator sites: the official
 * manuals would not load when they were gathered, and Space Force doesn't
 * publish its charts. Treat them as close, not final.
 */
import {METERS_PER_MILE} from '../../lib/constants';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import type {MetricKind, TrainingLogEntry} from '../training/types';

export type Sex = 'male' | 'female';

export interface StandardEvent {
  id: string;
  name: string;
  /** Which tests use it, e.g. "USAF · USSF". */
  tests: string;
  unit: 'reps' | 'seconds';
  /** A higher count or a lower time scores better. */
  better: 'higher' | 'lower';
  /** Top score for ages 35–40. */
  top: Record<Sex, number>;
  /** The Train log kind that holds test results. */
  kindId: string;
  /** For runs: longer runs count at the same pace. */
  distanceMeters?: number;
  note?: string;
}

export const STANDARDS_NOTE =
  'Top scores for ages 35–40, from 2025–2026 news and calculator sites: the official charts would not load, and Space Force does not publish its own. Close, not final. Tap a target to change it.';

export const STANDARD_EVENTS: readonly StandardEvent[] = [
  {
    id: 'pushups-1min',
    name: 'Push-ups, 1 min',
    tests: 'USAF · USSF',
    unit: 'reps',
    better: 'higher',
    top: {male: 56, female: 42},
    kindId: 'builtin.pushups-1min',
  },
  {
    id: 'pushups-2min',
    name: 'Push-ups, 2 min',
    tests: 'USMC',
    unit: 'reps',
    better: 'higher',
    top: {male: 76, female: 43},
    kindId: 'builtin.pushups-2min',
    note: 'Scores at most 70 of 100 points; pull-ups can score 100.',
  },
  {
    id: 'pullups',
    name: 'Pull-ups',
    tests: 'USMC · MARSOC',
    unit: 'reps',
    better: 'higher',
    top: {male: 21, female: 10},
    kindId: 'builtin.pullups-amrap',
    note: 'MARSOC competitive: 17.',
  },
  {
    id: 'plank',
    name: 'Plank',
    tests: 'USMC · USAF',
    unit: 'seconds',
    better: 'higher',
    top: {male: 225, female: 225},
    kindId: 'builtin.plank',
    note: 'Air Force top score: 3:25 (M) / 3:20 (F).',
  },
  {
    id: 'situps-1min',
    name: 'Sit-ups, 1 min',
    tests: 'USAF · USSF',
    unit: 'reps',
    better: 'higher',
    top: {male: 52, female: 43},
    kindId: 'builtin.situps-1min',
  },
  {
    id: 'run-2mi',
    name: '2-mile run',
    tests: 'USAF · USSF',
    unit: 'seconds',
    better: 'lower',
    top: {male: 836, female: 972},
    kindId: 'builtin.run-2mi',
    distanceMeters: 2 * METERS_PER_MILE,
    note: 'Or the 20 m shuttle run: 82 (M) / 63 (F).',
  },
  {
    id: 'run-3mi',
    name: '3-mile run',
    tests: 'USMC · MARSOC',
    unit: 'seconds',
    better: 'lower',
    top: {male: 1080, female: 1260},
    kindId: 'builtin.run-3mi',
    distanceMeters: 3 * METERS_PER_MILE,
    note: 'MARSOC competitive: 20:50.',
  },
  {
    id: 'cft-mtc',
    name: '880-yard sprint',
    tests: 'USMC CFT',
    unit: 'seconds',
    better: 'lower',
    top: {male: 165, female: 198},
    kindId: 'builtin.cft-mtc',
  },
  {
    id: 'cft-acl',
    name: 'Ammo-can lifts, 2 min',
    tests: 'USMC CFT',
    unit: 'reps',
    better: 'higher',
    top: {male: 110, female: 70},
    kindId: 'builtin.cft-acl',
    note: 'A 30 lb can: about 6 bricks in a bag.',
  },
  {
    id: 'cft-manuf',
    name: 'Maneuver under fire',
    tests: 'USMC CFT',
    unit: 'seconds',
    better: 'lower',
    top: {male: 173, female: 173},
    kindId: 'builtin.cft-manuf',
  },
];

function readTargets(): Record<string, number> {
  const raw = store.getString(KEYS.standardsTargets);
  if (raw === undefined) {
    return {};
  }
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

/** The table that leads; male unless the operator chose otherwise. */
export function getPrimarySex(): Sex {
  return store.getString(KEYS.standardsPrimary) === 'female'
    ? 'female'
    : 'male';
}

export function setPrimarySex(sex: Sex): void {
  store.set(KEYS.standardsPrimary, sex);
}

/** The operator's target for the leading table: their own, or the top score. */
export function targetFor(event: StandardEvent): number {
  return readTargets()[event.id] ?? event.top[getPrimarySex()];
}

/** True when the operator set their own target. */
export function hasOwnTarget(event: StandardEvent): boolean {
  return readTargets()[event.id] !== undefined;
}

/** Set a target, or pass undefined to go back to the top score. */
export function setTarget(eventId: string, value: number | undefined): void {
  const targets = readTargets();
  if (value === undefined) {
    delete targets[eventId];
  } else {
    targets[eventId] = value;
  }
  store.set(KEYS.standardsTargets, JSON.stringify(targets));
}

export interface StandardResult {
  value: number;
  at: number;
  /** When the result came from a longer run, that run's kind label. */
  from?: string;
}

/**
 * The best test result for an event. Runs also count any longer run at the
 * same pace, scaled to the event's distance.
 */
export function bestResult(
  event: StandardEvent,
  entries: readonly TrainingLogEntry[],
  metricFor: (kindId: string) => MetricKind | undefined,
): StandardResult | undefined {
  let best: StandardResult | undefined;
  const consider = (result: StandardResult) => {
    const better =
      !best ||
      (event.better === 'higher'
        ? result.value > best.value
        : result.value < best.value);
    if (better) {
      best = result;
    }
  };
  for (const entry of entries) {
    if (entry.value <= 0) {
      continue;
    }
    if (entry.kindId === event.kindId) {
      consider({value: entry.value, at: entry.at});
      continue;
    }
    if (!event.distanceMeters) {
      continue;
    }
    const kind = metricFor(entry.kindId);
    if (kind?.category !== 'run') {
      continue;
    }
    const distance =
      kind.inputMode === 'distance-time'
        ? entry.distanceMeters
        : kind.defaultDistanceMeters;
    // Only longer runs: a short sprint says little about a 3-mile pace.
    if (!distance || distance < event.distanceMeters) {
      continue;
    }
    consider({
      value: (entry.value / distance) * event.distanceMeters,
      at: entry.at,
      from: kind.label,
    });
  }
  return best;
}

/** How close a result is to its target, from 0 to 1. */
export function progressToward(
  event: StandardEvent,
  value: number,
  target: number,
): number {
  if (value <= 0 || target <= 0) {
    return 0;
  }
  const ratio = event.better === 'higher' ? value / target : target / value;
  return Math.min(1, ratio);
}
