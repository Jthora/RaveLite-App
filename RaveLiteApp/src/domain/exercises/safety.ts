/**
 * Safety lines go first.
 *
 * The chime card has room for three cues and a notification for one, and
 * the line that says when to stop was usually the fourth or fifth. So
 * wherever cues are cut short, the ones that keep somebody safe are moved
 * to the front — the rest keep their order. The full list, everywhere it
 * is shown whole, stays as written.
 */

/** Every test drill opens with this. */
export const STOP_LINE =
  'Stop at once for chest pain, dizziness or feeling faint';

const SAFETY =
  /\bstop (at once|and (reset|rest) if|if)\b|\bstop the session if\b|\bshould not hurt\b|\bnever force\b|\btest the hang point\b|\b(practice (props?|staff)|soft poi) only\b|\bclear (space|a |an |arm|3 m)|\bsoft ground\b|\bgrass only\b|\btraffic\b|\b(sharp|chest) pain\b/i;

export function isSafetyCue(cue: string): boolean {
  return SAFETY.test(cue);
}

/** The same cues, safety lines first, otherwise in their own order. */
export function safetyFirst(cues: readonly string[]): string[] {
  return [...cues.filter(isSafetyCue), ...cues.filter(c => !isSafetyCue(c))];
}
