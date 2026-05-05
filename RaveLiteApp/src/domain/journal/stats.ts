import {ElementId} from '../../theme/elements';
import {dayKey, entriesForDay, entriesInRange} from './journal';
import {CompletionEntry, JournalEntry} from './types';

/**
 * Pure derivation functions. No side effects, no caching.
 *
 * These are the gamification primitives. Future XP curves, achievements,
 * and leaderboards layer on top of these — but the journal is the only
 * source of truth.
 *
 * If/when these get expensive, memoize with `store.statsCache(...)`
 * keyed on the latest journal entry id of the day.
 */

const isCompletion = (e: JournalEntry): e is CompletionEntry =>
  e.kind === 'completion';

/** Today's completions count. */
export function completionsToday(now: Date = new Date()): number {
  return entriesForDay(now).filter(isCompletion).length;
}

/** Per-element completions today. */
export function completionsTodayByElement(
  now: Date = new Date(),
): Record<ElementId, number> {
  const out: Record<ElementId, number> = {
    fire: 0,
    air: 0,
    earth: 0,
    water: 0,
    heart: 0,
  };
  for (const e of entriesForDay(now)) {
    if (isCompletion(e)) {out[e.element]++;}
  }
  return out;
}

/**
 * Current streak in days. A "streak day" requires ≥1 completion.
 * Counts back from `now` until a gap is found.
 */
export function currentStreakDays(now: Date = new Date()): number {
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (;;) {
    const has = entriesForDay(cursor).some(isCompletion);
    if (!has) {break;}
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Lifetime completions across all elements (uses last 365 days as scan window). */
export function completionsLastNDays(
  n: number,
  now: Date = new Date(),
): number {
  const from = new Date(now);
  from.setDate(from.getDate() - (n - 1));
  return entriesInRange(from, now).filter(isCompletion).length;
}

/** Per-day total completions across the last N days, oldest → newest.
 *  Length === n. Drives the "all-elements" insights sparkline. */
export function completionsByDay(
  n: number,
  now: Date = new Date(),
): number[] {
  const out: number[] = [];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    out.push(entriesForDay(d).filter(isCompletion).length);
  }
  return out;
}

/** Per-element completion totals across the last N days. */
export function completionsLastNDaysByElement(
  n: number,
  now: Date = new Date(),
): Record<ElementId, number> {
  const out: Record<ElementId, number> = {
    fire: 0,
    air: 0,
    earth: 0,
    water: 0,
    heart: 0,
  };
  const from = new Date(now);
  from.setDate(from.getDate() - (n - 1));
  for (const e of entriesInRange(from, now)) {
    if (isCompletion(e)) {out[e.element]++;}
  }
  return out;
}

// ─── Element-scoped helpers ─────────────────────────────────────────────

/** Today's completions for a single element. */
export function completionsTodayForElement(
  element: ElementId,
  now: Date = new Date(),
): number {
  return entriesForDay(now).filter(
    e => isCompletion(e) && e.element === element,
  ).length;
}

/** Per-day completion counts for a single element across the last N days,
 *  oldest → newest. Length === n. Used by the per-element sparkline. */
export function completionsByDayForElement(
  element: ElementId,
  n: number,
  now: Date = new Date(),
): number[] {
  const out: number[] = [];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    const count = entriesForDay(d).filter(
      e => isCompletion(e) && e.element === element,
    ).length;
    out.push(count);
  }
  return out;
}

/** Per-element streak: days back-to-back with ≥1 completion in this element. */
export function currentStreakDaysForElement(
  element: ElementId,
  now: Date = new Date(),
): number {
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (;;) {
    const has = entriesForDay(cursor).some(
      e => isCompletion(e) && e.element === element,
    );
    if (!has) {break;}
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Today's completion entries for a single element, newest-first.
 *  Used by LogPanel to render the day's element journal. */
export function completionsTodayEntriesForElement(
  element: ElementId,
  now: Date = new Date(),
): CompletionEntry[] {
  return entriesForDay(now)
    .filter((e): e is CompletionEntry => isCompletion(e) && e.element === element)
    .sort((a, b) => b.at - a.at);
}

/** Frequency map of `Target` tags across the operator's last N days of
 *  completions for a single element. Used by the scoring engine to
 *  derive auto-preferred targets. */
export function preferredTargetsForElement(
  element: ElementId,
  n: number,
  resolveTargetsFor: (exerciseId: string) => string[],
  now: Date = new Date(),
): string[] {
  const from = new Date(now);
  from.setDate(from.getDate() - (n - 1));
  const counts = new Map<string, number>();
  for (const e of entriesInRange(from, now)) {
    if (!isCompletion(e) || e.element !== element) {continue;}
    for (const t of resolveTargetsFor(e.exerciseId)) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);
}

export {dayKey};
