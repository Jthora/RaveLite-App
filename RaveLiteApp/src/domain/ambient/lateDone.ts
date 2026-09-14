/**
 * Logging a chime after its answer window closed: "I did it, I just didn't
 * tap Done".
 *
 * The completion carries the chime's pulse id, so Today shows the chime done
 * and no scheduler re-queues it. A round logs its moves, partner and glass,
 * so Daily Sets and the other elements get their credit and later rounds
 * shrink. It is dated at the chime's own time, so the day reads as it
 * happened, and marked manual, so response stats aren't flattered by a late
 * tap.
 */
import type {ElementId} from '../../theme/elements';
import {EXERCISE_LIBRARY} from '../exercises/library';
import {append} from '../journal/journal';
import type {CompletionEntry} from '../journal/types';
import type {SetPrescription, TrackId} from '../program/types';
import {cancelPulseNotification} from '../reminders/notifeeScheduler';
import {doneFields} from './pulsePayload';
import {reconcileSetsNow} from './setScheduler';

export interface MissedChime {
  pulseId: string;
  /** When the chime sounded; the completion is dated then. */
  at: number;
  element: ElementId;
  exerciseId?: string;
  /** A round's moves, partner and glass. */
  prescription?: SetPrescription;
}

export function logMissedChime(
  chime: MissedChime,
  adjust: {amount?: number; amounts?: Partial<Record<TrackId, number>>} = {},
): CompletionEntry {
  const rx = chime.prescription;
  const exerciseId = chime.exerciseId ?? rx?.moves?.[0]?.exerciseId ?? 'retro';
  const drill = EXERCISE_LIBRARY.find(ex => ex.id === exerciseId);
  const entry = append({
    kind: 'completion',
    at: chime.at,
    exerciseId,
    element: chime.element,
    source: 'manual',
    pulseId: chime.pulseId,
    durationSec: drill?.approxSeconds,
    ...(rx ? doneFields(rx, adjust) : {}),
  }) as CompletionEntry;
  // Its backup chime may still be showing, or waiting to ring.
  cancelPulseNotification(chime.pulseId).catch(() => undefined);
  if (rx) {
    reconcileSetsNow();
  }
  return entry;
}
