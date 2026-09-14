import {EXERCISE_LIBRARY} from '../exercises/library';
import {TRACKS} from './tracks';
import type {
  DayPrescription,
  Partner,
  SetMove,
  SetPrescription,
  TrackId,
} from './types';

/**
 * Daily Sets rounds — pure.
 *
 * A day's sets are grouped into rounds: one chime covers a few different
 * moves back to back, then a short partner drill from another element.
 * Total volume is unchanged, but the day gets about nine chimes instead of
 * one per set, and as the weeks ramp a round grows a move rather than the
 * day growing chimes.
 *
 * Grouping rules:
 *   - Enough rounds that no track appears twice in one and no round asks
 *     for more than MAX_MOVES_PER_ROUND moves; otherwise TARGET_ROUNDS.
 *   - Each track's sets spread evenly across the rounds, and rounds fill
 *     evenly.
 *   - Moves run push, row, squat, pull, crunch, leg-ups, hang, plank,
 *     side, so fire and earth alternate; grip-heavy row, pull and hang
 *     are kept in separate rounds when there's room.
 */

/** Rounds a day aims for. */
export const TARGET_ROUNDS = 9;
/** A round never asks for more moves than this back to back. */
export const MAX_MOVES_PER_ROUND = 5;

/** Move order inside a round. */
const ROUND_ORDER: readonly TrackId[] = [
  'push',
  'row',
  'squat',
  'pull',
  'crunch',
  'legs-up',
  'hang',
  'plank',
  'side',
];
const GRIP: ReadonlySet<TrackId> = new Set<TrackId>(['row', 'pull', 'hang']);

export interface Round {
  /** 1-based. */
  index: number;
  /** Lead move first. */
  moves: SetMove[];
  partner?: Partner;
}

const orderOf = (id: TrackId) => ROUND_ORDER.indexOf(id);

function moveFor(p: DayPrescription): SetMove {
  return {
    trackId: p.trackId,
    exerciseId: p.exerciseId,
    element: p.element,
    label: p.label,
    unit: p.unit,
    amount: p.setSize,
    setIndex: 0,
    sets: p.sets,
  };
}

/** Partner for a round led by `trackId`, rotating through its options. */
export function partnerFor(
  trackId: TrackId,
  roundIndex: number,
): Partner | undefined {
  const options = TRACKS.find(t => t.id === trackId)?.partners ?? [];
  if (options.length === 0) {
    return undefined;
  }
  const option = options[(roundIndex - 1) % options.length];
  const drill = EXERCISE_LIBRARY.find(e => e.id === option.exerciseId);
  return drill
    ? {
        exerciseId: drill.id,
        element: drill.element,
        label: drill.name,
        seconds: option.seconds,
      }
    : undefined;
}

export function groupIntoRounds(
  prescriptions: readonly DayPrescription[],
): Round[] {
  const active = prescriptions.filter(p => p.sets > 0);
  const total = active.reduce((sum, p) => sum + p.sets, 0);
  if (total === 0) {
    return [];
  }
  const most = Math.max(...active.map(p => p.sets));
  const count = Math.max(
    most,
    Math.min(TARGET_ROUNDS, total),
    Math.ceil(total / MAX_MOVES_PER_ROUND),
  );
  const cap = Math.ceil(total / count);
  const slots: SetMove[][] = Array.from({length: count}, () => []);

  const pickRound = (ideal: number, trackId: TrackId): number => {
    let best = -1;
    let bestScore = Infinity;
    for (let r = 0; r < count; r++) {
      if (slots[r].some(m => m.trackId === trackId)) {
        continue;
      }
      const gripClash =
        GRIP.has(trackId) && slots[r].some(m => GRIP.has(m.trackId));
      // Stay near the ideal spot, fill rounds evenly, keep grip work
      // apart; a full round is the last resort.
      const score =
        Math.abs(r - ideal) * 2 +
        slots[r].length +
        (gripClash ? 3 : 0) +
        (slots[r].length >= cap ? 100 : 0);
      if (score < bestScore) {
        best = r;
        bestScore = score;
      }
    }
    return best;
  };

  // Tracks with the most sets have the least room, so they place first.
  const byRoom = [...active].sort(
    (a, b) => b.sets - a.sets || orderOf(a.trackId) - orderOf(b.trackId),
  );
  for (const p of byRoom) {
    for (let k = 0; k < p.sets; k++) {
      const ideal = Math.floor(((k + 0.5) * count) / p.sets);
      slots[pickRound(ideal, p.trackId)].push(moveFor(p));
    }
  }

  // Number each track's sets in the order the rounds come.
  const seen = new Map<TrackId, number>();
  return slots
    .filter(moves => moves.length > 0)
    .map((moves, i) => {
      const ordered = [...moves]
        .sort((a, b) => orderOf(a.trackId) - orderOf(b.trackId))
        .map(m => {
          const setIndex = (seen.get(m.trackId) ?? 0) + 1;
          seen.set(m.trackId, setIndex);
          return {...m, setIndex};
        });
      return {
        index: i + 1,
        moves: ordered,
        partner: partnerFor(ordered[0].trackId, i + 1),
      };
    });
}

/** The prescription a round's chime carries; lead move on top. */
export function roundPrescription(
  moves: SetMove[],
  roundIndex: number,
  rounds: number,
  partner?: Partner,
  water?: boolean,
): SetPrescription {
  const lead = moves[0];
  return {
    trackId: lead.trackId,
    label: lead.label,
    unit: lead.unit,
    amount: lead.amount,
    setIndex: lead.setIndex,
    sets: lead.sets,
    moves,
    roundIndex,
    rounds,
    ...(partner ? {partner} : {}),
    ...(water ? {water} : {}),
  };
}

export type MoveSummary = Pick<
  SetMove,
  'trackId' | 'label' | 'unit' | 'amount' | 'setIndex' | 'sets'
>;

/** Every move a prescription asks for; a single set is one move. */
export function movesOf(rx: SetPrescription): MoveSummary[] {
  return (
    rx.moves ?? [
      {
        trackId: rx.trackId,
        label: rx.label,
        unit: rx.unit,
        amount: rx.amount,
        setIndex: rx.setIndex,
        sets: rx.sets,
      },
    ]
  );
}
