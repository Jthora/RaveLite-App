import {localDayKey} from '../training/grading';
import {
  MAX_MOVES_PER_ROUND,
  moveFor,
  orderMoves,
  roundPrescription,
  type Round,
} from './rounds';
import type {DayPrescription, SetFire, TrackId} from './types';

/**
 * Round scheduling — pure. Places the day's rounds (see `rounds.ts`) as
 * chimes across the day, and decides which are still needed as sets get
 * done.
 *
 * Spacing rules:
 *   - Rounds are spaced evenly across [dayStart, dayEnd).
 *   - Times snap to whole minutes, stay ≥ MIN_GAP_MS apart, and keep
 *     CLEARANCE_MS away from any plan chime (`blockedTs`) so a round never
 *     queues up behind a water call.
 *   - A round that can't be placed within SPILL_MS after dayEnd is dropped
 *     rather than chiming late at night.
 */

export const MIN_GAP_MS = 8 * 60_000;
export const CLEARANCE_MS = 4 * 60_000;
export const SPILL_MS = 30 * 60_000;
const MINUTE = 60_000;

export function roundFireId(day: string, roundIndex: number): string {
  return `sets:${day}:round:${roundIndex}`;
}

function atLocal(date: Date, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export interface PlaceInput {
  date: Date;
  dayStart: string;
  dayEnd: string;
  /** Rounds stop this long before `dayEnd`, leaving the evening quiet. */
  endMarginMs?: number;
  rounds: Round[];
  /** Plan chime timestamps to keep clear of. */
  blockedTs?: number[];
}

export function placeRounds(input: PlaceInput): SetFire[] {
  const {
    date,
    dayStart,
    dayEnd,
    endMarginMs = 0,
    rounds,
    blockedTs = [],
  } = input;
  const start = atLocal(date, dayStart);
  const end = atLocal(date, dayEnd) - endMarginMs;
  if (end <= start || rounds.length === 0) {
    return [];
  }
  const span = end - start;
  const count = rounds.length;
  const day = localDayKey(start);

  const placed: SetFire[] = [];
  let last = -Infinity;
  for (const round of rounds) {
    const ideal = start + ((round.index - 0.5) * span) / count;
    let ts = Math.max(start, Math.round(ideal / MINUTE) * MINUTE);
    while (
      ts - last < MIN_GAP_MS ||
      blockedTs.some(b => Math.abs(b - ts) < CLEARANCE_MS)
    ) {
      ts += MINUTE;
      if (ts > end + SPILL_MS) {
        break;
      }
    }
    if (ts > end + SPILL_MS) {
      continue;
    }
    const lead = round.moves[0];
    placed.push({
      id: roundFireId(day, round.index),
      ts,
      element: lead.element,
      exerciseId: lead.exerciseId,
      prescription: roundPrescription(
        round.moves,
        round.index,
        count,
        round.partner,
      ),
    });
    last = ts;
  }
  return placed;
}

export interface SelectInput {
  fires: SetFire[];
  prescriptions: DayPrescription[];
  /** Amount done today per track (reps or seconds). */
  doneByTrack: Partial<Record<TrackId, {amount: number}>>;
  /** Set pulse ids that have already fired today. */
  firedIds: ReadonlySet<string>;
  now: number;
  graceMs: number;
}

export interface SelectResult {
  /** Upcoming rounds still needed, trimmed to the sets still owed. */
  keep: SetFire[];
  /** Upcoming rounds with nothing left to do — cancel if queued. */
  drop: string[];
}

/**
 * Keep only the moves the remaining quota needs. Upcoming rounds are
 * filled earliest first, so sets logged ahead of time retire the latest
 * moves; a round left with no moves is dropped. Already-fired rounds are
 * never counted as upcoming.
 *
 * Falling behind: sets from rounds that went by undone roll into rounds
 * still to come, at most one per round for each track and never past a
 * full round, spread across the rest of the day. What doesn't fit is let
 * go rather than crammed into one big set; the daily review (`adapt.ts`)
 * reads the shortfall.
 */
export function selectUpcomingRounds(input: SelectInput): SelectResult {
  const {fires, prescriptions, doneByTrack, firedIds, now, graceMs} = input;
  const owed = new Map<TrackId, number>();
  const doneSets = new Map<TrackId, number>();
  for (const p of prescriptions) {
    const size = Math.max(1, p.setSize);
    const done = doneByTrack[p.trackId]?.amount ?? 0;
    owed.set(
      p.trackId,
      Math.ceil(Math.max(0, p.setSize * p.sets - done) / size),
    );
    doneSets.set(p.trackId, Math.min(p.sets, Math.floor(done / size)));
  }

  // Earliest first, each upcoming round keeps the moves still owed.
  const rounds = fires
    .filter(f => !firedIds.has(f.id) && f.ts >= now - graceMs)
    .sort((a, b) => a.ts - b.ts)
    .map(fire => ({
      fire,
      moves: (fire.prescription.moves ?? []).filter(m => {
        const left = owed.get(m.trackId) ?? 0;
        if (left <= 0) {
          return false;
        }
        owed.set(m.trackId, left - 1);
        return true;
      }),
    }));

  // Sets whose rounds went by roll forward into rounds that still chime.
  for (const p of prescriptions) {
    const left = owed.get(p.trackId) ?? 0;
    const hosts = rounds.filter(
      r =>
        r.moves.length > 0 &&
        r.moves.length < MAX_MOVES_PER_ROUND &&
        !r.moves.some(m => m.trackId === p.trackId),
    );
    const count = Math.min(left, hosts.length);
    for (let k = 0; k < count; k++) {
      hosts[Math.floor(((k + 0.5) * hosts.length) / count)].moves.push(
        moveFor(p),
      );
    }
  }

  // Number each track's sets on from those already done, in time order.
  const numbered = new Map<TrackId, number>();
  const keep: SetFire[] = [];
  const drop: string[] = [];
  for (const {fire, moves} of rounds) {
    if (moves.length === 0) {
      drop.push(fire.id);
      continue;
    }
    const ordered = orderMoves(moves).map(m => {
      const setIndex =
        (numbered.get(m.trackId) ?? doneSets.get(m.trackId) ?? 0) + 1;
      numbered.set(m.trackId, setIndex);
      return {...m, setIndex};
    });
    const rx = fire.prescription;
    if (JSON.stringify(ordered) === JSON.stringify(rx.moves)) {
      keep.push(fire);
      continue;
    }
    keep.push({
      ...fire,
      element: ordered[0].element,
      exerciseId: ordered[0].exerciseId,
      prescription: roundPrescription(
        ordered,
        rx.roundIndex ?? 1,
        rx.rounds ?? 1,
        rx.partner,
        rx.water,
      ),
    });
  }
  return {keep, drop};
}
