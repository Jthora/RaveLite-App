/**
 * Daily par — balance as the goal.
 *
 * Each element aims for a number of effort points a day. Points past par
 * count half, up to twice par, and nothing beyond: piling more onto one
 * element can't carry the day. A day with all five at par is a Harmony day.
 */
import {ELEMENT_ORDER, type ElementId} from '../../theme/elements';

/**
 * Effort points: what a thing done is worth toward its element's daily par.
 * A glass or an eye break is 1, a set or a short drill 2, a check-in 3, a
 * max test 5, and anything longer earns a point a minute (a 5-minute
 * evening review is 5, a 30-minute run 30), up to a cap.
 */
export const POINTS = {
  glass: 1,
  eyeBreak: 1,
  set: 2,
  /** The least a drill or partner earns, however short. */
  drill: 2,
  checkIn: 3,
  test: 5,
  /** Drills and timed sessions earn a point a minute, up to this. */
  sessionMinutesMax: 30,
} as const;

/**
 * Par for a full day. A shorter day asks for proportionally less — see
 * `program/density.ts`, and `profile/repository.ts#dailyPar` for the one
 * this person is actually measured against. The functions below take par
 * as an argument so they stay pure; the default is the full day, which is
 * what every caller written before day shapes existed expects.
 */
export const DAILY_PAR = 20;
/** Where a full day's points stop counting at all. */
export const PAR_CEILING = DAILY_PAR * 2;

/** Points toward the day's score: in full to par, half to double, then none. */
export function scoredPoints(raw: number, par: number = DAILY_PAR): number {
  const capped = Math.max(0, Math.min(raw, par * 2));
  return Math.min(capped, par) + Math.max(0, capped - par) / 2;
}

/**
 * How far below par each element averaged across `byDay` (points per day).
 * An element that made par every day has 0.
 */
export function averageShortfall(
  byDay: Readonly<Record<ElementId, readonly number[]>>,
  par: number = DAILY_PAR,
): Record<ElementId, number> {
  const out = {} as Record<ElementId, number>;
  for (const id of ELEMENT_ORDER) {
    const days = byDay[id] ?? [];
    const missed = days.reduce((sum, p) => sum + Math.max(0, par - p), 0);
    out[id] = days.length > 0 ? missed / days.length : 0;
  }
  return out;
}

/** Every element reached par. */
export function isHarmony(
  points: Readonly<Partial<Record<ElementId, number>>>,
  par: number = DAILY_PAR,
): boolean {
  return ELEMENT_ORDER.every(id => (points[id] ?? 0) >= par);
}
