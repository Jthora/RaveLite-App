import {ElementId} from '../../theme/elements';
import {Exercise} from '../exercises/types';

/**
 * The reminder engine pulls exercises from the library based on a Plan.
 *
 * A Plan is a rotation of element-specific cadences active during a window of
 * the day. The Heart screen displays the active plan and lets the operator
 * tune it; the scheduler module turns it into native notifications.
 */

/** A single recurring micro-prompt within a window. */
export interface CadenceSlot {
  /** Which element supplies the drill. */
  element: ElementId;
  /** Repeat interval in minutes. */
  everyMinutes: number;
  /** Optional: max approxSeconds when picking the drill (fits the window). */
  maxSeconds?: number;
  /** Optional: required tags (e.g. ['NoFloor'] for desk hours). */
  requiredTags?: Exercise['targets'];
}

/** A named period of the day with its own cadence rules. */
export interface Window {
  id: string;
  /** Display name. */
  label: string;
  /** "HH:mm" 24h. */
  startTime: string;
  /** "HH:mm" 24h. */
  endTime: string;
  /** Days of week active. 0 = Sunday … 6 = Saturday. */
  daysOfWeek: number[];
  /** Cadence slots active during this window. */
  slots: CadenceSlot[];
  /** If true, suppresses cross-window slots — used for deep-focus blocks. */
  exclusive?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  windows: Window[];
}

/** What a fired notification needs to render. */
export interface ReminderPayload {
  exerciseId: string;
  element: ElementId;
  title: string;
  body: string;
  /** Color used for the notification accent (Android LED, channel color). */
  color: string;
  /** Vibration pattern in ms intervals — element-themed. The element
   *  channel carries the pattern, so live pulses may omit it. */
  vibration?: number[];
  /** Pulse id. When set it becomes the notification id, and the
   *  notification gets Done / +5 / Skip action buttons. */
  pulseId?: string;
  /** Extra string data echoed back to action handlers. */
  data?: Record<string, string>;
}
