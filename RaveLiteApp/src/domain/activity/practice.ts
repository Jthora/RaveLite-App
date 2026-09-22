import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import type {ChartId} from '../program/charts';
import {append} from '../journal/journal';
import type {CompletionEntry} from '../journal/types';
import {EXERCISE_LIBRARY} from '../exercises/library';
import {ALL_PACKS, groupsFor, type PackId} from '../profile/packs';
import type {Exercise, Tier} from '../exercises/types';
import type {DisciplineId} from '../exercises/disciplines';
import {canDo, type Facts} from '../profile/kit';
import type {ActivityItem} from './activity';

/**
 * Drilling a skill on your own, counted.
 *
 * The rounds count themselves and a run measures itself, but kicks,
 * strikes, dance and forms had nowhere to land: tapping a drill in the
 * library logged one flat "done" whether you threw ten kicks or a
 * hundred. So a practice records what you actually did — the count and
 * the minutes — and the minutes are what earn points, the same as any
 * other long drill, which is how the attributes finally hear about it.
 */

export type CountUnit = 'reps' | 'eights' | 'sec';

/** What a drill is naturally counted in, read from its own dose. */
export function unitFor(exercise: Exercise): CountUnit {
  if (/×\s*8\b|counts?\b/i.test(exercise.dose)) {
    return 'eights';
  }
  if (/\b(sec|min)\b/i.test(exercise.dose)) {
    return 'sec';
  }
  return 'reps';
}

/** "42 reps", "6 × 8", "3:00". */
export function formatCount(amount: number, unit: CountUnit): string {
  if (unit === 'eights') {
    return `${amount} × 8`;
  }
  if (unit === 'sec') {
    const mins = Math.floor(amount / 60);
    return mins > 0
      ? `${mins}:${String(Math.round(amount % 60)).padStart(2, '0')}`
      : `${Math.round(amount)} sec`;
  }
  return `${amount} reps`;
}

/** Log a practice: what was done, and how long it took. */
export function recordPractice(input: {
  exercise: Exercise;
  amount: number;
  unit: CountUnit;
  /** Wall-clock seconds spent; what the points are earned by. */
  seconds: number;
  /** A curriculum move's chart; counted as cleared at it. */
  chart?: ChartId;
  now?: Date;
}): CompletionEntry {
  const {exercise, amount, unit, seconds, chart, now = new Date()} = input;
  if (chart) {
    markCleared(exercise.id, chart);
  }
  return append({
    kind: 'completion',
    at: now.getTime(),
    exerciseId: exercise.id,
    element: exercise.element,
    source: 'manual',
    amount,
    amountUnit: unit,
    durationSec: Math.max(1, Math.round(seconds)),
    ...(chart ? {chart} : {}),
  }) as CompletionEntry;
}

type Clears = Record<string, ChartId[]>;

function readClears(): Clears {
  try {
    const raw = store.getString(KEYS.practiceClears);
    return raw ? (JSON.parse(raw) as Clears) : {};
  } catch {
    // A corrupt tally costs the dots, not the practice.
    return {};
  }
}

/**
 * The charts a move has been cleared at, for the dots beside it. Kept as
 * one small record rather than read back out of the journal, because the
 * page shows it for thirty moves at once.
 */
export function clearsFor(drillId: string): readonly ChartId[] {
  return readClears()[drillId] ?? [];
}

export function allClears(): Readonly<Clears> {
  return readClears();
}

export interface PathLevel {
  tier: Tier;
  chart: ChartId;
}

/** Where a path was left open; Standard at Basic the first time. */
export function levelFor(id: DisciplineId): PathLevel {
  try {
    const raw = store.getString(KEYS.practiceLevels);
    const all = raw ? (JSON.parse(raw) as Record<string, PathLevel>) : {};
    return all[id] ?? {tier: 'basic', chart: 'standard'};
  } catch {
    return {tier: 'basic', chart: 'standard'};
  }
}

export function setLevelFor(id: DisciplineId, level: PathLevel): void {
  let all: Record<string, PathLevel> = {};
  try {
    const raw = store.getString(KEYS.practiceLevels);
    all = raw ? (JSON.parse(raw) as Record<string, PathLevel>) : {};
  } catch {
    // Start the record again rather than refuse to remember anything.
  }
  store.set(KEYS.practiceLevels, JSON.stringify({...all, [id]: level}));
}

function markCleared(drillId: string, chart: ChartId): void {
  const clears = readClears();
  const had = clears[drillId] ?? [];
  if (!had.includes(chart)) {
    clears[drillId] = [...had, chart];
    store.set(KEYS.practiceClears, JSON.stringify(clears));
  }
}

export interface SkillGroup {
  title: string;
  /** Library drill ids, in the order they are worth learning. */
  ids: readonly string[];
  /** A whole discipline's path — Practice shows it as one card. */
  discipline?: DisciplineId;
}

/**
 * The curriculum: what there is to drill, grouped the way it is taught.
 *
 * This is derived from the packs rather than listed again here. The two
 * lists said the same thing for a while, which is exactly how they start
 * disagreeing — a drill added to a pack but not to the curriculum simply
 * never gets taught, and nothing fails. `packs.ts` owns it now.
 */
export const SKILL_GROUPS: readonly SkillGroup[] = groupsFor(ALL_PACKS);

const BY_ID = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));

export const skillDrill = (id: string): Exercise | undefined => BY_ID.get(id);

/**
 * The curriculum this kit can practise. A group with nothing left in it
 * drops out rather than teasing: no staff, no staff section.
 */
export function skillGroupsFor(
  facts: Facts,
  packs: readonly PackId[] = ALL_PACKS,
): SkillGroup[] {
  // A move several packs share (filming a round) shows once, in the
  // first group that has it.
  const shown = new Set<string>();
  return groupsFor(packs)
    .map(group => ({
      ...group,
      ids: group.ids.filter(id => {
        const drill = BY_ID.get(id);
        if (!drill || shown.has(id) || !canDo(drill, facts)) {
          return false;
        }
        shown.add(id);
        return true;
      }),
    }))
    .filter(group => group.ids.length > 0);
}

/** Every drill in the curriculum, for the guards and the tally. */
export const SKILL_IDS: readonly string[] = SKILL_GROUPS.flatMap(g => [
  ...g.ids,
]);

export interface Tally {
  /** Times drilled. */
  times: number;
  /** Everything counted, in the drill's own unit. */
  amount: number;
}

/** What has been drilled, from activity already read for the day list. */
export function tallyPractice(
  items: readonly ActivityItem[],
): Map<string, Tally> {
  const out = new Map<string, Tally>();
  for (const item of items) {
    if (!item.exerciseId || item.amount === undefined || item.trackId) {
      continue;
    }
    const at = out.get(item.exerciseId) ?? {times: 0, amount: 0};
    out.set(item.exerciseId, {
      times: at.times + 1,
      amount: at.amount + item.amount,
    });
  }
  return out;
}
