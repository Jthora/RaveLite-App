import {EYE_BREAK_SECONDS} from '../activity/record';
import {EXERCISE_LIBRARY} from '../exercises/library';
import type {CompletionEntry} from '../journal/types';
import {formatSetAmount} from '../program/progress';
import type {
  Partner,
  SetMove,
  SetPrescription,
  TrackId,
} from '../program/types';
import type {ReminderPayload} from '../reminders/types';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {safetyFirst} from '../exercises/safety';

/**
 * The notification content for a pulse — shared by the live runtime and
 * the OS backup chimes so both say exactly the same thing.
 *
 * A Daily Sets pulse carries its prescription in `data` (all strings, as
 * notifications require) so a button press handled without the runtime
 * can still log the round or re-schedule the same chime. A round adds its
 * moves as a JSON string; the lead move's fields stay alongside, so a
 * notification scheduled before rounds existed still parses.
 */
/** A weather note leads the body when the chime changed for it. */
const withNote = (note: string | undefined, body: string) =>
  note ? `${note} · ${body}` : body;

export function pulsePayload(input: {
  pulseId: string;
  element: ElementId;
  exerciseId?: string;
  prescription?: SetPrescription;
  /** Why the chime changed with the weather; leads the body. */
  note?: string;
}): ReminderPayload {
  const el = ELEMENTS[input.element];
  const drill = input.exerciseId
    ? EXERCISE_LIBRARY.find(e => e.id === input.exerciseId)
    : undefined;
  const rx = input.prescription;
  // One line fits: a safety line if the drill has one.
  const cue = safetyFirst(drill?.cues ?? [])[0];
  return {
    element: input.element,
    color: el.color,
    title: rx ? prescriptionTitle(rx) : drill?.name ?? `${el.name} pulse`,
    body: withNote(
      input.note,
      rx
        ? prescriptionBody(rx, cue)
        : drill?.targets.includes('Hydration')
        ? `${
            cue ?? 'Drink a glass'
          } · then ${EYE_BREAK_SECONDS} s eyes far away`
        : cue ?? `Time for ${el.name}.`,
    ),
    exerciseId: drill?.id ?? 'unknown',
    pulseId: input.pulseId,
    data: rx ? prescriptionData(rx) : undefined,
  };
}

const shortAmount = (amount: number, unit: SetMove['unit']) =>
  unit === 'seconds' ? `${amount}s` : `${amount}`;

function prescriptionTitle(rx: SetPrescription): string {
  if (!rx.moves || rx.moves.length === 0) {
    return `${rx.label} · ${formatSetAmount(rx.amount, rx.unit)}`;
  }
  const list = rx.moves
    .map(m => `${m.label} ${shortAmount(m.amount, m.unit)}`)
    .join(' + ');
  return rx.roundIndex && rx.rounds
    ? `Round ${rx.roundIndex}/${rx.rounds} · ${list}`
    : list;
}

function prescriptionBody(rx: SetPrescription, cue?: string): string {
  if (!rx.moves) {
    return `Set ${rx.setIndex} of ${rx.sets}${cue ? ` · ${cue}` : ''}`;
  }
  const parts: string[] = [];
  if (rx.partner) {
    parts.push(`then ${rx.partner.seconds} s ${rx.partner.label}`);
  }
  if (rx.water) {
    parts.push('drink a glass of water, then rest your eyes');
  }
  return parts.length > 0 ? parts.join(' · ') : 'Back to back, crisp reps.';
}

function prescriptionData(rx: SetPrescription): Record<string, string> {
  const data: Record<string, string> = {
    trackId: rx.trackId,
    amount: String(rx.amount),
    unit: rx.unit,
    label: rx.label,
    setIndex: String(rx.setIndex),
    sets: String(rx.sets),
  };
  if (rx.moves) {
    data.moves = JSON.stringify(
      rx.moves.map(m => ({
        t: m.trackId,
        x: m.exerciseId,
        e: m.element,
        l: m.label,
        u: m.unit,
        a: m.amount,
        i: m.setIndex,
        n: m.sets,
      })),
    );
  }
  if (rx.partner) {
    data.partner = `${rx.partner.exerciseId}:${rx.partner.seconds}`;
  }
  if (rx.roundIndex && rx.rounds) {
    data.round = `${rx.roundIndex}/${rx.rounds}`;
  }
  if (rx.water) {
    data.water = '1';
  }
  return data;
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
  const lead: SetPrescription = {
    trackId: data.trackId as TrackId,
    label: data.label,
    unit: data.unit,
    amount,
    setIndex: Number.isFinite(setIndex) ? setIndex : 1,
    sets: Number.isFinite(sets) ? sets : 1,
  };
  const moves = parseMoves(data.moves);
  if (!moves) {
    return lead;
  }
  const [roundIndex, rounds] = (data.round ?? '').split('/').map(Number);
  const partner = parsePartner(data.partner);
  return {
    ...lead,
    moves,
    ...(roundIndex > 0 && rounds > 0 ? {roundIndex, rounds} : {}),
    ...(partner ? {partner} : {}),
    ...(data.water === '1' ? {water: true} : {}),
  };
}

function parseMoves(raw: string | undefined): SetMove[] | undefined {
  if (!raw) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return undefined;
    }
    const moves = parsed
      .filter(
        m =>
          m &&
          typeof m.t === 'string' &&
          Number.isFinite(m.a) &&
          (m.u === 'reps' || m.u === 'seconds'),
      )
      .map(
        (m): SetMove => ({
          trackId: m.t as TrackId,
          exerciseId: String(m.x ?? ''),
          element: (m.e ?? 'fire') as ElementId,
          label: String(m.l ?? m.t),
          unit: m.u,
          amount: Number(m.a),
          setIndex: Number(m.i) || 1,
          sets: Number(m.n) || 1,
        }),
      );
    return moves.length > 0 ? moves : undefined;
  } catch {
    return undefined;
  }
}

function parsePartner(raw: string | undefined): Partner | undefined {
  if (!raw) {
    return undefined;
  }
  const split = raw.lastIndexOf(':');
  const drill = EXERCISE_LIBRARY.find(e => e.id === raw.slice(0, split));
  const seconds = Number(raw.slice(split + 1));
  return drill && Number.isFinite(seconds)
    ? {exerciseId: drill.id, element: drill.element, label: drill.name, seconds}
    : undefined;
}

/**
 * The set fields a Done writes. A single set logs its track and amount; a
 * round logs every move still done (a move adjusted to 0 was skipped), its
 * partner and its glass of water.
 */
export function doneFields(
  rx: SetPrescription,
  adjust: {amount?: number; amounts?: Partial<Record<TrackId, number>>} = {},
): Pick<
  CompletionEntry,
  'trackId' | 'amount' | 'moves' | 'partnerExerciseId' | 'partnerSec' | 'water'
> {
  if (!rx.moves || rx.moves.length === 0) {
    return {trackId: rx.trackId, amount: adjust.amount ?? rx.amount};
  }
  return {
    moves: rx.moves
      .map(m => ({
        trackId: m.trackId,
        amount: adjust.amounts?.[m.trackId] ?? m.amount,
      }))
      .filter(m => m.amount > 0),
    ...(rx.partner
      ? {
          partnerExerciseId: rx.partner.exerciseId,
          partnerSec: rx.partner.seconds,
        }
      : {}),
    ...(rx.water ? {water: true} : {}),
  };
}
