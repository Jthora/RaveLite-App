/**
 * Drill picker — scoring engine for "what should the operator do right now?"
 *
 * Replaces ad-hoc switch statements with a sum-of-scorers approach.
 * Each scorer is a small pure function `(ex, ctx) => number`. The drill
 * with the highest total score wins. Ranked alternates fall out for free.
 *
 * Tuning notes:
 *   - Scorers should mostly return values in [-3, +3]. Outliers (`-10`)
 *     are reserved for hard penalties (e.g. already-done-today variety).
 *   - Add a new scorer by appending to `SCORERS` and tuning weights.
 *   - Element-specific behavior is encoded in `circadianFit`'s map, not
 *     branched in code — to add a new rhythm, edit the table.
 */

import type {ElementId} from '../../theme/elements';
import type {Exercise, Target} from './types';
import {exercisesFor} from './library';

export interface DrillContext {
  element: ElementId;
  /** Active reminder slot's `everyMinutes`, if a plan is armed. */
  windowMinutes?: number;
  /** Exercise ids already completed today (any source). Skip-pressure. */
  loggedTodayIds: ReadonlySet<string>;
  /** Hour of day, 0–23. Drives circadian fit. */
  hour: number;
  /** Operator's focus targets for this element (from prefs). */
  preferredTargets: ReadonlyArray<Target>;
  /** Recent picks to apply variety pressure. Most-recent-first. */
  recentPickIds?: ReadonlyArray<string>;
}

type Scorer = (ex: Exercise, ctx: DrillContext) => number;

// ─── Individual scorers ─────────────────────────────────────────────────

/** +2 if the drill comfortably fits the active reminder window, -2 if
 *  it dwarfs it. No window = neutral. */
const fitsTimeWindow: Scorer = (ex, ctx) => {
  const win = ctx.windowMinutes;
  if (win == null) {return 0;}
  const winSec = win * 60;
  if (ex.approxSeconds <= winSec * 0.5) {return 2;}
  if (ex.approxSeconds <= winSec) {return 1;}
  if (ex.approxSeconds <= winSec * 1.5) {return -1;}
  return -2;
};

/** +1 for each of the operator's preferred targets the drill matches.
 *  Capped at +3 so a 4-target overlap doesn't dominate the score. */
const matchesPreferredTargets: Scorer = (ex, ctx) => {
  if (ctx.preferredTargets.length === 0) {return 0;}
  let hits = 0;
  for (const t of ex.targets) {
    if (ctx.preferredTargets.includes(t)) {hits++;}
  }
  return Math.min(hits, 3);
};

/** +3 if untouched today, -10 if already done. The hard penalty makes
 *  repeats vanishingly rare unless the library is exhausted. */
const notYetLoggedToday: Scorer = (ex, ctx) =>
  ctx.loggedTodayIds.has(ex.id) ? -10 : 3;

/**
 * Circadian fit — encode the operator's daily rhythm.
 * Each element has 0–2 high-affinity windows. Drills tagged with the
 * window's preferred Target get a small boost during that window.
 */
const CIRCADIAN: Record<
  ElementId,
  ReadonlyArray<{hours: [number, number]; favored: ReadonlyArray<Target>}>
> = {
  // Air: morning posture/breath reset, mid-afternoon mobility break.
  air: [
    {hours: [6, 10], favored: ['Breath', 'UCS', 'Mobility']},
    {hours: [13, 16], favored: ['Mobility', 'NoFloor']},
  ],
  // Fire: peak strength + conditioning through the late afternoon and
  // the backyard session.
  fire: [
    {hours: [14, 19], favored: ['Strength', 'Conditioning', 'PFT-Pushups', 'PFT-Situps']},
    {hours: [10, 12], favored: ['NoFloor']},
  ],
  // Earth: alignment + core work mid-morning when joints are warm.
  earth: [
    {hours: [9, 12], favored: ['APT', 'Hourglass', 'Core', 'Mobility']},
    {hours: [19, 22], favored: ['Mobility']},
  ],
  // Water: flow + coordination evening-leaning, away from heavy fatigue;
  // water calls + fascia stretches through the working day.
  water: [
    {hours: [16, 21], favored: ['Flow', 'Coordination']},
    {hours: [8, 16], favored: ['Hydration', 'Mobility']},
  ],
  // Heart: presence work fits anywhere, slight edge at transitions.
  heart: [
    {hours: [6, 9], favored: ['Presence']},
    {hours: [20, 23], favored: ['Presence']},
  ],
};

const circadianFit: Scorer = (ex, ctx) => {
  const windows = CIRCADIAN[ctx.element];
  for (const w of windows) {
    const [start, end] = w.hours;
    if (ctx.hour < start || ctx.hour >= end) {continue;}
    let hits = 0;
    for (const t of ex.targets) {
      if (w.favored.includes(t)) {hits++;}
    }
    if (hits > 0) {return Math.min(hits, 2);}
  }
  return 0;
};

/** Variety: -1 per occurrence in the last 5 picks. Stops the engine
 *  from getting stuck on a single high-scoring drill. */
const varietyPressure: Scorer = (ex, ctx) => {
  if (!ctx.recentPickIds?.length) {return 0;}
  let hits = 0;
  for (const id of ctx.recentPickIds.slice(0, 5)) {
    if (id === ex.id) {hits++;}
  }
  return -hits;
};

const SCORERS: ReadonlyArray<Scorer> = [
  fitsTimeWindow,
  matchesPreferredTargets,
  notYetLoggedToday,
  circadianFit,
  varietyPressure,
];

// ─── Public API ─────────────────────────────────────────────────────────

/** Score every drill in the element's library. Returns highest-first. */
export function rankDrillsFor(
  ctx: DrillContext,
): ReadonlyArray<{exercise: Exercise; score: number}> {
  const candidates = exercisesFor(ctx.element);
  return candidates
    .map(ex => ({
      exercise: ex,
      score: SCORERS.reduce((s, fn) => s + fn(ex, ctx), 0),
    }))
    .sort((a, b) => b.score - a.score);
}

/** Pick the single best drill for the given context, or `undefined` if
 *  the element has no library. */
export function pickDrillFor(ctx: DrillContext): Exercise | undefined {
  return rankDrillsFor(ctx)[0]?.exercise;
}

/** N best alternates, excluding the top pick. Used by NowPanel's drawer. */
export function alternateDrillsFor(
  ctx: DrillContext,
  count: number,
): ReadonlyArray<Exercise> {
  return rankDrillsFor(ctx)
    .slice(1, 1 + count)
    .map(r => r.exercise);
}
