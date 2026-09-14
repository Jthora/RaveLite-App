import {ElementId} from '../../theme/elements';
import {activityForDay, activityInRange} from '../activity/activity';
import {countsByDay, countsByElement, streakDays} from '../activity/stats';
import {dayKey, entriesForDay} from './journal';
import {CompletionEntry, JournalEntry} from './types';

/**
 * Count helpers the screens use. Every count reads the activity model
 * (`domain/activity`), so journal completions, Train log entries and max
 * tests all count the same way everywhere.
 */

const isCompletion = (e: JournalEntry): e is CompletionEntry =>
  e.kind === 'completion';

function daysBack(n: number, now: Date): Date {
  const from = new Date(now);
  from.setDate(from.getDate() - (n - 1));
  return from;
}

/** Today's activity count. */
export function completionsToday(now: Date = new Date()): number {
  return activityForDay(now).length;
}

/** Per-element activity today. */
export function completionsTodayByElement(
  now: Date = new Date(),
): Record<ElementId, number> {
  return countsByElement(activityForDay(now));
}

/** Current streak in days: back-to-back days with at least one thing done. */
export function currentStreakDays(now: Date = new Date()): number {
  return streakDays(now);
}

/** Activity count across the last N days. */
export function completionsLastNDays(
  n: number,
  now: Date = new Date(),
): number {
  return activityInRange(daysBack(n, now), now).length;
}

/** Per-day totals across the last N days, oldest → newest. Length === n. */
export function completionsByDay(n: number, now: Date = new Date()): number[] {
  return countsByDay(n, now);
}

/** Per-element totals across the last N days. */
export function completionsLastNDaysByElement(
  n: number,
  now: Date = new Date(),
): Record<ElementId, number> {
  return countsByElement(activityInRange(daysBack(n, now), now));
}

// ─── Element-scoped helpers ─────────────────────────────────────────────

/** Today's activity count for a single element. */
export function completionsTodayForElement(
  element: ElementId,
  now: Date = new Date(),
): number {
  return activityForDay(now).filter(item => item.element === element).length;
}

/** Per-day counts for one element across the last N days, oldest → newest. */
export function completionsByDayForElement(
  element: ElementId,
  n: number,
  now: Date = new Date(),
): number[] {
  return countsByDay(n, now, element);
}

/** Per-element streak: back-to-back days with activity in this element. */
export function currentStreakDaysForElement(
  element: ElementId,
  now: Date = new Date(),
): number {
  return streakDays(now, element);
}

/** Today's completion entries for a single element, newest-first.
 *  Used by LogPanel to render the day's element journal. */
export function completionsTodayEntriesForElement(
  element: ElementId,
  now: Date = new Date(),
): CompletionEntry[] {
  return entriesForDay(now)
    .filter(
      (e): e is CompletionEntry => isCompletion(e) && e.element === element,
    )
    .sort((a, b) => b.at - a.at);
}

export {dayKey};
