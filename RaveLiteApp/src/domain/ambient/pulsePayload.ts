import {EXERCISE_LIBRARY} from '../exercises/library';
import {formatSetAmount} from '../program/progress';
import type {SetPrescription, TrackId} from '../program/types';
import type {ReminderPayload} from '../reminders/types';
import {ELEMENTS, type ElementId} from '../../theme/elements';

/**
 * The notification content for a pulse — shared by the live runtime and
 * the OS backup chimes so both say exactly the same thing.
 *
 * A Daily Sets pulse carries its prescription in `data` (all strings, as
 * notifications require) so a button press handled without the runtime
 * can still log the set or re-schedule the same chime.
 */
export function pulsePayload(input: {
  pulseId: string;
  element: ElementId;
  exerciseId?: string;
  prescription?: SetPrescription;
}): ReminderPayload {
  const el = ELEMENTS[input.element];
  const drill = input.exerciseId
    ? EXERCISE_LIBRARY.find(e => e.id === input.exerciseId)
    : undefined;
  const rx = input.prescription;
  const cue = drill?.cues?.[0];
  return {
    element: input.element,
    color: el.color,
    title: rx
      ? `${rx.label} · ${formatSetAmount(rx.amount, rx.unit)}`
      : drill?.name ?? `${el.name} pulse`,
    body: rx
      ? `Set ${rx.setIndex} of ${rx.sets}${cue ? ` · ${cue}` : ''}`
      : cue ?? `Time for ${el.name}.`,
    exerciseId: drill?.id ?? 'unknown',
    pulseId: input.pulseId,
    data: rx
      ? {
          trackId: rx.trackId,
          amount: String(rx.amount),
          unit: rx.unit,
          label: rx.label,
          setIndex: String(rx.setIndex),
          sets: String(rx.sets),
        }
      : undefined,
  };
}

/** Rebuild a set prescription from notification data, if it carries one. */
export function prescriptionFromData(
  data: Readonly<Record<string, string>>,
): SetPrescription | undefined {
  const amount = Number(data.amount);
  if (
    !data.trackId ||
    !data.label ||
    !Number.isFinite(amount) ||
    (data.unit !== 'reps' && data.unit !== 'seconds')
  ) {
    return undefined;
  }
  const setIndex = Number(data.setIndex);
  const sets = Number(data.sets);
  return {
    trackId: data.trackId as TrackId,
    label: data.label,
    unit: data.unit,
    amount,
    setIndex: Number.isFinite(setIndex) ? setIndex : 1,
    sets: Number.isFinite(sets) ? sets : 1,
  };
}
