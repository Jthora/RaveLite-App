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
 *
 * Sets are chimed in rounds: one chime covers a few different moves back
 * to back, then a short partner drill from another element.
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
  | 'hang'
  | 'posture'
  | 'breath'
  | 'mobility'
  | 'stillness'
  | 'push-variants'
  | 'pelvis'
  | 'kicks';

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

/** A partner drill option: a library drill and how long to do it. */
export interface TrackPartner {
  exerciseId: string;
  seconds: number;
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
  /**
   * Short drills from other elements for rounds this track leads,
   * rotated round by round.
   */
  partners: TrackPartner[];
}

export type ReviewChange =
  | 'new'
  | 'up'
  | 'hold'
  | 'top'
  | 'down'
  | 'rebuild'
  | 'deload';

/** A track's daily look back at the last week (see `adapt.ts`). */
export interface TrackReview {
  /** Local YYYY-MM-DD the review ran. */
  day: string;
  /** Done ÷ asked over the track's training days in the last week. */
  ratio?: number;
  change: ReviewChange;
  /** Sets a day after the review. */
  sets: number;
}

export interface TrackState {
  enabled: boolean;
  rung: number;
  /** Max on the current rung, in the track's unit. */
  testMax: number;
  /** Epoch ms of the last max test on this rung; unset = assumed max. */
  testedAt?: number;
  /** Sets a day the track has earned; the week-1 base until its first review. */
  sets?: number;
  /** Sets a day before a break, while climbing back to them. */
  peakSets?: number;
  /** Local YYYY-MM-DD of the last step up or down. */
  steppedOn?: string;
  lastReview?: TrackReview;
}

/** Rounds spread across My day (the ambient active hours), not a window of their own. */
export interface ProgramState {
  version: 1;
  /** Local YYYY-MM-DD — day 1 of week 1. */
  startDay: string;
  tracks: Record<TrackId, TrackState>;
  /** Local YYYY-MM-DD through which the daily reviews have run. */
  reviewedThrough?: string;
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

/** One move inside a round chime. */
export interface SetMove {
  trackId: TrackId;
  exerciseId: string;
  element: ElementId;
  label: string;
  unit: SetUnit;
  amount: number;
  /** 1-based: which of the day's sets for this track. */
  setIndex: number;
  sets: number;
}

/** The short drill done right after a round's moves. */
export interface Partner {
  exerciseId: string;
  element: ElementId;
  label: string;
  seconds: number;
}

/**
 * Attached to a pulse so the chime says exactly what to do. The top-level
 * fields describe the lead move; a round lists every move in `moves`.
 */
export interface SetPrescription {
  trackId: TrackId;
  label: string;
  unit: SetUnit;
  amount: number;
  /** 1-based. */
  setIndex: number;
  sets: number;
  /** Every move in the round, lead first. */
  moves?: SetMove[];
  partner?: Partner;
  /** 1-based round number, and how many rounds the day has. */
  roundIndex?: number;
  rounds?: number;
  /** A glass of water rides along with this round. */
  water?: boolean;
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
