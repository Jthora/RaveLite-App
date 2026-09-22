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
    beginner: '1 min each side, half tempo — reset after every drop',
    light: '2 min, both directions, at an easy tempo',
    heavy: 'weak side first, then link it into a move you already know',
    challenge: 'one full track at tempo — both sides, linked, no drops',
  },
  dance: {
    beginner: 'count it out slowly with no music — 8 clean reps',
    light: '2 min to a slow track, about 100 BPM',
    heavy: 'travelling, at house tempo or faster (125 BPM and up)',
    challenge: 'a whole track at 140 BPM or double time, freestyled in',
  },
  danceCombat: {
    beginner: 'slow motion, no music — 5 clean reps each side',
    light: '2 × 1 min to a slow beat',
    heavy: 'weak side leading; full power only while it stays clean',
    challenge: 'a 3 min round at tempo, freestyling everything in this tier',
  },
};

/** What a move asks for at a chart. */
export function chartDose(
  exercise: Exercise,
  chart: ChartId,
  family: ChartFamily,
): string {
  if (chart === 'standard') {
    return exercise.dose;
  }
  const rule = RULES[family][chart];
  // Heavy builds on the move's own dose; the others replace it.
  return chart === 'heavy' ? `${exercise.dose}, ${rule}` : capital(rule);
}

const capital = (s: string): string => s[0].toUpperCase() + s.slice(1);
