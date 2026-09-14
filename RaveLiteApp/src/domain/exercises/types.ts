import {ElementId} from '../../theme/elements';

/** Posture/condition tags used for filtering and reminder targeting. */
export type Target =
  | 'UCS' // Upper Crossed Syndrome (forward head, rounded shoulders)
  | 'Hourglass' // Chronic abdominal gripping / faulty breathing
  | 'APT' // Anterior Pelvic Tilt / hyperlordosis
  | 'PFT-Pushups'
  | 'PFT-Situps'
  | 'PFT-Run'
  | 'Core' // Crunches, leg-ups, side-ups, planks — the gut belt
  | 'Conditioning' // Heart-rate work that burns fat: rounds, strides, runs
  | 'Grip' // Porch hangs, brick holds, staff control
  | 'Agility' // Footwork, jumps, kick-flip groundwork
  | 'Mobility'
  | 'Strength'
  | 'Coordination'
  | 'Flow'
  | 'Breath'
  | 'Presence'
  | 'Hydration' // Water calls — drink on the chime
  | 'Fuel' // Meal check-ins — hand portions, no counting
  | 'NoFloor'; // Suitable when no clean floor / mat is available

/** Where the exercise can be performed. */
export type Venue =
  | 'desk' // At the workstation, brief, clothed
  | 'standing' // Anywhere standing, no floor needed
  | 'yard' // Outside, requires open space
  | 'mat' // Floor work — requires clean surface
  | 'wall' // Needs a wall or doorframe
  | 'porch'; // Hang point on the side of the backyard deck

export interface Exercise {
  id: string;
  element: ElementId;
  name: string;
  /** One sentence — why am I doing this. */
  purpose: string;
  /** Prescribed dose, e.g. "3 × 10" or "60 sec" or "2 min". */
  dose: string;
  /** Bullet cues for form / focus, in order. */
  cues?: string[];
  targets: Target[];
  venues: Venue[];
  /**
   * Approximate duration in seconds — used by the reminder engine to pick
   * micro-drills that fit a given window.
   */
  approxSeconds: number;
}
