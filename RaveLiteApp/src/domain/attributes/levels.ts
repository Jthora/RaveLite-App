/**
 * How an attribute grows — Jagged Alliance's rules, in a body.
 *
 *   - You grow by doing. There are no points to spend.
 *   - The next level costs more the higher you are: in JA2 the chance of
 *     a gain is `100 − stat`, so a level here costs XP in proportion.
 *   - Focus speeds learning, the way Wisdom did.
 *   - Practice alone stops at 85. Past that only a passed test counts —
 *     tests are this game's bobbleheads.
 *   - Neglect costs. An attribute left alone slides back, but never below
 *     what you have actually tested.
 */

export const MAX_LEVEL = 100;
/** Volume alone reaches this and no further. */
export const PRACTICE_CAP = 85;
/** A level at 0 costs this much XP; the cost rises from there. */
export const XP_BASE = 8;
/** Untouched this long and an attribute starts to slide. */
export const NEGLECT_DAYS = 14;
/** Then it loses a level every this many days. */
export const NEGLECT_STEP_DAYS = 7;

/** XP from `level` to the next one — `XP_BASE × 100 / (100 − level)`. */
export function xpToNext(level: number): number {
  const at = Math.max(0, Math.min(level, MAX_LEVEL - 1));
  return Math.round((XP_BASE * 100) / (100 - at));
}

/** Total XP practice has to pour in to reach `level` from nothing. */
export function xpThrough(level: number): number {
  let total = 0;
  for (let at = 0; at < level; at++) {
    total += xpToNext(at);
  }
  return total;
}

export interface Progress {
  level: number;
  /** XP banked toward the next level. */
  xp: number;
}

/**
 * Pour XP in. Levels are taken one at a time, so a big day can carry an
 * attribute up more than one. At the cap the overflow is dropped rather
 * than banked: nothing to cash in the day a test finally raises it.
 */
export function gainXp(
  at: Progress,
  xp: number,
  cap: number = PRACTICE_CAP,
): Progress {
  let level = Math.min(at.level, cap);
  let banked = at.xp + Math.max(0, xp);
  while (level < cap && banked >= xpToNext(level)) {
    banked -= xpToNext(level);
    level += 1;
  }
  return {level, xp: level >= cap ? 0 : banked};
}

/** Jagged Alliance's Wisdom rule: attribute XP × this. */
export function focusMultiplier(focusLevel: number): number {
  const scaled = 1 + (focusLevel - 50) / 200;
  return Math.max(0.75, Math.min(1.25, scaled));
}

/**
 * A test result as a level: a perfect score is 100, half of one is 50.
 * For a timed event, twice the perfect time is 0 — that's the floor a
 * first attempt lands above.
 */
export function levelFromResult(
  value: number,
  top: number,
  better: 'higher' | 'lower',
): number {
  if (top <= 0 || value <= 0) {
    return 0;
  }
  const ratio = better === 'higher' ? value / top : 2 - value / top;
  return Math.max(0, Math.min(MAX_LEVEL, Math.round(ratio * 100)));
}

/** True on the days an untouched attribute loses a level. */
export function losesLevelAfter(idleDays: number): boolean {
  return (
    idleDays > NEGLECT_DAYS &&
    (idleDays - NEGLECT_DAYS) % NEGLECT_STEP_DAYS === 0
  );
}

/** Level n → n+1 costs this much of the total XP earned. */
export const LEVEL_XP = 500;

export interface CharacterLevel {
  level: number;
  /** XP into the current level. */
  into: number;
  /** XP the current level needs in total. */
  needs: number;
}

/** Everything earned, everywhere, as one level. Level 1 is the start. */
export function characterLevel(totalXp: number): CharacterLevel {
  let level = 1;
  let left = Math.max(0, totalXp);
  while (left >= LEVEL_XP * level) {
    left -= LEVEL_XP * level;
    level += 1;
  }
  return {level, into: Math.round(left), needs: LEVEL_XP * level};
}
