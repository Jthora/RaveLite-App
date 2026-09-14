import {ElementId} from '../../theme/elements';

/**
 * Append-only event journal — the gamification-ready data spine.
 *
 * Future XP, streaks, achievements, mastery, and music-attunement metrics
 * are all *derived* from this log. Never mutate entries; never compute
 * primary values into storage. This means we can introduce new game
 * mechanics later without lossy migrations.
 *
 * Each entry is one fact about a single moment in time.
 */

export type EntryKind =
  /** A drill from the library was completed (manual tap or notif tap). */
  | 'completion'
  /** A reminder fired (regardless of whether the user acted on it). */
  | 'reminder.fired'
  /** A reminder was dismissed/snoozed without completion. */
  | 'reminder.dismissed'
  /** Operator tapped Skip on an active Always-On pulse. */
  | 'reminder.skipped'
  /** Operator tapped Snooze on an active Always-On pulse. */
  | 'reminder.snoozed'
  /** Always-On pulse window expired without resolution. */
  | 'reminder.ignored'
  /** Pulse never paged the operator (outside active hours / paused). */
  | 'reminder.suppressed'
  /** Post-hoc rollup: the operator was absent across a span. */
  | 'journal.absence'
  /** Daily Sets: the operator tested a new max on a track. */
  | 'program.test'
  /** A music attunement event — beat, BPM lock, song change. Future. */
  | 'music.event'
  /** A free-form session note — start/end of a training block. */
  | 'session.start'
  | 'session.end';

/** Reason a `reminder.suppressed` was emitted. */
export type SuppressionReason =
  | 'outside-active-hours'
  | 'battery-saver'
  | 'manual-pause';

interface BaseEntry {
  id: string; // ULID-ish: timestamp + random
  kind: EntryKind;
  /** Epoch ms. */
  at: number;
}

export interface CompletionEntry extends BaseEntry {
  kind: 'completion';
  exerciseId: string;
  element: ElementId;
  /** Where the completion came from. */
  source: 'manual' | 'notification' | 'auto' | 'always-on';
  /** Optional self-rated quality 1-5 — placeholder for future XP weighting. */
  quality?: number;
  /** Approx duration actually spent, seconds. */
  durationSec?: number;
  /** When sourced from an Always-On pulse, correlates to `reminder.fired.pulseId`. */
  pulseId?: string;
  /** ms between cue fire and Done tap (Always-On only). */
  respondedAfterMs?: number;
  /** Daily Sets: the track this set counts toward (`program/types` TrackId). */
  trackId?: string;
  /** Daily Sets: reps or seconds actually done, in the track's unit. */
  amount?: number;
  /** Daily Sets round: every move done in one chime, each in its track's unit. */
  moves?: Array<{trackId: string; amount: number}>;
  /** Partner drill done alongside a set round. */
  partnerExerciseId?: string;
  partnerSec?: number;
  /** A glass of water rode along with this chime. */
  water?: boolean;
}

export interface ReminderFiredEntry extends BaseEntry {
  kind: 'reminder.fired';
  exerciseId?: string;
  element: ElementId;
  /** Daily Sets: track of the set this pulse prescribed. */
  trackId?: string;
  /** Synthetic id for correlating with the resolution entry. */
  pulseId: string;
  /** Plan window that scheduled the pulse, when known. */
  windowId?: string;
}

export interface ReminderDismissedEntry extends BaseEntry {
  kind: 'reminder.dismissed';
  exerciseId: string;
  element: ElementId;
}

/**
 * Always-On pulse resolution. One of skipped / snoozed / ignored.
 * Correlated back to the original `reminder.fired` via `pulseId`.
 */
export interface ReminderResolvedEntry extends BaseEntry {
  kind: 'reminder.skipped' | 'reminder.snoozed' | 'reminder.ignored';
  pulseId: string;
  /** Time-to-respond. `null` for `ignored` (operator never acted). */
  respondedAfterMs: number | null;
  /** Free-text, optional. */
  reason?: string;
  /**
   * Set on a previously-written `reminder.ignored` when an absence
   * rollup absorbs it post-hoc. References an `AbsenceEntry.id`.
   */
  absorbedBy?: string;
}

/**
 * Pulse never reached the operator: outside active hours, in
 * battery-saver, or under manual pause. Excluded from adherence.
 */
export interface ReminderSuppressedEntry extends BaseEntry {
  kind: 'reminder.suppressed';
  pulseId: string;
  reason: SuppressionReason;
}

/**
 * Post-hoc rollup written when the operator returns from an absence.
 * Marks any `reminder.ignored` entries inside `[fromAt..toAt]` with
 * `absorbedBy = id` so they're excluded from adherence.
 */
export interface AbsenceEntry extends BaseEntry {
  kind: 'journal.absence';
  /** Inclusive — start of the inferred gap. */
  fromAt: number;
  /** Inclusive — when the operator returned (== `at`). */
  toAt: number;
  /** Pulse ids whose `reminder.ignored` were absorbed. */
  pulseIdsAffected: string[];
  /** Whether the gap fell inside active hours. */
  withinActiveHours: boolean;
}

export interface MusicEventEntry extends BaseEntry {
  kind: 'music.event';
  /** "beat" | "bpm-lock" | "track-change" | other future kinds */
  event: string;
  bpm?: number;
  trackId?: string;
}

export interface SessionStartEntry extends BaseEntry {
  kind: 'session.start';
  /** "morning-block" | ad-hoc label */
  label: string;
}

export interface SessionEndEntry extends BaseEntry {
  kind: 'session.end';
  label: string;
  /** Total elapsed seconds for the session. */
  durationSec: number;
}

/**
 * Daily Sets max test. The new max also lives in program state; this entry
 * puts the test in the day's activity and history.
 */
export interface ProgramTestEntry extends BaseEntry {
  kind: 'program.test';
  trackId: string;
  /** New max, in the track's unit. */
  max: number;
  /** Rung the max was tested on. */
  rung: number;
  element: ElementId;
}

/** `Omit` that distributes over a union, so each entry kind keeps its own fields. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type JournalEntry =
  | CompletionEntry
  | ReminderFiredEntry
  | ReminderDismissedEntry
  | ReminderResolvedEntry
  | ReminderSuppressedEntry
  | AbsenceEntry
  | MusicEventEntry
  | SessionStartEntry
  | SessionEndEntry
  | ProgramTestEntry;
