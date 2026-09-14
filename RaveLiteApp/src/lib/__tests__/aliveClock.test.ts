import {
  ACTIVE_BPM,
  __test,
  getMotionMode,
  getWash,
  releaseBreath,
  retainBreath,
  setIntensity,
  setNight,
  setPaused,
  setReduceMotion,
  setTempo,
  touch,
  washWith,
} from '../aliveClock';

beforeEach(() => {
  __test.reset();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('motion mode', () => {
  it('follows the intensity setting until something forces stillness', () => {
    expect(getMotionMode()).toBe('whisper');
    setIntensity('glow');
    expect(getMotionMode()).toBe('glow');
    setNight(true);
    expect(getMotionMode()).toBe('off');
    setNight(false);
    setReduceMotion(true);
    expect(getMotionMode()).toBe('off');
    setReduceMotion(false);
    setPaused(true);
    expect(getMotionMode()).toBe('off');
    setPaused(false);
    expect(getMotionMode()).toBe('glow');
  });
});

describe('breathing loop', () => {
  it('runs only while something renders it, with a short release grace', () => {
    expect(__test.isLooping()).toBe(false);
    retainBreath();
    expect(__test.isLooping()).toBe(true);
    releaseBreath();
    expect(__test.isLooping()).toBe(true);
    jest.advanceTimersByTime(300);
    expect(__test.isLooping()).toBe(false);
  });

  it('restarts when a remount re-attaches inside the grace period', () => {
    retainBreath();
    releaseBreath();
    retainBreath();
    expect(__test.isLooping()).toBe(true);
    expect(__test.loopStarts()).toBe(2);
  });

  it('stops in Still and at night, and resumes when allowed', () => {
    retainBreath();
    setIntensity('still');
    expect(__test.isLooping()).toBe(false);
    setIntensity('whisper');
    expect(__test.isLooping()).toBe(true);
    setNight(true);
    expect(__test.isLooping()).toBe(false);
  });

  it('takes a faster tempo while a pulse is active', () => {
    setTempo(ACTIVE_BPM);
    expect(__test.bpm()).toBe(ACTIVE_BPM);
  });
});

describe('touch energy', () => {
  it('bumps, ignores taps inside the throttle, and saturates below 1', () => {
    touch(1_000);
    const first = __test.energyLevel();
    expect(first).toBeCloseTo(0.35);
    touch(1_050);
    expect(__test.energyLevel()).toBe(first);
    for (let i = 0; i < 20; i++) {
      touch(2_000 + i * 130);
    }
    expect(__test.energyLevel()).toBeGreaterThan(0.8);
    expect(__test.energyLevel()).toBeLessThan(1);
  });

  it('does nothing when motion is forced off', () => {
    setReduceMotion(true);
    touch(1_000);
    expect(__test.energyLevel()).toBe(0);
  });
});

describe('wash', () => {
  it('uses the element color at the budget peak; gentler when motion is off', () => {
    washWith('#FF3B2F', 'cue');
    expect(getWash()).toEqual({color: '#FF3B2F', peak: 0.14});
    setReduceMotion(true);
    washWith('#0A84FF', 'cue');
    expect(getWash()).toEqual({color: '#0A84FF', peak: 0.08});
    // Entering an element doesn't wash when motion is off.
    washWith('#34C759', 'enter');
    expect(getWash().color).toBe('#0A84FF');
  });
});
