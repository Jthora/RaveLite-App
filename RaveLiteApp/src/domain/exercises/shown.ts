/**
 * What the app has already offered, so it stops offering the same eight.
 *
 * Ranking is deterministic: the same context scores the same drills the
 * same way, every time. Two scorers were meant to break that up, and
 * both key off drills you *completed* — so a drill you were shown and
 * swapped past carried no penalty at all and came straight back. With
 * sixty-seven reachable Fire drills, the result was a top handful on a
 * loop and burpees sitting at rank twenty-seven, present and invisible.
 *
 * The missing fact was never about the library. It was that nothing
 * remembered what had been *shown*.
 *
 * So: a drill that was offered sinks, and climbs back out over about a
 * week. Swapping past one sinks it harder, because that is a person
 * saying "not this, not now" rather than the app guessing.
 *
 * Kept small on purpose — one entry per drill, pruned past the window,
 * stored as a single blob. Nothing here leaves the phone, and losing it
 * costs a week of variety and nothing else.
 */
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';

const DAY_MS = 86_400_000;

/**
 * How long an offered drill stays penalised.
 *
 * Fourteen, and the number is the whole fix. Measured against the real
 * Fire library, the window decides how wide the rotation gets and the
 * penalty barely matters: an eight-day window plateaus at seven or eight
 * drills however hard it pushes, because by the time it has cycled that
 * many the first is already recovering. Fourteen days reaches twelve to
 * fourteen — with the gentlest penalty, which is what keeps the scoring's
 * judgement intact rather than shouting over it.
 */
export const SHOWN_WINDOW_DAYS = 14;

/**
 * The penalty at full strength, decaying to zero across the window.
 * Deliberately small: it nudges, it does not overrule. A drill is top of
 * the list for reasons — it fits the window, the focus and the hour —
 * and shoving rank twenty-seven to the front would serve something worse.
 */
const SHOWN_PENALTY = 5;

/** A swap says more than a glance, so it costs more. */
const SWAPPED_PENALTY = 9;

interface Mark {
  at: number;
  /** True when the person swapped past it rather than merely saw it. */
  swapped?: boolean;
}

type Marks = Record<string, Mark>;

function read(): Marks {
  const raw = store.getString(KEYS.drillsShown);
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Marks) : {};
  } catch {
    // A corrupt blob is worth less than a week of variety. Start again.
    return {};
  }
}

function write(marks: Marks, now: number): void {
  const cutoff = now - SHOWN_WINDOW_DAYS * DAY_MS;
  const kept: Marks = {};
  for (const [id, mark] of Object.entries(marks)) {
    if (mark.at >= cutoff) {
      kept[id] = mark;
    }
  }
  store.set(KEYS.drillsShown, JSON.stringify(kept));
}

/** Remember that this drill was put in front of somebody. */
export function noteShown(id: string, now: number = Date.now()): void {
  const marks = read();
  // A swap already recorded today is the stronger signal; do not let a
  // re-render downgrade it back to a glance.
  const existing = marks[id];
  const swapped = existing?.swapped && existing.at >= now - DAY_MS;
  marks[id] = swapped ? {at: now, swapped: true} : {at: now};
  write(marks, now);
}

/** Remember that somebody swapped past this drill. */
export function noteSwapped(id: string, now: number = Date.now()): void {
  const marks = read();
  marks[id] = {at: now, swapped: true};
  write(marks, now);
}

/**
 * The penalty for a drill right now: strongest the moment it was shown,
 * gone once the window has passed. Linear, because nobody can tell the
 * difference and a curve would only be harder to reason about.
 */
export function shownPenalty(id: string, now: number = Date.now()): number {
  const mark = read()[id];
  if (!mark) {
    return 0;
  }
  const age = now - mark.at;
  const window = SHOWN_WINDOW_DAYS * DAY_MS;
  if (age >= window || age < 0) {
    return 0;
  }
  const full = mark.swapped ? SWAPPED_PENALTY : SHOWN_PENALTY;
  return full * (1 - age / window);
}

/** Every penalty at once, so ranking reads the blob a single time. */
export function shownPenalties(
  now: number = Date.now(),
): ReadonlyMap<string, number> {
  const out = new Map<string, number>();
  const window = SHOWN_WINDOW_DAYS * DAY_MS;
  for (const [id, mark] of Object.entries(read())) {
    const age = now - mark.at;
    if (age >= 0 && age < window) {
      const full = mark.swapped ? SWAPPED_PENALTY : SHOWN_PENALTY;
      out.set(id, full * (1 - age / window));
    }
  }
  return out;
}

/** Only for tests. */
export function __resetShown(): void {
  store.delete(KEYS.drillsShown);
}
