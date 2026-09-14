import {
  bumpEnergy,
  decayEnergy,
  intensityBudget,
  resolveMotionMode,
  sineStops,
  steppedBreath,
} from '../aliveMath';

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

describe('steppedBreath', () => {
  const {inputRange, outputRange} = steppedBreath(0.02, 0.05, 8);

  it('covers phase 0 → 1 with non-decreasing stops', () => {
    expect(inputRange[0]).toBe(0);
    expect(inputRange[inputRange.length - 1]).toBe(1);
    for (let i = 1; i < inputRange.length; i++) {
      expect(inputRange[i]).toBeGreaterThanOrEqual(inputRange[i - 1]);
    }
    expect(outputRange).toHaveLength(inputRange.length);
  });

  it('holds on at most levels + 1 distinct opacities inside the budget', () => {
    expect(new Set(outputRange).size).toBeLessThanOrEqual(9);
    for (const v of outputRange) {
      expect(v).toBeGreaterThanOrEqual(0.02 - 1e-9);
      expect(v).toBeLessThanOrEqual(0.05 + 1e-9);
    }
  });

  it('starts and ends the breath at the floor, peaking at the ceiling', () => {
    expect(outputRange[0]).toBeCloseTo(0.02);
    expect(outputRange[outputRange.length - 1]).toBeCloseTo(0.02);
    expect(Math.max(...outputRange)).toBeCloseTo(0.05);
  });

  it('jumps between steps rather than gliding', () => {
    for (let i = 1; i < inputRange.length; i++) {
      const gliding =
        inputRange[i] > inputRange[i - 1] && outputRange[i] !== outputRange[i - 1];
      expect(gliding).toBe(false);
    }
  });
});

describe('touch energy', () => {
  it('drains linearly and never below zero', () => {
    expect(decayEnergy(0.6, 750, 1500)).toBeCloseTo(0.1);
    expect(decayEnergy(0.6, 5000, 1500)).toBe(0);
    expect(decayEnergy(0.6, 100, 0)).toBe(0);
  });

  it('a touch adds a share of the headroom and saturates below 1', () => {
    expect(bumpEnergy(0)).toBeCloseTo(0.35);
    let v = 0;
    for (let i = 0; i < 50; i++) {
      v = bumpEnergy(v);
    }
    expect(v).toBeLessThanOrEqual(1);
    expect(bumpEnergy(2)).toBe(1);
  });
});

describe('motion budgets', () => {
  it('keeps idle motion within the agreed limits', () => {
    expect(intensityBudget('whisper')).toMatchObject({breathMin: 0.02, breathMax: 0.05});
    expect(intensityBudget('glow').breathMax).toBeLessThanOrEqual(0.09);
    for (const mode of ['whisper', 'glow', 'still', 'off'] as const) {
      const b = intensityBudget(mode);
      expect(b.energyMax).toBeLessThanOrEqual(0.06);
      expect(b.cuePeak).toBeLessThanOrEqual(0.14);
    }
  });

  it('still has no breathing; off has no breathing or touch but a gentle chime', () => {
    expect(intensityBudget('still')).toMatchObject({breathMax: 0});
    expect(intensityBudget('still').energyMax).toBeGreaterThan(0);
    expect(intensityBudget('off')).toMatchObject({breathMax: 0, energyMax: 0});
    expect(intensityBudget('off').cuePeak).toBeGreaterThan(0);
  });

  it('reduce motion, night or pause force off; otherwise the setting wins', () => {
    const base = {reduceMotion: false, night: false, paused: false, setting: 'glow' as const};
    expect(resolveMotionMode(base)).toBe('glow');
    expect(resolveMotionMode({...base, reduceMotion: true})).toBe('off');
    expect(resolveMotionMode({...base, night: true})).toBe('off');
    expect(resolveMotionMode({...base, paused: true})).toBe('off');
  });
});
