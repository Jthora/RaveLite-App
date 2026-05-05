import {Vibration} from 'react-native';
import {ElementId} from '../theme/elements';

/**
 * Element-signature haptics — RaveLite's body-learnable vocabulary.
 *
 * Each element has a tactile fingerprint. The body learns "this is
 * Fire" before the eyes can read the screen — which is the whole
 * point of an embodied ritual companion.
 *
 *   Fire   — three quick stabs        (jolt awake)
 *   Air    — one light tap            (bird-light)
 *   Earth  — one long deep press      (rooting)
 *   Water  — rolling double           (wave)
 *   Heart  — steady single            (the conductor's metronome)
 *
 * `enter` is a softer hint when the user navigates *into* an element's
 * house. `seal` is the louder confirmation when a drill or circuit leg
 * is completed.
 *
 * Pure side-effecting wrapper around RN Vibration. No new native deps.
 * Honors a user-disable flag so future settings can mute haptics.
 */

type Strength = 'enter' | 'seal';

let enabled = true;
export function setHapticsEnabled(v: boolean): void {
  enabled = v;
}
export function getHapticsEnabled(): boolean {
  return enabled;
}

/** Seal-strength patterns. `enter` patterns are derived ~50% softer. */
const SEAL_PATTERNS: Record<ElementId, number[]> = {
  fire: [0, 50, 80, 50, 80, 50],
  air: [0, 40],
  earth: [0, 220],
  water: [0, 110, 140, 110],
  heart: [0, 140],
};

const ENTER_PATTERNS: Record<ElementId, number[]> = {
  fire: [0, 25, 60, 25],
  air: [0, 18],
  earth: [0, 110],
  water: [0, 55, 90, 55],
  heart: [0, 70],
};

/**
 * Fire the haptic for an element at the requested strength.
 * Safe to call even when haptics are disabled or unsupported (no-op).
 */
export function pulseHaptic(element: ElementId, strength: Strength): void {
  if (!enabled) {
    return;
  }
  const pattern =
    strength === 'seal' ? SEAL_PATTERNS[element] : ENTER_PATTERNS[element];
  // RN's Vibration.vibrate accepts a [delay, vib, delay, vib, …] pattern
  // on Android. The leading 0 is the wait-before-start.
  try {
    Vibration.vibrate(pattern, false);
  } catch {
    // Some emulators / iOS variants will throw on patterns. Fall back
    // to a single short pulse so the body still gets *something*.
    try {
      Vibration.vibrate(40);
    } catch {
      /* swallow — haptics are non-essential. */
    }
  }
}
