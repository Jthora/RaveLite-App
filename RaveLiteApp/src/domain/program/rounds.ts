import {POINTS} from '../activity/par';
import type {ElementId} from '../../theme/elements';
import {EXERCISE_LIBRARY} from '../exercises/library';
import {TRACKS} from './tracks';
import {FOCUS_PARTNERS, type AttributeId} from './week';
import type {
  DayPrescription,
  Partner,
  SetMove,
  SetPrescription,
  TrackId,
  TrackPartner,
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
 *   - Moves run in ROUND_ORDER, so elements alternate and stillness comes
 *     last; grip-heavy row, pull and hang are kept in separate rounds when
 *     there's room.
 *
 * Smart partners: given the week's work per element, each round's partner
 * comes from the least-worked element not already in the round (the lead
 * move's own partner when one fits, else the pool), and every partner
 * placed counts toward the next round's pick, so the day spreads them.
 *
 * Focus partners: on a focus day (see `week.ts`) every second round ends
 * with a dry drill for the day's focus instead, a hip opener on a Mobility
 * day or a balance on a Balance day, taking turns through the day.
 */

/** Rounds a day aims for. */
export const TARGET_ROUNDS = 9;
/** A round never asks for more moves than this back to back. */
export const MAX_MOVES_PER_ROUND = 6;

/** Move order inside a round. */
const ROUND_ORDER: readonly TrackId[] = [
  'push',
  'posture',
  'row',
  'squat',
  'mobility',
  'pull',
  'kicks',
  'crunch',
  'legs-up',
  'hang',
  'plank',
  'pelvis',
  'side',
  'breath',
  'push-variants',
  'stillness',
];
const GRIP: ReadonlySet<TrackId> = new Set<TrackId>(['row', 'pull', 'hang']);

/** Short drills any round can end with, by element, for smart partners. */
export const PARTNER_POOL: Readonly<
  Record<ElementId, readonly TrackPartner[]>
> = {
  air: [
    {exerciseId: 'air.physiological-sigh', seconds: 30},
    {exerciseId: 'air.chin-tuck', seconds: 30},
    {exerciseId: 'air.doorway-pec-stretch', seconds: 30},
    {exerciseId: 'air.standing-belly-release', seconds: 30},
  ],
  water: [
    {exerciseId: 'water.side-line-stretch', seconds: 30},
    {exerciseId: 'water.hamstring-floss', seconds: 30},
    {exerciseId: 'water.deep-squat-hold', seconds: 30},
    {exerciseId: 'water.calf-wall-stretch', seconds: 30},
  ],
  heart: [
    {exerciseId: 'heart.pulse-check', seconds: 30},
    {exerciseId: 'heart.rave-vision', seconds: 30},
  ],
  earth: [
    {exerciseId: 'earth.posterior-pelvic-tilt', seconds: 30},
    {exerciseId: 'earth.single-leg-balance', seconds: 30},
    {exerciseId: 'earth.wall-sit', seconds: 30},
    {exerciseId: 'earth.horse-stance', seconds: 45},
  ],
  fire: [{exerciseId: 'fire.wall-pushups', seconds: 20}],
};

/** Tie-break order when elements have had the same work. */
const BALANCE_ORDER: readonly ElementId[] = [
  'air',
  'water',
  'heart',
  'earth',
  'fire',
];

/** Points per element that smart partners balance against (lowest wins). */
export type ElementBalance = Readonly<Partial<Record<ElementId, number>>>;

export interface Round {
  /** 1-based. */
  index: number;
  /** Lead move first. */
  moves: SetMove[];
  partner?: Partner;
}

const orderOf = (id: TrackId) => ROUND_ORDER.indexOf(id);

/** Moves in round order, so elements alternate and stillness comes last. */
export function orderMoves(moves: readonly SetMove[]): SetMove[] {
  return [...moves].sort((a, b) => orderOf(a.trackId) - orderOf(b.trackId));
}

/** One set of a prescription as a round move; numbered when placed. */
export function moveFor(p: DayPrescription): SetMove {
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

function toPartner(option: TrackPartner | undefined): Partner | undefined {
  const drill = option
    ? EXERCISE_LIBRARY.find(e => e.id === option.exerciseId)
    : undefined;
  return drill && option
    ? {
        exerciseId: drill.id,
        element: drill.element,
        label: drill.name,
        seconds: option.seconds,
      }
    : undefined;
}

const elementOf = (exerciseId: string): ElementId | undefined =>
  EXERCISE_LIBRARY.find(e => e.id === exerciseId)?.element;

/**
 * Partner for a round led by `trackId`. Without `balance` it rotates through
 * the lead move's own partners. With it, it picks from the least-worked
 * elements not in the round: the lead's own partner when one fits, else a
 * drill from the pool.
 */
export function partnerFor(
  trackId: TrackId,
  roundIndex: number,
  balance?: ElementBalance,
  roundElements: readonly ElementId[] = [],
): Partner | undefined {
  const track = TRACKS.find(t => t.id === trackId);
  const own = track?.partners ?? [];
  const pick = (options: readonly TrackPartner[]) =>
    toPartner(options[(roundIndex - 1) % options.length]);
  if (!balance) {
    return own.length > 0 ? pick(own) : undefined;
  }
  const taken = new Set<ElementId>(roundElements);
  if (track) {
    taken.add(track.element);
  }
  let candidates = BALANCE_ORDER.filter(e => !taken.has(e));
  if (candidates.length === 0) {
    candidates = BALANCE_ORDER.filter(e => e !== track?.element);
  }
  const work = (e: ElementId) => balance[e] ?? 0;
  const least = Math.min(...candidates.map(work));
  const lowest = candidates.filter(e => work(e) === least);
  const fitting = own.filter(o => {
    const element = elementOf(o.exerciseId);
    return element !== undefined && lowest.includes(element);
  });
  const options =
    fitting.length > 0 ? fitting : lowest.flatMap(e => PARTNER_POOL[e]);
  return options.length > 0 ? pick(options) : undefined;
}

/**
 * A focus partner for a round: the day's focus drills in turn, skipping
 * any from an element already in the round.
 */
export function focusPartner(
  focus: readonly AttributeId[],
  turn: number,
  roundElements: readonly ElementId[],
): Partner | undefined {
  const options = focus
    .flatMap(a => FOCUS_PARTNERS[a] ?? [])
    .filter(o => {
      const element = elementOf(o.exerciseId);
      return element !== undefined && !roundElements.includes(element);
    });
  return options.length > 0
    ? toPartner(options[turn % options.length])
    : undefined;
}

/** Spread every set across `count` rounds (see the grouping rules above). */
function placeSets(
  active: readonly DayPrescription[],
  count: number,
): SetMove[][] {
  const total = active.reduce((sum, p) => sum + p.sets, 0);
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
  return slots;
}

export function groupIntoRounds(
  prescriptions: readonly DayPrescription[],
  opts: {balance?: ElementBalance; focus?: readonly AttributeId[]} = {},
): Round[] {
  const active = prescriptions.filter(p => p.sets > 0);
  const total = active.reduce((sum, p) => sum + p.sets, 0);
  if (total === 0) {
    return [];
  }
  const most = Math.max(...active.map(p => p.sets));
  let count = Math.max(
    most,
    Math.min(TARGET_ROUNDS, total),
    Math.ceil(total / MAX_MOVES_PER_ROUND),
  );
  let slots = placeSets(active, count);
  // A tight day can leave a round over the limit, since a track can't
  // repeat within a round; one more round spreads the sets out.
  while (slots.some(round => round.length > MAX_MOVES_PER_ROUND)) {
    count += 1;
    slots = placeSets(active, count);
  }

  // Number each track's sets in the order the rounds come.
  const seen = new Map<TrackId, number>();
  // Partners lean toward the lightest element: the balance passed in, plus
  // what today's own moves give, plus each partner placed so far.
  const running: Partial<Record<ElementId, number>> | undefined = opts.balance
    ? {...opts.balance}
    : undefined;
  if (running) {
    for (const m of slots.flat()) {
      running[m.element] = (running[m.element] ?? 0) + POINTS.set;
    }
  }
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
      const elements = ordered.map(m => m.element);
      // Every second round ends on the day's focus when a drill fits.
      const partner =
        (opts.focus && i % 2 === 1
          ? focusPartner(opts.focus, (i - 1) / 2, elements)
          : undefined) ??
        partnerFor(ordered[0].trackId, i + 1, running, elements);
      if (running && partner) {
        running[partner.element] =
          (running[partner.element] ?? 0) + POINTS.drill;
      }
      return {index: i + 1, moves: ordered, partner};
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
