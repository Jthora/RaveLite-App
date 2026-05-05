import {append} from '../journal/journal';
import {Exercise} from '../exercises/types';
import {CompletionEntry} from '../journal/types';

/**
 * Use-case helpers — the surface UI components should call. They decide
 * which journal entries to write so views never construct raw entries.
 */

export function recordCompletion(
  exercise: Exercise,
  source: CompletionEntry['source'] = 'manual',
  quality?: number,
): CompletionEntry {
  return append({
    kind: 'completion',
    exerciseId: exercise.id,
    element: exercise.element,
    source,
    quality,
    durationSec: exercise.approxSeconds,
  }) as CompletionEntry;
}

export function recordReminderFired(exercise: Exercise): void {
  append({
    kind: 'reminder.fired',
    exerciseId: exercise.id,
    element: exercise.element,
    // Legacy non-AOS path: synthesize a standalone pulseId so the entry
    // satisfies the journal contract. Always-On callers will pass an
    // existing pulseId explicitly via `recordPulseFired` (Slice 2).
    pulseId: `legacy-${Date.now().toString(36)}`,
  });
}

export function recordReminderDismissed(exercise: Exercise): void {
  append({
    kind: 'reminder.dismissed',
    exerciseId: exercise.id,
    element: exercise.element,
  });
}
