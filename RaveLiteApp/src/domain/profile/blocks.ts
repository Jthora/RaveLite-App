import {localDayKey} from '../training/grading';
import type {ArchetypeId} from './archetypes';

/**
 * Block programs — the two archetypes that are a stretch of weeks, not a
 * standing preset. Pure: everything is read from dates, so a phone that
 * was off for a week comes back to the right day.
 *
 *   The Comeback   a 4-week ramp-in. Sets start at half and build to
 *                  full over four weeks, on the easiest rungs, with no
 *                  max-test prompts: joints and tendons catch up more
 *                  slowly than muscle does.
 *   Festival Six   a build to an event date. The last seven days are a
 *                  taper (lighter sets, no max tests), the event itself
 *                  runs in festival mode for three days, and the day after
 *                  is a rest day. Then the program carries on as normal.
 *
 * Both promised this in their descriptions before any of it existed.
 */

export const RAMP_IN_WEEKS = 4;
/** Share of a normal day in each ramp-in week. */
export const RAMP_IN_FACTORS: readonly number[] = [0.5, 0.6, 0.75, 0.9];
export const TAPER_DAYS = 7;
export const TAPER_FACTOR = 0.6;
/** Days festival mode runs from the event date (as the mode itself does). */
export const EVENT_DAYS = 3;
/** Weeks to the event when the date has not been set. */
export const DEFAULT_WEEKS_TO_EVENT = 6;

export type BlockPhase =
  | {kind: 'ramp-in'; week: number; factor: number}
  | {kind: 'build'; daysToGo: number}
  | {kind: 'taper'; daysToGo: number; factor: number}
  | {kind: 'event'; day: number}
  | {kind: 'recovery'};

export interface BlockInput {
  archetype?: ArchetypeId;
  /** When the archetype was taken, epoch ms. */
  archetypeAt?: number;
  /** The event, as a local day key (YYYY-MM-DD). */
  eventDate?: string;
}

const DAY_MS = 86_400_000;

function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Whole local days from one day key to another. */
const daysFrom = (from: string, to: string) => dayNumber(to) - dayNumber(from);

/** Where `now` sits in this person's block, if they are in one. */
export function blockPhase(
  input: BlockInput,
  now: number,
): BlockPhase | undefined {
  const today = localDayKey(now);
  if (input.archetype === 'comeback' && input.archetypeAt !== undefined) {
    const day = daysFrom(localDayKey(input.archetypeAt), today);
    const week = Math.floor(day / 7) + 1;
    if (day >= 0 && week <= RAMP_IN_WEEKS) {
      return {kind: 'ramp-in', week, factor: RAMP_IN_FACTORS[week - 1]};
    }
    return undefined;
  }
  if (input.archetype === 'festival-six' && input.eventDate) {
    const toGo = daysFrom(today, input.eventDate);
    if (toGo > TAPER_DAYS) {
      return {kind: 'build', daysToGo: toGo};
    }
    if (toGo > 0) {
      return {kind: 'taper', daysToGo: toGo, factor: TAPER_FACTOR};
    }
    if (toGo > -EVENT_DAYS) {
      return {kind: 'event', day: 1 - toGo};
    }
    if (toGo === -EVENT_DAYS) {
      return {kind: 'recovery'};
    }
  }
  return undefined;
}

/** How much of a normal day the block asks for today, 0–1. */
export function blockFactor(phase: BlockPhase | undefined): number {
  return phase && (phase.kind === 'ramp-in' || phase.kind === 'taper')
    ? phase.factor
    : 1;
}

/** No max-test prompts while ramping in or tapering. */
export function testsHeldBack(phase: BlockPhase | undefined): boolean {
  return phase?.kind === 'ramp-in' || phase?.kind === 'taper';
}

/**
 * A stored event date that has not been and gone — still ahead, or still
 * running, counting the event days and the recovery day after them.
 * Taking Festival Six again for the next festival must not inherit the
 * last one's date, which would be no block at all.
 */
export function eventAhead(
  day: string | undefined,
  now: number,
): string | undefined {
  return day !== undefined && daysFrom(localDayKey(now), day) >= -EVENT_DAYS
    ? day
    : undefined;
}

/** The default event date: six weeks from when Festival Six is taken. */
export function defaultEventDate(now: number): string {
  return localDayKey(now + DEFAULT_WEEKS_TO_EVENT * 7 * DAY_MS);
}

/** One plain line about the block, for Daily Sets and Settings. */
export function blockLine(phase: BlockPhase | undefined): string | undefined {
  if (!phase) {
    return undefined;
  }
  switch (phase.kind) {
    case 'ramp-in':
      return `Coming back: week ${phase.week} of ${RAMP_IN_WEEKS}. Sets are lighter while joints and tendons catch up.`;
    case 'build': {
      const weeks = Math.floor(phase.daysToGo / 7);
      const days = phase.daysToGo % 7;
      const when =
        weeks > 0
          ? `${weeks} ${weeks === 1 ? 'week' : 'weeks'}${
              days > 0 ? ` ${days} ${days === 1 ? 'day' : 'days'}` : ''
            }`
          : `${days} ${days === 1 ? 'day' : 'days'}`;
      return `Festival in ${when}. The last week before it is lighter.`;
    }
    case 'taper':
      return `Festival in ${phase.daysToGo} ${
        phase.daysToGo === 1 ? 'day' : 'days'
      }. Lighter sets this week, so you arrive rested.`;
    case 'event':
      return `Festival day ${phase.day}. Water, feet and sleep come first.`;
    case 'recovery':
      return 'Recovery day after the festival. Rest; sets start again tomorrow.';
  }
}
