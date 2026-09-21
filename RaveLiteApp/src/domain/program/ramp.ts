import {phaseForWeek, programWeek, setSizeFor} from './progression';
import {PUSHUP_GOAL} from './pushups';
import {trackById} from './tracks';
import type {ProgramState} from './types';

/**
 * The push-up ramp ahead — pure. How soon Push and Variants sets could add
 * up to `goal` a day at today's tested maxes, climbing as fast as the
 * adaptive ramp allows (85% or more every week: a set more a week, holding
 * on deload weeks). Sets top out at each track's most, so past that only a
 * higher max test (bigger sets) gets closer; then it says what max does.
 */

const DAY_MS = 86_400_000;
const MAX_WEEKS = 104;

export type PushupRamp =
  /** Today's sets already add up to 200. */
  | {kind: 'reached'}
  /** Keeping up every week, the sets reach 200 around `at`. */
  | {kind: 'on-pace'; at: number; weeks: number}
  /** At the most sets, today's maxes reach `most` a day; a push-up max of `needMax` reaches 200. */
  | {kind: 'capped'; most: number; needMax: number};

export function pushupRamp(
  program: ProgramState,
  now: number,
  goal: number = PUSHUP_GOAL,
): PushupRamp {
  const push = trackById('push');
  const variants = trackById('push-variants');
  const pushState = program.tracks.push;
  const variantState = program.tracks['push-variants'];
  const pushSize = pushState.enabled ? setSizeFor(push, pushState) : 0;
  const variantSize = variantState.enabled
    ? setSizeFor(variants, variantState)
    : 0;
  let pushSets = Math.min(push.maxSets, pushState.sets ?? push.baseSets);
  let variantSets = Math.min(
    variants.maxSets,
    variantState.sets ?? variants.baseSets,
  );
  const perDay = () => pushSets * pushSize + variantSets * variantSize;
  if (perDay() >= goal) {
    return {kind: 'reached'};
  }

  const variantMost = variants.maxSets * variantSize;
  const most = push.maxSets * pushSize + variantMost;
  if (most < goal) {
    let needMax = Math.max(1, pushState.testMax);
    while (
      push.maxSets * setSizeFor(push, {...pushState, testMax: needMax}) +
        variantMost <
        goal &&
      needMax < goal
    ) {
      needMax++;
    }
    return {kind: 'capped', most, needMax};
  }

  const week = programWeek(program.startDay, new Date(now));
  for (let ahead = 1; ahead <= MAX_WEEKS; ahead++) {
    if (phaseForWeek(week + ahead) === 'deload') {
      continue;
    }
    pushSets = Math.min(push.maxSets, pushSets + 1);
    variantSets = Math.min(variants.maxSets, variantSets + 1);
    if (perDay() >= goal) {
      return {kind: 'on-pace', weeks: ahead, at: now + ahead * 7 * DAY_MS};
    }
  }
  return {kind: 'capped', most, needMax: pushState.testMax};
}
