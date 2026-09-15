/**
 * Training Log — operator's manual record of runs, holds, and rep
 * sets. Distinct from the Always-On journal (which is auto-generated
 * pulse activity); this log is what the operator types in by hand
 * after a workout.
 *
 * Goals:
 *   - Manual entry only (no GPS, no live timer in v1).
 *   - User-extensible metric catalog: built-in 3-mi run / plank / etc.,
 *     plus operator-added kinds (squats, brick press, new techniques)
 *     that persist across sessions.
 *   - Editable + deletable entries.
 */

/**
 * What an entry represents and how the input UI should behave.
 *
 *   - `mmss`         — duration, MM:SS keypad. e.g. plank, 3-mi run.
 *   - `integer`      — count of reps. e.g. pushups, pullups.
 *   - `distance-time` — distance (mi) AND time (mm:ss). e.g. custom-distance run.
 *   - `decimal`      — generic decimal value (kg, mi, etc.).
 */
export type InputMode = 'mmss' | 'integer' | 'distance-time' | 'decimal';

import type {ElementId} from '../../theme/elements';

/** Element a metric belongs to. `'any'` is the migration default for
 *  legacy / cross-cutting kinds and means "show in every Train surface". */
export type MetricElement = ElementId | 'any';

/** Coarse grouping for the picker — drives section headers. */
export type MetricCategory = 'run' | 'reps' | 'hold' | 'session' | 'custom';

/**
 * What a metric measures. Stored as a unit hint for display formatters
 * — it never changes the storage shape (`value: number`).
 */
export type MetricUnit = 'seconds' | 'reps' | 'meters' | 'pounds' | 'misc';

export interface MetricKind {
  /** Stable id. Built-in ids start with `builtin.`; custom with `custom.`. */
  id: string;
  /** Human label, shown in the picker and entry list. */
  label: string;
  category: MetricCategory;
  unit: MetricUnit;
  inputMode: InputMode;
  /** Element this metric belongs to. Drives which Train surface lists
   *  it. `'any'` means every element shows it (used as the migration
   *  default for legacy kinds without an explicit element). */
  element: MetricElement;
  /**
   * When the kind has a fixed distance (e.g. 3-mile run = 4828 m), this
   * locks the distance leg of the input. `distance-time` kinds without
   * a default let the operator set it per-entry.
   */
  defaultDistanceMeters?: number;
  /**
   * True when seeded by the app, false for operator-added entries.
   * Built-ins cannot be deleted (only archived), so the seed survives
   * a "delete all custom" sweep.
   */
  builtIn: boolean;
  /** Hidden from the picker but kept in storage so old entries still resolve. */
  archived?: boolean;
  /** Free-text the operator entered when creating a custom kind. */
  notes?: string;
}

export interface TrainingLogEntry {
  id: string;
  /**
   * Epoch ms at which the *workout* happened (operator-picked date,
   * not the entry timestamp). Day grouping uses local-tz `YYYY-MM-DD`.
   */
  at: number;
  /** Foreign key to MetricKind.id. */
  kindId: string;
  /**
   * Primary value, interpreted by the kind's `inputMode`:
   *   - `mmss`          → seconds
   *   - `integer`       → reps
   *   - `distance-time` → seconds (distance is on `distanceMeters`)
   *   - `decimal`       → unit-defined (lbs, kg, mi, ...)
   */
  value: number;
  /** Distance leg for `distance-time` kinds. */
  distanceMeters?: number;
  /** Optional free-text. */
  notes?: string;
  /** Element this entry belongs to. Denormalized from kind at write
   *  time so cross-element queries don't need to dereference every
   *  kind. Optional for legacy entries; readers fall back to the
   *  kind's element. */
  element?: ElementId;
}
