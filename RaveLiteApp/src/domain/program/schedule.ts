import {localDayKey} from '../training/grading';
import type {DayPrescription, SetFire, TrackId} from './types';

/**
 * Set scheduling — pure. Turns today's prescriptions into concrete set
 * chimes spread across the day, and decides which of them are still
 * needed as sets get done.
 *
 * Spacing rules:
 *   - Each track's sets are spaced evenly across [dayStart, dayEnd), and
 *     tracks are staggered inside their interval so they interleave
 *     instead of stacking at the top of the window.
 *   - Times snap to whole minutes, stay ≥ MIN_GAP_MS apart, and keep
 *     CLEARANCE_MS away from any plan chime (`blockedTs`) so a set never
 *     queues up behind a water call or posture reset.
 *   - A set that can't be placed within SPILL_MS after dayEnd is dropped
 *     rather than chiming late at night.
 */

export const MIN_GAP_MS = 8 * 60_000;
export const CLEARANCE_MS = 4 * 60_000;
export const SPILL_MS = 30 * 60_000;
const MINUTE = 60_000;

export function setFireId(day: string, trackId: TrackId, setIndex: number): string {
  return `sets:${day}:${trackId}:${setIndex}`;
}

function atLocal(date: Date, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export interface DistributeInput {
  date: Date;
  dayStart: string;
  dayEnd: string;
  /** In display order; order breaks ties between simultaneous sets. */
  prescriptions: DayPrescription[];
  /** Plan chime timestamps to keep clear of. */
  blockedTs?: number[];
}

export function distributeSets(input: DistributeInput): SetFire[] {
  const {date, dayStart, dayEnd, prescriptions, blockedTs = []} = input;
  const start = atLocal(date, dayStart);
  const end = atLocal(date, dayEnd);
  if (end <= start || prescriptions.length === 0) {
    return [];
  }
  const span = end - start;
  const n = prescriptions.length;
  const day = localDayKey(start);

  const ideal: {p: DayPrescription; order: number; k: number; ts: number}[] = [];
  prescriptions.forEach((p, order) => {
    if (p.sets <= 0) {
      return;
    }
    const interval = span / p.sets;
    const offset = (interval * (order + 0.5)) / n;
    for (let k = 0; k < p.sets; k++) {
      ideal.push({p, order, k, ts: start + offset + k * interval});
    }
  });
  ideal.sort((a, b) => a.ts - b.ts || a.order - b.order);

  const placed: SetFire[] = [];
  let last = -Infinity;
  for (const {p, k, ts: idealTs} of ideal) {
    let ts = Math.max(start, Math.round(idealTs / MINUTE) * MINUTE);
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
    placed.push({
      id: setFireId(day, p.trackId, k + 1),
      ts,
      element: p.element,
      exerciseId: p.exerciseId,
      prescription: {
        trackId: p.trackId,
        label: p.label,
        unit: p.unit,
        amount: p.setSize,
        setIndex: k + 1,
        sets: p.sets,
      },
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
  /** Upcoming sets still needed — enqueue any not yet enqueued. */
  keep: SetFire[];
  /** Upcoming sets no longer needed (quota met early) — cancel if queued. */
  drop: string[];
}

/**
 * Keep only as many upcoming sets as the remaining quota needs. Extra
 * sets logged by hand retire the latest chimes first; already-fired sets
 * are never counted as upcoming.
 */
export function selectUpcomingSets(input: SelectInput): SelectResult {
  const {fires, prescriptions, doneByTrack, firedIds, now, graceMs} = input;
  const keep: SetFire[] = [];
  const drop: string[] = [];
  for (const p of prescriptions) {
    const total = p.setSize * p.sets;
    const done = doneByTrack[p.trackId]?.amount ?? 0;
    const needed = Math.ceil(Math.max(0, total - done) / Math.max(1, p.setSize));
    const upcoming = fires
      .filter(
        f =>
          f.prescription.trackId === p.trackId &&
          !firedIds.has(f.id) &&
          f.ts >= now - graceMs,
      )
      .sort((a, b) => a.ts - b.ts);
    keep.push(...upcoming.slice(0, needed));
    drop.push(...upcoming.slice(needed).map(f => f.id));
  }
  keep.sort((a, b) => a.ts - b.ts);
  return {keep, drop};
}
