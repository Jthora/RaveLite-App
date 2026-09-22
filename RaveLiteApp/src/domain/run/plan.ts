import {METERS_PER_MILE} from '../../lib/constants';
import {formatDuration} from '../training/grading';
import type {MetricKind, TrainingLogEntry} from '../training/types';

/**
 * The run program — pure. Paces and the week's runs toward the 2- and
 * 3-mile tests, from what the Train log says you can run now.
 *
 * Fitness is a 3-mile time: the best run of a mile or more in the last four
 * months, carried to 3 miles with Riegel's formula (t × (3 mi ÷ d)^1.06).
 * With nothing recent it uses the best run ever and says it's old; with no
 * run at all it assumes 27:00.
 *
 * Paces come from that time (a mile of the race is the time ÷ 3): easy
 * runs at about 1.25 × race pace, tempo at about 1.08 ×, and repeats at the
 * pace of the next checkpoint. Checkpoints step down a minute at a time
 * toward B+ (20:54, just under 7:00 a mile), then an A (19:00), then an A+
 * (18:00).
 *
 * The week follows the focus wheel's run days and the 4-week block:
 *   Tuesday (Speed): 400 m repeats, a tempo run, 800 m repeats, then
 *     strides on the deload week. Reps grow a little each block.
 *   Wednesday (Stamina): an easy run, a little longer each block.
 *   Saturday: the week's 2- or 3-mile test with a goal time, or an easy
 *     run on the deload week.
 * The first block, and any time two weeks pass without a run, rebuilds:
 *   strides after an easy jog, run/walk, and steady baseline tests.
 */

const DAY_MS = 86_400_000;
const MILE = METERS_PER_MILE;
const TWO_MILES = 2 * MILE;
const THREE_MILES = 3 * MILE;
export const RIEGEL_EXPONENT = 1.06;
/** A 3-mile time to plan from until a run is logged. */
export const ASSUMED_THREE_MILE = 27 * 60;
const RECENT_DAYS = 120;
const REBUILD_GAP_DAYS = 14;

/** A time over `meters`, carried to `targetMeters` at Riegel's rate. */
export function equivalentTime(
  seconds: number,
  meters: number,
  targetMeters: number,
): number {
  return seconds * Math.pow(targetMeters / meters, RIEGEL_EXPONENT);
}

export interface RunFitness {
  /** Seconds for 3 miles. */
  threeMile: number;
  /** The run it comes from; unset when assumed. */
  from?: {label: string; at: number};
  /** No run of a mile or more in the last four months. */
  stale: boolean;
  /** The latest run of a mile or more. */
  lastRunAt?: number;
}

function runMeters(
  entry: TrainingLogEntry,
  kind: MetricKind | undefined,
): number | undefined {
  if (kind?.category !== 'run' || entry.value <= 0) {
    return undefined;
  }
  const meters =
    kind.inputMode === 'distance-time'
      ? entry.distanceMeters
      : kind.defaultDistanceMeters;
  return meters && meters >= MILE ? meters : undefined;
}

export function runFitness(
  entries: readonly TrainingLogEntry[],
  metricFor: (kindId: string) => MetricKind | undefined,
  now: number,
): RunFitness {
  type Pick = {threeMile: number; label: string; at: number};
  let best: Pick | undefined;
  let bestRecent: Pick | undefined;
  let lastRunAt: number | undefined;
  for (const entry of entries) {
    const kind = metricFor(entry.kindId);
    const meters = runMeters(entry, kind);
    if (!meters || !kind || entry.at > now) {
      continue;
    }
    lastRunAt = Math.max(lastRunAt ?? 0, entry.at);
    const pick = {
      threeMile: equivalentTime(entry.value, meters, THREE_MILES),
      label: kind.label,
      at: entry.at,
    };
    if (!best || pick.threeMile < best.threeMile) {
      best = pick;
    }
    const recent = entry.at >= now - RECENT_DAYS * DAY_MS;
    if (recent && (!bestRecent || pick.threeMile < bestRecent.threeMile)) {
      bestRecent = pick;
    }
  }
  const chosen = bestRecent ?? best;
  return chosen
    ? {
        threeMile: chosen.threeMile,
        from: {label: chosen.label, at: chosen.at},
        stale: !bestRecent,
        lastRunAt,
      }
    : {threeMile: ASSUMED_THREE_MILE, stale: true, lastRunAt};
}

export interface Checkpoint {
  /** Seconds for 3 miles. */
  seconds: number;
  label: string;
}

/** Slowest to fastest. */
export const RUN_MILESTONES: readonly Checkpoint[] = [
  {seconds: 20 * 60 + 54, label: 'B+'},
  {seconds: 19 * 60, label: 'an A'},
  {seconds: 18 * 60, label: 'an A+'},
];

/** The next 3-mile goal: a minute faster, or the next milestone once close. */
export function nextCheckpoint(threeMile: number): Checkpoint {
  const milestone =
    RUN_MILESTONES.find(m => m.seconds < threeMile) ??
    RUN_MILESTONES[RUN_MILESTONES.length - 1];
  const step = Math.floor((threeMile - 60) / 15) * 15;
  return step > milestone.seconds + 30
    ? {seconds: step, label: 'the next checkpoint'}
    : milestone;
}

/** Seconds per mile. */
export interface Paces {
  easy: number;
  tempo: number;
  goal: number;
}

export function pacesFor(threeMile: number, checkpoint: Checkpoint): Paces {
  const race = threeMile / 3;
  return {easy: race * 1.25, tempo: race * 1.08, goal: checkpoint.seconds / 3};
}

/** The time for `meters` at a pace per mile. */
export function splitTime(pacePerMile: number, meters: number): number {
  return (pacePerMile * meters) / MILE;
}

/** "10:30 a mile", to the nearest 5 seconds. */
export function formatPerMile(pacePerMile: number): string {
  return `${formatDuration(Math.round(pacePerMile / 5) * 5)} a mile`;
}

export type RunKind = 'strides' | 'intervals' | 'tempo' | 'easy' | 'test';

export interface RunDay {
  kind: RunKind;
  /** The library drill that chimes. */
  exerciseId: string;
  /** The morning block piece it stands in for. */
  replaces: string;
  title: string;
  /** For the chime line: "6 × 400 m in 1:59". */
  short: string;
  /** The whole session. */
  detail: string;
}

export interface RunDayInput {
  date: Date;
  /** Program week. */
  week: number;
  fitness: RunFitness;
  now: number;
}

/** The run plan's run for `date`, or undefined on a day without one. */
export function runDay({
  date,
  week,
  fitness,
  now,
}: RunDayInput): RunDay | undefined {
  const w = Math.max(1, week);
  const inBlock = (w - 1) % 4;
  const block = Math.floor((w - 1) / 4);
  const deload = inBlock === 3;
  const gap =
    fitness.lastRunAt === undefined ||
    now - fitness.lastRunAt > REBUILD_GAP_DAYS * DAY_MS;
  const rebuilding = block === 0 || gap;
  const checkpoint = nextCheckpoint(fitness.threeMile);
  const paces = pacesFor(fitness.threeMile, checkpoint);
  const easy = formatPerMile(paces.easy);

  switch (date.getDay()) {
    case 2: {
      if (rebuilding || deload) {
        return {
          kind: 'strides',
          exerciseId: 'fire.backyard-strides',
          replaces: 'fire.backyard-strides',
          title: 'Strides',
          short: '10 min easy, 6 strides',
          detail: `10 min easy jog at ${easy}, then 6 × 15 s fast and relaxed, walking back between.`,
        };
      }
      if (inBlock === 1) {
        const minutes = Math.min(25, 15 + 5 * (block - 1));
        const tempo = formatPerMile(paces.tempo);
        return {
          kind: 'tempo',
          exerciseId: 'fire.tempo-run',
          replaces: 'fire.backyard-strides',
          title: 'Tempo run',
          short: `${minutes} min at ${tempo}`,
          detail: `10 min easy, ${minutes} min comfortably hard at ${tempo}, then 5 min easy.`,
        };
      }
      const meters = inBlock === 0 ? 400 : 800;
      const reps =
        inBlock === 0 ? Math.min(10, 5 + block) : Math.min(6, 2 + block);
      const split = formatDuration(splitTime(paces.goal, meters));
      return {
        kind: 'intervals',
        exerciseId: 'fire.interval-run',
        replaces: 'fire.backyard-strides',
        title: `${meters} m repeats`,
        short: `${reps} × ${meters} m in ${split}`,
        detail: `10 min easy, then ${reps} × ${meters} m in ${split} each, the pace of a ${formatDuration(
          checkpoint.seconds,
        )} 3-mile, with ${
          meters === 400 ? 2 : 3
        } min easy jogging between. 5 min easy to finish.`,
      };
    }
    case 3: {
      const minutes = rebuilding
        ? deload
          ? 20
          : 20 + 5 * inBlock
        : deload
        ? 25
        : 30 + 5 * Math.min(block, 4) + [0, 5, 10][inBlock];
      return {
        kind: 'easy',
        exerciseId: 'fire.zone2-run',
        replaces: 'fire.zone2-run',
        title: 'Easy run',
        short: `${minutes} min easy`,
        detail: rebuilding
          ? `${minutes} min of run/walk: 4 min running at ${easy} or easier, 1 min walking.`
          : `${minutes} min at ${easy} or easier: easy enough to talk the whole way.`,
      };
    }
    case 6: {
      // Rebuilding, a test is a steady baseline at about today's estimate.
      const goal3 = rebuilding
        ? Math.round(fitness.threeMile / 15) * 15
        : checkpoint.seconds;
      const steady = rebuilding ? ' Steady, not all-out: a baseline.' : '';
      if (inBlock === 0) {
        const goal2 = equivalentTime(goal3, THREE_MILES, TWO_MILES);
        return {
          kind: 'test',
          exerciseId: 'fire.run-2mi',
          replaces: 'fire.run-2mi',
          title: '2-mile test',
          short: `goal ${formatDuration(goal2)}`,
          detail: `Goal ${formatDuration(goal2)}: ${formatPerMile(
            goal2 / 2,
          )}, the first mile no faster.${steady}`,
        };
      }
      if (inBlock === 1) {
        return {
          kind: 'test',
          exerciseId: 'fire.run-3mi',
          replaces: 'fire.run-3mi',
          title: '3-mile test',
          short: `goal ${formatDuration(goal3)}`,
          detail: `Goal ${formatDuration(goal3)}: ${formatPerMile(
            goal3 / 3,
          )}, the first mile no faster. A loop a little over 3 miles counts at the same pace.${steady}`,
        };
      }
      if (deload) {
        return {
          kind: 'easy',
          exerciseId: 'fire.zone2-run',
          replaces: 'fire.zone2-run',
          title: 'Easy run',
          short: '25 min easy',
          detail: `25 min at ${easy} or easier, after the strides.`,
        };
      }
      return undefined;
    }
    default:
      return undefined;
  }
}
