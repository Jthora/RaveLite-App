import {entriesForDay, entriesInRange} from '../journal/journal';
import {
  CompletionEntry,
  JournalEntry,
  ReminderResolvedEntry,
} from '../journal/types';

/**
 * Always-On adherence + responsiveness derivations.
 *
 * Pure functions over the journal — no side effects, no caching.
 * Mirrors the existing `src/domain/journal/stats.ts` pattern but
 * adds metrics specific to the Always-On surface (which the existing
 * stats file knew nothing about, since the journal kinds are new).
 *
 * Contracts come from:
 *  - `docs/always-on-screen/initial-development/03-architecture/data-model.md`
 *    "Aggregation contracts"
 *  - `docs/always-on-screen/initial-development/01-requirements/interaction-states.md`
 *    "Outcome enum" table
 */

// ── adherence ────────────────────────────────────────────────────────

export interface AdherenceForDay {
  /** `reminder.fired` count (informational; what would have been scheduled). */
  fired: number;
  /** `completion` count credited to a fired pulse this day. */
  completed: number;
  /** `reminder.skipped` count this day. */
  skipped: number;
  /** `reminder.ignored` count this day, EXCLUDING those marked `absorbedBy`. */
  ignored: number;
  /** `reminder.suppressed` count this day. Excluded from numerator+denominator. */
  suppressed: number;
  /**
   * Denominator for adherence math.
   * Equals `completed + skipped + ignored` (after absorbed exclusion).
   * Excludes suppressed and absorbed.
   */
  scheduled: number;
  /**
   * `completed / scheduled`. `null` when `scheduled === 0` (avoids
   * misleading "100% adherence" on an empty day).
   */
  ratio: number | null;
}

const isCompletion = (e: JournalEntry): e is CompletionEntry =>
  e.kind === 'completion';

const isResolved = (e: JournalEntry): e is ReminderResolvedEntry =>
  e.kind === 'reminder.skipped' ||
  e.kind === 'reminder.snoozed' ||
  e.kind === 'reminder.ignored';

/**
 * Compute adherence for a single calendar day.
 *
 * Counting rules (per OQ-3 / FR-7.4):
 * - `reminder.suppressed` is fully excluded.
 * - `reminder.ignored` whose `absorbedBy` is set is excluded.
 * - A `completion` is counted iff it carries a `pulseId` AND a
 *   matching `reminder.fired` exists in the day's entries. Manual
 *   completions (no `pulseId`) don't enter the AOS adherence
 *   denominator — they're tracked by the existing `stats.ts` ring.
 */
export function adherenceForDay(now: Date = new Date()): AdherenceForDay {
  const entries = entriesForDay(now);

  const firedPulseIds = new Set<string>();
  let suppressed = 0;
  let skipped = 0;
  let ignored = 0;
  let completed = 0;

  for (const e of entries) {
    if (e.kind === 'reminder.fired') {
      firedPulseIds.add(e.pulseId);
    } else if (e.kind === 'reminder.suppressed') {
      suppressed++;
    } else if (e.kind === 'reminder.skipped') {
      skipped++;
    } else if (e.kind === 'reminder.ignored') {
      // Exclude absorbed entries from adherence math.
      if (!e.absorbedBy) {
        ignored++;
      }
    } else if (isCompletion(e)) {
      if (e.pulseId && firedPulseIds.has(e.pulseId)) {
        completed++;
      }
    }
  }

  const scheduled = completed + skipped + ignored;
  return {
    fired: firedPulseIds.size,
    completed,
    skipped,
    ignored,
    suppressed,
    scheduled,
    ratio: scheduled === 0 ? null : completed / scheduled,
  };
}

// ── time-to-respond ──────────────────────────────────────────────────

/**
 * Pull every defined `respondedAfterMs` from `completion` and
 * `reminder.skipped` entries inside the window. `reminder.snoozed`
 * is informational and excluded. `reminder.ignored` is excluded
 * (its `respondedAfterMs` is `null`).
 */
function gatherResponseLatencies(
  windowDays: number,
  now: Date,
): number[] {
  const from = new Date(now);
  from.setDate(from.getDate() - (windowDays - 1));
  const all = entriesInRange(from, now);
  const out: number[] = [];
  for (const e of all) {
    if (e.kind === 'completion') {
      if (typeof e.respondedAfterMs === 'number') {
        out.push(e.respondedAfterMs);
      }
    } else if (e.kind === 'reminder.skipped') {
      if (typeof e.respondedAfterMs === 'number') {
        out.push(e.respondedAfterMs);
      }
    }
  }
  return out;
}

/**
 * Linear-interpolation percentile, the same convention NumPy uses
 * by default. `p` is in `[0, 100]`. Returns `null` when no samples.
 */
function percentile(samples: number[], p: number): number | null {
  if (samples.length === 0) {
    return null;
  }
  if (p <= 0) {
    return Math.min(...samples);
  }
  if (p >= 100) {
    return Math.max(...samples);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = ((p / 100) * (sorted.length - 1));
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) {
    return sorted[lo];
  }
  const frac = rank - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

/**
 * Time-to-respond at the given percentile across `windowDays` of
 * journal history (inclusive of today). Returns ms, or `null` when
 * the window contains no responsive entries.
 *
 * Example: `timeToRespondPercentile(50, 7)` → median time-to-Done
 * over the last week.
 */
export function timeToRespondPercentile(
  p: number,
  windowDays: number,
  now: Date = new Date(),
): number | null {
  const samples = gatherResponseLatencies(windowDays, now);
  return percentile(samples, p);
}
