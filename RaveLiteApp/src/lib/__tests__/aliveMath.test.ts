import {sineStops} from '../aliveMath';

describe('sineStops', () => {
  it('breathes 0 → 1 → 0 across one phase cycle', () => {
    const {inputRange, outputRange} = sineStops(16);
    expect(inputRange).toHaveLength(17);
    expect(inputRange[0]).toBe(0);
    expect(inputRange[16]).toBe(1);
    expect(outputRange[0]).toBeCloseTo(0);
    expect(outputRange[8]).toBeCloseTo(1);
    expect(outputRange[16]).toBeCloseTo(0);
  });

  it('input stops strictly increase, as Animated.interpolate requires', () => {
    const {inputRange} = sineStops(5.7);
    for (let i = 1; i < inputRange.length; i++) {
      expect(inputRange[i]).toBeGreaterThan(inputRange[i - 1]);
    }
  });

  it('rises then falls symmetrically', () => {
    const {outputRange} = sineStops(12);
    for (let i = 0; i <= 6; i++) {
      expect(outputRange[i]).toBeCloseTo(outputRange[12 - i]);
    }
    expect(outputRange[3]).toBeGreaterThan(outputRange[2]);
  });

  it('clamps silly sample counts to a usable shape', () => {
    expect(sineStops(0).inputRange).toEqual([0, 0.5, 1]);
  });
});
