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
  /** `{day: {trackId: amount}}` JSON — what each recent day asked, read by the daily review. */
  programDays: 'program.days',
  /** `{day: {trackId: amount}}` JSON — sets in rounds that never sounded (paused, outside My day), not held against that day. */
  programExcused: 'program.excused',
  /** `{day: RestReason[]}` JSON — days that were rest (a mode, an injury, My day off). See `profile/restDays.ts`. */
  restDays: 'program.rest',

  // ── Who is using it: kit, room, and what they train for ─────────
  /** `Profile` JSON — facts about the person, and any temporary mode. */
  profile: 'profile.state',
  /** 'metric' | 'imperial'; absent means never chosen. */
  units: 'settings.units',
  /** When this phone last wrote an export, for "last export: 3 days ago". */
  lastExportAt: 'data.lastExportAt',
  /** `{drillId: ChartId[]}` — the charts each curriculum move was cleared at. */
  practiceClears: 'practice.clears',
  /** `{disciplineId: {tier, chart}}` — where each path was left open. */
  practiceLevels: 'practice.levels',
  /** The last 50 things that went wrong (see `domain/diagnostics`). */
  errorLog: 'diagnostics.errors',

  // ── Attributes (the character sheet's fifteen) ───────────────────
  /** `AttributesState` JSON — levels, XP and the day rolled up through. */
  attributesState: 'attributes.state',

  // ── Weather: sunrise, the forecast, conditions ────────────────────
  /** `Place` JSON — the operator's town, rounded to about 10 km. */
  weatherPlace: 'weather.place',
  /** `Forecast` JSON — the last Open-Meteo forecast for that place. */
  weatherForecast: 'weather.forecast',
  /** `WeatherPrefs` JSON — units, running in the dark, bugs move inside. */
  weatherPrefs: 'weather.prefs',
  /** Local day key the operator marked as buggy. */
  weatherBuggyDay: 'weather.buggyDay',

  // ── Fitness standards (USAF, USSF, USMC, MARSOC) ──────────────────
  /** `{eventId: value}` JSON — targets the operator changed. */
  standardsTargets: 'standards.targets',
  /** 'male' | 'female' — which table leads. */
  standardsPrimary: 'standards.primary',
} as const;

/**
 * Bump this when a breaking change requires migration logic.
 *   2 — rounds and My day: the default plan drops Desk Hours and Morning
 *       Training (a different saved plan is kept under `planBackupV1`),
 *       and Daily Sets lose their own day window.
 *   9 — one hang point becomes two (low, high).
 *  10 — kit becomes places: the flat kit list is split into a room, a
 *       yard, a porch, the streets…, with its limits on the room.
 *  11 — chimes follow silent mode and DND by default; a phone already in
 *       use is written down as having chosen the alarm route.
 */
export const CURRENT_SCHEMA_VERSION = 11;
