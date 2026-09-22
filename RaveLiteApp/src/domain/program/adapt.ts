import type {ReviewChange, Track, TrackState} from './types';

/**
 * Adaptive ramp — pure. How many sets a day each track has earned, read
 * from what actually got done rather than from the calendar.
 *
 * Once a day each track looks back over its training days in the last
 * week, done against what was asked:
 *   - 85% or more: one more set a day, up to the track's most.
 *   - 60% to 85%: hold.
 *   - Under 60%: one set fewer, never below two.
 * At most one step a week, so the climb stays smooth and one bad day never
 * costs a set.
 *
 * A break (three training days in a row with nothing) brings the track
 * back at 80% of its sets, again each week the break lasts. Climbing back
 * to where it was takes a set every three days at 85% or more.
 *
 * Deload weeks hold: lighter on purpose, so they neither raise nor cut.
 * While a mode that pauses the ramp is on (`profile/mode.ts`), it holds,
 * checked before the break. Days that were rest never reach a review at
 * all: the caller leaves them out.
 * Set size stays at about half the tested max (`progression.ts`), so
 * growth comes as more small sets across the day, and from max tests.
 */

export const UP_AT = 0.85;
export const DOWN_BELOW = 0.6;
/** Days before today a review reads. */
export const WINDOW_DAYS = 7;
/** Training days a review needs before it moves the sets. */
export const MIN_DAYS = 3;
/** Days between steps. */
export const STEP_DAYS = 7;
/** Days between steps while climbing back from a break. */
export const REBUILD_STEP_DAYS = 3;
/** Training days in a row with nothing that make a break. */
export const BREAK_DAYS = 3;
export const BREAK_FACTOR = 0.8;
const FLOOR_SETS = 2;

/** One training day for a track: what was asked and what got done. */
export interface DayWork {
  /** Local YYYY-MM-DD. */
  day: string;
  /** Reps or seconds asked. */
  prescribed: number;
  done: number;
}

export interface ReviewInput {
  track: Track;
  state: TrackState;
  /** The track's training days in the window before today, oldest first. */
  days: readonly DayWork[];
  /** Local YYYY-MM-DD. */
  today: string;
  /** The window fell in a deload week. */
  deload: boolean;
  /**
   * A mode was running that the ramp must not read — an injury, a rest
   * day, a festival. Unlike a deload this is checked before the break, so
   * the rest the app itself asked for never reads as giving up.
   */
  paused?: boolean;
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Whole days from one local day key to another. */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

/** Done ÷ asked, each day capped at what it asked; undefined when nothing was asked. */
export function doneRatio(days: readonly DayWork[]): number | undefined {
  const asked = days.reduce((sum, d) => sum + d.prescribed, 0);
  if (asked <= 0) {
    return undefined;
  }
  const done = days.reduce(
    (sum, d) => sum + Math.min(Math.max(0, d.done), d.prescribed),
    0,
  );
  return done / asked;
}

/** A track's state after today's review, with `lastReview` saying why. */
export function reviewTrack(input: ReviewInput): TrackState {
  const {track, state, days, today, deload, paused} = input;
  const worked = days.filter(d => d.prescribed > 0);
  const ratio = doneRatio(worked);
  const review = (
    change: ReviewChange,
    next: Partial<TrackState> = {},
  ): TrackState => {
    const out = {...state, ...next};
    const sets = out.sets ?? track.baseSets;
    return {
      ...out,
      sets,
      lastReview: {
        day: today,
        ...(ratio !== undefined ? {ratio} : {}),
        change,
        sets,
      },
    };
  };

  // First review: start from the week-1 base, and give it a week.
  if (state.sets === undefined) {
    return review('new', {sets: track.baseSets, steppedOn: today});
  }
  // Before the break check, not after it: an injury or a rest day is the
  // app's own instruction, and three days of following it would otherwise
  // look exactly like three days of quitting. The step clock keeps
  // running: the rest days themselves are left out of `days` (the program
  // repository reads the rest-day log), so once the mode lifts the ramp
  // judges only the days that were training — and a day off no longer
  // pushes the next step up back by a week.
  if (paused) {
    return review('paused');
  }
  const sets = state.sets;
  const floor = Math.min(FLOOR_SETS, track.baseSets);
  const since = state.steppedOn
    ? daysBetween(state.steppedOn, today)
    : STEP_DAYS;
  const rebuilding = state.peakSets !== undefined;
  if (worked.length < MIN_DAYS) {
    return review(rebuilding ? 'rebuild' : 'hold');
  }

  if (worked.slice(-BREAK_DAYS).every(d => d.done <= 0)) {
    if (rebuilding && since < STEP_DAYS) {
      return review('rebuild');
    }
    const cut = Math.max(floor, Math.round(sets * BREAK_FACTOR));
    if (cut >= sets) {
      return review('hold');
    }
    return review('rebuild', {
      sets: cut,
      peakSets: Math.max(state.peakSets ?? 0, sets),
      steppedOn: today,
    });
  }
  if (deload) {
    return review('deload');
  }
  if (rebuilding) {
    const lately = doneRatio(worked.slice(-REBUILD_STEP_DAYS));
    if (lately !== undefined && lately >= UP_AT && since >= REBUILD_STEP_DAYS) {
      const up = Math.min(track.maxSets, sets + 1);
      return review('rebuild', {
        sets: up,
        steppedOn: today,
        peakSets: up >= state.peakSets! ? undefined : state.peakSets,
      });
    }
  }
  if (since < STEP_DAYS) {
    return review(rebuilding ? 'rebuild' : 'hold');
  }
  if (ratio! < DOWN_BELOW) {
    return sets > floor
      ? review('down', {sets: sets - 1, steppedOn: today, peakSets: undefined})
      : review('hold');
  }
  if (!rebuilding && ratio! >= UP_AT) {
    return sets < track.maxSets
      ? review('up', {sets: sets + 1, steppedOn: today})
      : review('top');
  }
  return review(rebuilding ? 'rebuild' : 'hold');
}

/** Share of last week's sets done, averaged over enabled tracks with a review; 0–1. */
export function lastWeekDone(
  states: readonly TrackState[],
): number | undefined {
  const ratios = states.flatMap(s =>
    s.enabled && s.lastReview?.ratio !== undefined ? [s.lastReview.ratio] : [],
  );
  return ratios.length > 0
    ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length
    : undefined;
}
