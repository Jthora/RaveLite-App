/** Centralized storage keys. Prefixes matter for `keysWithPrefix` scans. */

export const KEYS = {
  schemaVersion: 'schema.version',
  planCurrent: 'plan.current',
  /** The plan the v2 migration replaced, kept so it can be restored. */
  planBackupV1: 'plan.backup.v1',
  /** Epoch ms the v2 migration replaced the saved plan (unset if it didn't). */
  planReplacedAt: 'settings.migration.v2.planReplacedAt',
  /** journal.<YYYY-MM-DD>.<isoTimestamp> → CompletionEntry JSON */
  journalPrefix: 'journal.',
  journalEntry: (dayKey: string, entryId: string) =>
    `journal.${dayKey}.${entryId}`,
  journalDay: (dayKey: string) => `journal.${dayKey}.`,
  /** settings.<name> */
  setting: (name: string) => `settings.${name}`,
  /** stats.cache.<name> — denormalized aggregates, safe to drop & rebuild. */
  statsCache: (name: string) => `stats.cache.${name}`,
  /** circuits.all — all user-created custom circuits as one JSON blob. */
  circuitsAll: 'circuits.all',

  // ── Always-On (AOS) ambient layer ────────────────────────────────
  /** `ActiveHours` JSON — the operator's "My day" window. */
  activeHours: 'ambient.activeHours',
  /** Epoch ms; pulses suppress while now < value. Cleared when reached. */
  manualPauseUntil: 'ambient.manualPauseUntil',
  /** Epoch ms of last AOS foreground tick (for absence detection). */
  ambientLastSeenAt: 'ambient.session.lastSeenAt',
  /** Epoch ms — first-launch onboarding completion stamp. */
  ambientOnboardingCompletedAt: 'ambient.onboarding.completedAt',
  /** 0–100 master volume. */
  ambientToneVolumeMaster: 'ambient.toneVolume.master',
  /** Per-element override; 0–100. */
  ambientToneVolumeForElement: (element: string) =>
    `ambient.toneVolume.${element}`,

  // ── PFT goal layer (Phase 1B) ────────────────────────────────────
  /** `{ event, target, deadlineISO }` JSON — the deadline goal. */
  pftGoal: 'pft.goal',
  /** Operator's chosen anchor standard id. */
  pftActiveStandard: 'pft.activeStandard',
  /** `RunAttemptInProgress` singleton. Survives reboot. */
  pftAttemptInProgress: 'pft.attemptInProgress',
  /** `PlanTemplate` singleton. */
  pftPlanTemplate: 'pft.planTemplate',
  /** pft.attempt.<id> → PFTAttempt JSON. */
  pftAttemptPrefix: 'pft.attempt.',
  pftAttemptEntry: (id: string) => `pft.attempt.${id}`,

  // ── Training Log (manual workout records) ────────────────────────
  /** All custom + archived metric kinds as one JSON blob. */
  trainingMetrics: 'training.metrics',
  /** All training-log entries as one JSON blob (newest-first). */
  trainingEntries: 'training.entries',

  // ── Daily Sets program (spread-out submaximal sets) ──────────────
  /** `ProgramState` JSON — start day and per-track rung + max. */
  programState: 'program.state',
} as const;

/**
 * Bump this when a breaking change requires migration logic.
 *   2 — rounds and My day: the default plan drops Desk Hours and Morning
 *       Training (a different saved plan is kept under `planBackupV1`),
 *       and Daily Sets lose their own day window.
 */
export const CURRENT_SCHEMA_VERSION = 5;
