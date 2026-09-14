import {ElementId} from '../../theme/elements';

/**
 * Ambient layer — Always-On surface domain types.
 *
 * Pulses are *ephemeral, in-memory* objects representing a single
 * scheduled paging event. State transitions emit append-only journal
 * writes (`reminder.fired`, `reminder.skipped`, `reminder.snoozed`,
 * `reminder.ignored`, `reminder.suppressed`); the `Pulse` itself is
 * discarded once `resolved`.
 *
 * Slice 1 (this file) defines the data shape and the active-hours
 * model. The state machine that drives transitions lands in Slice 2.
 *
 * See:
 *  - `docs/always-on-screen/initial-development/03-architecture/data-model.md`
 *  - `docs/always-on-screen/initial-development/01-requirements/active-hours.md`
 *  - `docs/always-on-screen/initial-development/01-requirements/interaction-states.md`
 */

import {SuppressionReason} from '../journal/types';
import type {SetPrescription} from '../program/types';

export type PulseState =
  | 'queued'
  | 'active'
  | 'resolved'
  | 'cancelled'
  | 'suppressed';

export type PulseOutcome = 'completed' | 'skipped' | 'snoozed' | 'ignored';

export interface PulseResolution {
  outcome: PulseOutcome;
  /** Epoch ms when the resolution was decided. */
  at: number;
  /** ms between fire and resolution. `null` for `ignored`. */
  respondedAfterMs: number | null;
  /** Journal entry id of the resolution write, when committed. */
  journalEntryId?: string;
}

export interface Pulse {
  id: string;
  state: PulseState;
  /** Scheduled fire time, epoch ms. */
  fireAt: number;
  /** Window-expiry deadline, epoch ms. */
  expiresAt: number;
  element: ElementId;
  /** Plan window that scheduled the pulse, when known. */
  windowId?: string;
  exerciseId?: string;
  /** Daily Sets: exactly what this chime asks for (set n of m, amount). */
  prescription?: SetPrescription;
  /** Set when state transitions through `snoozed`. */
  snoozedFrom?: number;
  /** Populated once the pulse leaves `active`. */
  resolution?: PulseResolution;
  /** Populated when state transitions to `suppressed`. */
  suppression?: {
    at: number;
    reason: SuppressionReason;
  };
}

/**
 * Operator-declared paging window. Outside this window pulses post
 * `reminder.suppressed` and don't count toward adherence.
 */
export interface ActiveHours {
  /** Local time, "HH:MM". */
  start: string;
  /** Local time, "HH:MM". May be < start (e.g. 09:00 → 02:00 next day). */
  end: string;
  /** Day-of-week mask. Bit 0 = Mon ... bit 6 = Sun. */
  daysMask: number;
}

/** Default active-hours: 09:00–23:00, all 7 days. See OQ-9. */
export const DEFAULT_ACTIVE_HOURS: ActiveHours = {
  start: '09:00',
  end: '23:00',
  daysMask: 0b1111111,
};
