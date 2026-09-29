/**
 * A standard with a clock on it.
 *
 * Goals already grades every test — D− to A+, with a B+ to aim at. What
 * it cannot say is that a mark is *required*, or that it has gone stale.
 * A target you are working toward and a standard you must hold are
 * different things: the first is ambition, the second is a state you can
 * be found wanting in on a given night.
 *
 * That difference is the whole distinction between an archetype and a
 * duty. An Operator and an Archangel Knight train almost identically;
 * the Knight is the one who has to be ready tonight. Packs cannot
 * express that, and no amount of adding drills to a preset will — the
 * missing idea was never more training, it was a deadline.
 *
 * Everything here reads what is already logged. Nothing new is recorded,
 * nothing is sent anywhere, and a standard that is not met changes
 * nothing about the program: it is a statement, not a punishment. The
 * app does not stop somebody from working a night, and it could not.
 */
import {
  GOAL_GRADE,
  GRADE_STEPS,
  markFor,
  resultsFor,
  STANDARD_EVENTS,
  type Sex,
  type StandardEvent,
} from './standards';
import type {Grade} from '../training/grading';
import type {MetricKind, TrainingLogEntry} from '../training/types';

const DAY_MS = 86_400_000;

export interface Requirement {
  /** A `StandardEvent` id. */
  eventId: string;
  /** The mark that has to be held. */
  grade: Grade;
  /** Tested within this many days, or it has gone stale. */
  withinDays: number;
}

export interface Standard {
  id: string;
  name: string;
  /** One line: what holding it means, in the second person. */
  why: string;
  requirements: readonly Requirement[];
}

/**
 * Why these six, and why ninety days.
 *
 * The work is a long night on your feet among strangers, and the parts
 * of it that can fail you are your legs, your lungs, your grip, your
 * back and your nerve. Push-ups and pull-ups carry somebody; the run is
 * whether you are still useful in hour six; the plank is the back that
 * holds a carry together; the dead hang is grip, which is what runs out
 * first; the still sit is the one that keeps you calm when it matters.
 *
 * Ninety days because a mark from last winter is not a fact about
 * tonight, and because testing six things four times a year is a
 * burden somebody will actually carry.
 */
export const KNIGHT_STANDARD: Standard = {
  id: 'archangel-knight',
  name: 'Knight standard',
  why: 'What a Knight holds to work a night.',
  requirements: [
    {eventId: 'pushups-2min', grade: GOAL_GRADE, withinDays: 90},
    {eventId: 'pullups', grade: GOAL_GRADE, withinDays: 90},
    {eventId: 'run-3mi', grade: GOAL_GRADE, withinDays: 90},
    {eventId: 'plank', grade: GOAL_GRADE, withinDays: 90},
    {eventId: 'dead-hang', grade: GOAL_GRADE, withinDays: 90},
    {eventId: 'still-sit', grade: GOAL_GRADE, withinDays: 90},
  ],
};

export const STANDARDS: readonly Standard[] = [KNIGHT_STANDARD];

export type RequirementState =
  /** Tested inside the window, at the mark or better. */
  | 'met'
  /** Tested inside the window, under the mark. */
  | 'short'
  /** Met once, but the newest result is older than the window. */
  | 'stale'
  /** Never logged. */
  | 'untested';

export interface RequirementStatus {
  requirement: Requirement;
  event: StandardEvent;
  state: RequirementState;
  /** The best result inside the window; for `stale`, the newest at all. */
  value?: number;
  testedAt?: number;
  /** Days until this one goes stale. Only when met. */
  daysLeft?: number;
}

export interface Readiness {
  standard: Standard;
  statuses: readonly RequirementStatus[];
  /** True only when every requirement is met. */
  ready: boolean;
  /** How many are not met, for a one-line summary. */
  outstanding: number;
}

/**
 * The value needed for a grade, taking the hardest of the event's
 * charts — the same rule `goalFor` uses, so a mark means one thing
 * across the app rather than depending on which test you had in mind.
 */
export function markNeeded(
  event: StandardEvent,
  sex: Sex,
  grade: Grade,
): number | undefined {
  if (!event.scales || event.scales.length === 0) {
    return undefined;
  }
  const marks = event.scales.map(s => markFor(event, s, sex, grade));
  return event.better === 'higher' ? Math.max(...marks) : Math.min(...marks);
}

const meets = (event: StandardEvent, value: number, mark: number): boolean =>
  event.better === 'higher' ? value >= mark : value <= mark;

/** Whether `grade` is at least `wanted`. A+ is the top, D− the bottom. */
export function gradeAtLeast(grade: Grade, wanted: Grade): boolean {
  const a = GRADE_STEPS.indexOf(grade);
  const b = GRADE_STEPS.indexOf(wanted);
  return a >= 0 && b >= 0 && a <= b;
}

export interface ReadinessInput {
  entries: readonly TrainingLogEntry[];
  metricFor: (kindId: string) => MetricKind | undefined;
  sex: Sex;
  heightInches?: number;
  now?: number;
}

/** Where somebody stands against a standard, right now. */
export function readinessFor(
  standard: Standard,
  input: ReadinessInput,
): Readiness {
  const now = input.now ?? Date.now();
  const statuses = standard.requirements.map(requirement =>
    statusOf(requirement, input, now),
  );
  const outstanding = statuses.filter(s => s.state !== 'met').length;
  return {standard, statuses, ready: outstanding === 0, outstanding};
}

function statusOf(
  requirement: Requirement,
  input: ReadinessInput,
  now: number,
): RequirementStatus {
  const event = STANDARD_EVENTS.find(e => e.id === requirement.eventId);
  if (!event) {
    // A requirement naming an event that no longer exists is a bug, not
    // a failing Knight. Say untested rather than invent a verdict.
    throw new Error(`Unknown standard event: ${requirement.eventId}`);
  }
  const results = resultsFor(
    event,
    input.entries,
    input.metricFor,
    input.heightInches,
  );
  if (results.length === 0) {
    return {requirement, event, state: 'untested'};
  }

  const cutoff = now - requirement.withinDays * DAY_MS;
  const fresh = results.filter(r => r.at >= cutoff);
  if (fresh.length === 0) {
    // There is a history, it is just old. Show the newest so the person
    // sees what they have to beat and when they last managed it.
    const newest = results.reduce((a, b) => (a.at > b.at ? a : b));
    return {
      requirement,
      event,
      state: 'stale',
      value: newest.value,
      testedAt: newest.at,
    };
  }

  const best = fresh.reduce((a, b) => (meets(event, a.value, b.value) ? a : b));
  const mark = markNeeded(event, input.sex, requirement.grade);
  const passed = mark !== undefined && meets(event, best.value, mark);
  return {
    requirement,
    event,
    state: passed ? 'met' : 'short',
    value: best.value,
    testedAt: best.at,
    daysLeft: passed
      ? Math.max(
          0,
          Math.ceil((best.at + requirement.withinDays * DAY_MS - now) / DAY_MS),
        )
      : undefined,
  };
}

/** "Ready", or what is missing, in one line. */
export function readinessLine(readiness: Readiness): string {
  if (readiness.ready) {
    const soonest = readiness.statuses
      .map(s => s.daysLeft)
      .filter((d): d is number => d !== undefined)
      .sort((a, b) => a - b)[0];
    return soonest === undefined
      ? 'Ready.'
      : `Ready. Next retest in ${soonest} ${soonest === 1 ? 'day' : 'days'}.`;
  }
  const n = readiness.outstanding;
  return `${n} of ${readiness.statuses.length} not held.`;
}
