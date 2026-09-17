import {
  PRACTICE_CAP,
  characterLevel,
  focusMultiplier,
  gainXp,
  levelFromResult,
  losesLevelAfter,
  xpThrough,
  xpToNext,
} from '../levels';

describe('the curve', () => {
  it('costs more the higher you are', () => {
    expect(xpToNext(0)).toBe(8);
    expect(xpToNext(50)).toBe(16);
    expect(xpToNext(84)).toBe(50);
    // Months of steady work to the practice cap, not weeks.
    expect(xpThrough(PRACTICE_CAP)).toBeGreaterThan(1200);
    expect(xpThrough(PRACTICE_CAP)).toBeLessThan(1800);
  });

  it('takes levels one at a time and banks the rest', () => {
    expect(gainXp({level: 0, xp: 0}, 4)).toEqual({level: 0, xp: 4});
    expect(gainXp({level: 0, xp: 4}, 4)).toEqual({level: 1, xp: 0});
    const big = gainXp({level: 0, xp: 0}, 100);
    expect(big.level).toBeGreaterThan(5);
    expect(big.xp).toBeLessThan(xpToNext(big.level));
  });

  it('stops at the practice cap and banks nothing there', () => {
    expect(gainXp({level: 84, xp: 0}, 10_000)).toEqual({
      level: PRACTICE_CAP,
      xp: 0,
    });
  });
});

describe('the rest of the rules', () => {
  it('lets Focus speed everything up, but never tax it', () => {
    expect(focusMultiplier(50)).toBe(1);
    expect(focusMultiplier(85)).toBeCloseTo(1.175);
    expect(focusMultiplier(0)).toBe(1);
    expect(focusMultiplier(100)).toBe(1.25);
  });

  it('reads a test result as a level: perfect is 100, half of one is 50', () => {
    expect(levelFromResult(56, 56, 'higher')).toBe(100);
    expect(levelFromResult(28, 56, 'higher')).toBe(50);
    // A perfect 3-mile is 18:00, so 27:00 is halfway and 36:00 is nowhere.
    expect(levelFromResult(1080, 1080, 'lower')).toBe(100);
    expect(levelFromResult(1620, 1080, 'lower')).toBe(50);
    expect(levelFromResult(2160, 1080, 'lower')).toBe(0);
    expect(levelFromResult(0, 1080, 'lower')).toBe(0);
  });

  it('slides a fortnight after the last time you touched it, weekly', () => {
    expect(losesLevelAfter(13)).toBe(false);
    expect(losesLevelAfter(14)).toBe(false);
    expect(losesLevelAfter(21)).toBe(true);
    expect(losesLevelAfter(22)).toBe(false);
    expect(losesLevelAfter(28)).toBe(true);
  });

  it('turns everything earned into one character level', () => {
    expect(characterLevel(0)).toEqual({level: 1, into: 0, needs: 500});
    expect(characterLevel(500)).toEqual({level: 2, into: 0, needs: 1000});
    expect(characterLevel(1600)).toEqual({level: 3, into: 100, needs: 1500});
  });
});
