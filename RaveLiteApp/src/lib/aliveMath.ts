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
