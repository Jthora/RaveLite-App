import type {Exercise} from '../exercises/types';

/**
 * Charts — how hard you play a move, the way DDR has five charts for
 * one song.
 *
 * A move's tier says how far into a discipline it sits: basic,
 * intermediate, advanced. The chart says how you play it today, and
 * every move can be played at every chart. That gives each move five
 * honest sessions without five near-identical drills: the Standard chart
 * is the move's own dose, and the other four bend it the same way for
 * every move in a family.
 */
export type ChartId = 'beginner' | 'light' | 'standard' | 'heavy' | 'challenge';

/** Which rules a discipline's charts follow. */
export type ChartFamily = 'flow' | 'dance' | 'danceCombat';

export interface Chart {
  id: ChartId;
  name: string;
  /** The colours DDR players already read at a glance. */
  color: string;
}

export const CHARTS: readonly Chart[] = [
  {id: 'beginner', name: 'Beginner', color: '#5AC8FA'},
  {id: 'light', name: 'Light', color: '#FFD60A'},
  {id: 'standard', name: 'Standard', color: '#FF453A'},
  {id: 'heavy', name: 'Heavy', color: '#32D74B'},
  {id: 'challenge', name: 'Challenge', color: '#BF5AF2'},
];

export const CHART_BY_ID: ReadonlyMap<ChartId, Chart> = new Map(
  CHARTS.map(c => [c.id, c]),
);

/**
 * The four charts that are not Standard, per family. Standard is the
 * move's own dose; these are written once and hold for every move, so a
 * new move never needs five doses written for it.
 */
const RULES: Readonly<
  Record<ChartFamily, Readonly<Record<Exclude<ChartId, 'standard'>, string>>>
> = {
  flow: {
    beginner: '1 min each side at half tempo. Reset after every drop',
    light: '2 min, both directions, at an easy tempo',
    heavy: 'weak side first, then link it into a move you already know',
    challenge: 'one full track at tempo, both sides linked, with no drops',
  },
  dance: {
    beginner: '8 clean reps, counted out slowly with no music',
    light: '2 min to a slow track, about 100 BPM',
    heavy: 'travelling, at 125 BPM or faster',
    challenge: 'a whole track at 140 BPM or double time, in freestyle',
  },
  danceCombat: {
    beginner: '5 clean reps each side, in slow motion with no music',
    light: '2 × 1 min to a slow beat',
    heavy: 'weak side leading. Use full power only while form stays clean',
    challenge: 'a 3 min round at tempo, freestyling everything in this tier',
  },
};

/**
 * Aerial tricks: every rep is a take-off and a landing. No chart turns
 * them into a timed round; harder charts ask for cleaner or linked reps,
 * always with full rest between.
 */
const AERIAL: Readonly<Record<Exclude<ChartId, 'standard'>, string>> = {
  beginner: '5 each side in slow motion, without leaving the ground',
  light: '5 × 1 at half height, full rest between',
  heavy: 'weak side first',
  challenge:
    '5 × 2 linked out of a kick you already know, full rest between. Stop at the first messy landing',
};

export const isAerial = (exercise: Exercise): boolean =>
  exercise.id.startsWith('fire.tricking-');

/** What a move asks for at a chart. */
export function chartDose(
  exercise: Exercise,
  chart: ChartId,
  family: ChartFamily,
): string {
  if (chart === 'standard') {
    return exercise.dose;
  }
  const rule = (isAerial(exercise) ? AERIAL : RULES[family])[chart];
  // Heavy builds on the move's own dose; the others replace it.
  return chart === 'heavy' ? `${exercise.dose}, ${rule}` : capital(rule);
}

const capital = (s: string): string => s[0].toUpperCase() + s.slice(1);
