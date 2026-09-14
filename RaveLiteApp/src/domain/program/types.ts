import type {ElementId} from '../../theme/elements';

/**
 * Daily Sets — spread-out, submaximal practice ("grease the groove").
 *
 * Instead of one all-out set, each movement track prescribes a set size
 * at about half the operator's tested max, repeated several times across
 * the day. Volume ramps in 4-week blocks (3 build weeks + 1 deload/test
 * week). A retest raises the set size; once a set size reaches the rung's
 * `graduateAt`, the next rung (a harder variation) replaces endless extra
 * reps — that's what keeps building strength and density instead of just
 * endurance.
 */

export type TrackId =
  | 'push'
  | 'row'
  | 'pull'
  | 'squat'
  | 'legs-up'
  | 'crunch'
  | 'side'
  | 'plank'
  | 'hang';

export type SetUnit = 'reps' | 'seconds';

/** One variation on a track's progression ladder. */
export interface Rung {
  /** Library drill id — cues and form notes come from there. */
  exerciseId: string;
  /** Short name used in chimes, e.g. "Diamond push-ups". */
  label: string;
  /** Set size on this rung at which the next rung unlocks. */
  graduateAt: number;
}

export interface Track {
  id: TrackId;
  name: string;
  element: ElementId;
  unit: SetUnit;
  /** Easiest → hardest. */
  ladder: Rung[];
  /** Rung a new program starts on. */
  defaultRung: number;
  /** Conservative max assumed until the operator runs a test. */
  defaultMax: number;
  /** Fraction of the tested max prescribed per set. */
  intensity: number;
  /** Days the track trains, JS `getDay()` numbering (0 = Sunday). */
  days: number[];
  /** Sets per day in week 1. */
  baseSets: number;
  /** Hard cap on sets per day — tendons adapt slower than muscle. */
  maxSets: number;
  enabledByDefault: boolean;
  /** One line: why this track exists. */
  why: string;
}

export interface TrackState {
  enabled: boolean;
  rung: number;
  /** Max on the current rung, in the track's unit. */
  testMax: number;
  /** Epoch ms of the last max test on this rung; unset = assumed max. */
  testedAt?: number;
}

export interface ProgramState {
  version: 1;
  /** Local YYYY-MM-DD — day 1 of week 1. */
  startDay: string;
  /** "HH:MM" window the day's sets are spread across. */
  dayStart: string;
  dayEnd: string;
  tracks: Record<TrackId, TrackState>;
}

export type Phase = 'build' | 'deload';

/** One track's work for one day. */
export interface DayPrescription {
  trackId: TrackId;
  element: ElementId;
  exerciseId: string;
  label: string;
  unit: SetUnit;
  setSize: number;
  sets: number;
  /** 1-based program week. */
  week: number;
  phase: Phase;
}

/** Attached to a pulse so the chime says exactly what to do. */
export interface SetPrescription {
  trackId: TrackId;
  label: string;
  unit: SetUnit;
  amount: number;
  /** 1-based. */
  setIndex: number;
  sets: number;
}

/** A single scheduled set chime. */
export interface SetFire {
  id: string;
  ts: number;
  element: ElementId;
  exerciseId: string;
  prescription: SetPrescription;
}

/** `windowId` stamped on set pulses and their journal entries. */
export const SETS_WINDOW_ID = 'daily-sets';
