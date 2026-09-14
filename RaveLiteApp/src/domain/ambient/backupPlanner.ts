import {pagingAllowedAtPure} from './activeHours';
import type {ActiveHours} from './types';

/**
 * Backup chimes — pure planning.
 *
 * While RaveLite's JS runtime is alive it fires every chime itself. If
 * the OS kills the process, nothing would fire — so the OS also holds an
 * exact-alarm "backup" notification for each upcoming chime, set
 * BACKUP_OFFSET_MS after the chime is due and sharing the pulse's id.
 *
 * The live runtime cancels a backup the moment its pulse comes due, so
 * with the app alive you hear exactly one chime; with it dead you hear the
 * backup ~90 s late, with the same Done / +5 / Skip buttons.
 *
 * The offset must stay above the schedulers' 60 s grace window.
 */

export const BACKUP_OFFSET_MS = 90_000;
/** Covers the overnight gap until the next morning's first chimes. */
export const BACKUP_HORIZON_MS = 14 * 60 * 60_000;
/** Keeps well clear of Android's per-app alarm limits. */
export const BACKUP_CAP = 40;
/** A trigger closer than this would race the runtime; skip it. */
const MIN_LEAD_MS = 5_000;

export interface BackupCandidate<P> {
  pulseId: string;
  /** When the chime itself is due (the runtime's fireAt). */
  dueAt: number;
  payload: P;
}

export interface BackupSpec<P> {
  pulseId: string;
  triggerAt: number;
  payload: P;
}

export interface BackupPlanInput<P> {
  now: number;
  /** Later entries win for a repeated id (e.g. a snoozed pulse's new time). */
  candidates: ReadonlyArray<BackupCandidate<P>>;
  /** Pulses that already fired today — their chime has happened. */
  firedIds: ReadonlySet<string>;
  activeHours: ActiveHours;
  pauseUntil?: number;
  /** Backups the OS already holds: pulse id → trigger time. */
  existing: ReadonlyMap<string, number>;
  horizonMs?: number;
  cap?: number;
  offsetMs?: number;
}

/**
 * Which backups to create and which to cancel. A backup whose trigger
 * time moved (deferred / snoozed / re-laid set) is cancelled and created
 * again.
 */
export function planBackups<P>(input: BackupPlanInput<P>): {
  create: BackupSpec<P>[];
  cancel: string[];
} {
  const {
    now,
    candidates,
    firedIds,
    activeHours,
    pauseUntil,
    existing,
    horizonMs = BACKUP_HORIZON_MS,
    cap = BACKUP_CAP,
    offsetMs = BACKUP_OFFSET_MS,
  } = input;

  const byId = new Map<string, BackupSpec<P>>();
  for (const c of candidates) {
    if (firedIds.has(c.pulseId)) {
      continue;
    }
    // Already due: the runtime owns it now (or it's gone).
    if (c.dueAt <= now || c.dueAt > now + horizonMs) {
      byId.delete(c.pulseId);
      continue;
    }
    if (pagingAllowedAtPure(c.dueAt, activeHours, pauseUntil) !== null) {
      byId.delete(c.pulseId);
      continue;
    }
    const triggerAt = c.dueAt + offsetMs;
    if (triggerAt < now + MIN_LEAD_MS) {
      continue;
    }
    byId.set(c.pulseId, {pulseId: c.pulseId, triggerAt, payload: c.payload});
  }

  const desired = [...byId.values()]
    .sort((a, b) => a.triggerAt - b.triggerAt)
    .slice(0, cap);
  const desiredById = new Map(desired.map(d => [d.pulseId, d]));

  const create = desired.filter(d => existing.get(d.pulseId) !== d.triggerAt);
  const cancel = [...existing.entries()]
    .filter(([id, triggerAt]) => desiredById.get(id)?.triggerAt !== triggerAt)
    .map(([id]) => id);
  return {create, cancel};
}
