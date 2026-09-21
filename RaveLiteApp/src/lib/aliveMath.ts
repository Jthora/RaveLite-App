/**
 * Alive-layer math — pure helpers behind the app's breathing motion.
 *
 * Kept free of React and Animated so the shapes and budgets are unit-
 * testable. Animated consumers turn these into native-driver
 * interpolations; nothing here runs per frame.
 */

export interface InterpolationStops {
  inputRange: number[];
  outputRange: number[];
}

/**
 * One smooth 0 → 1 → 0 breath across phase 0 → 1, sampled at `samples`
 * segments. Driving a linear native loop through this interpolation
 * gives a sine-shaped pulse with no JS hop per cycle.
 */
export function sineStops(samples: number): InterpolationStops {
  const n = Math.max(2, Math.floor(samples));
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    inputRange.push(x);
    outputRange.push((1 - Math.cos(2 * Math.PI * x)) / 2);
  }
  return {inputRange, outputRange};
}

/**
 * The breath as a *stepped* opacity curve between `min` and `max`: the
 * value holds on `levels` discrete steps instead of gliding. At a few
 * percent opacity the eye can't tell, but Android skips redrawing a view
 * whose alpha didn't change — so a breath redraws ~2 × levels times per
 * cycle instead of every frame.
 */
export function steppedBreath(
  min: number,
  max: number,
  levels: number,
  samples = 48,
): InterpolationStops {
  const {inputRange: xs, outputRange: ys} = sineStops(samples);
  const n = Math.max(1, Math.floor(levels));
  const level = (y: number) => min + ((max - min) * Math.round(y * n)) / n;
  const inputRange = [0];
  const outputRange = [level(ys[0])];
  for (let i = 1; i < xs.length; i++) {
    const next = level(ys[i]);
    const held = outputRange[outputRange.length - 1];
    if (next !== held) {
      inputRange.push(xs[i], xs[i]);
      outputRange.push(held, next);
    }
  }
  if (inputRange[inputRange.length - 1] !== 1) {
    inputRange.push(1);
    outputRange.push(outputRange[outputRange.length - 1]);
  }
  return {inputRange, outputRange};
}

/** Touch energy after `dtMs` of linear drain from `v0` (a full drain takes `decayMs`). */
export function decayEnergy(v0: number, dtMs: number, decayMs: number): number {
  if (decayMs <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, v0) - Math.max(0, dtMs) / decayMs);
}

/** Share of the remaining headroom a touch adds. */
export const TOUCH_BUMP = 0.35;

/** A touch adds a share of the headroom: rapid taps saturate, never overshoot. */
export function bumpEnergy(v: number): number {
  const clamped = Math.max(0, Math.min(1, v));
  return clamped + (1 - clamped) * TOUCH_BUMP;
}

/** The operator's chosen level of idle motion. */
export type AliveIntensity = 'whisper' | 'glow' | 'still';

/** Effective motion: the chosen intensity, or 'off' when something forces stillness. */
export type MotionMode = AliveIntensity | 'off';

export interface MotionBudget {
  /** Breathing aura opacity range. 0–0 means no breathing. */
  breathMin: number;
  breathMax: number;
  /** Extra aura opacity at full touch / beat energy. */
  energyMax: number;
  /** Peak opacity of the full-screen wash when a chime fires. */
  cuePeak: number;
  /** Peak opacity of the wash when entering an element's screen. */
  enterPeak: number;
}

const BUDGETS: Record<MotionMode, MotionBudget> = {
  whisper: {
    breathMin: 0.02,
    breathMax: 0.05,
    energyMax: 0.04,
    cuePeak: 0.14,
    enterPeak: 0.1,
  },
  glow: {
    breathMin: 0.04,
    breathMax: 0.09,
    energyMax: 0.06,
    cuePeak: 0.14,
    enterPeak: 0.12,
  },
  // "Still until a chime": no idle breathing, touches and chimes still move.
  still: {
    breathMin: 0,
    breathMax: 0,
    energyMax: 0.04,
    cuePeak: 0.14,
    enterPeak: 0.1,
  },
  // Forced stillness (Remove animations / night / pause): only a gentle
  // chime fade remains so a chime is still visibly felt.
  off: {breathMin: 0, breathMax: 0, energyMax: 0, cuePeak: 0.08, enterPeak: 0},
};

export function intensityBudget(mode: MotionMode): MotionBudget {
  return BUDGETS[mode];
}

/** Priority: Android "Remove animations", night, or pause → off; else the setting. */
export function resolveMotionMode(input: {
  reduceMotion: boolean;
  night: boolean;
  paused: boolean;
  setting: AliveIntensity;
}): MotionMode {
  if (input.reduceMotion || input.night || input.paused) {
    return 'off';
  }
  return input.setting;
}
