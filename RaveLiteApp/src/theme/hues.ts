/**
 * Named colours for things that are not elements.
 *
 * The five elements own the app's main colour language — Fire red, Air
 * yellow, Earth green, Water blue, Heart the chosen accent — and that
 * carries anything about *training*. It carries nothing about the rest:
 * a settings row, a service branch, a material, an idea. Those pages went
 * out grey, and grey is what a screen looks like when nobody decided.
 *
 * Every hue here is picked to sit on `palette.bg` (#06070A) and stay
 * legible at 12 pt. Real-world colours are lightened where the true shade
 * would disappear — US Navy blue is nearly black, and a nearly black
 * label on a black page is not a label.
 *
 * Rule for adding one: a hue earns its place when something in the app
 * genuinely *is* that colour to a person. Wood is brown because wood is
 * brown. A pack of military tests is olive because that is the colour of
 * the thing. If you are reaching for an adjective instead of a noun, you
 * probably want an element.
 */

export const hues = {
  // ── Concepts ────────────────────────────────────────────────────────
  /** An idea, a tip, the lightbulb. */
  idea: '#FFD60A',
  /** Something worth reading before acting. */
  info: '#5AC8FA',
  /** Careful. Not an error. */
  warning: '#FF9F0A',
  /** It went wrong, or it will. */
  danger: '#FF453A',
  /** It worked. */
  success: '#32D74B',
  /** Hidden, private, yours alone. */
  secret: '#BF5AF2',
  /** Time, waiting, scheduled. */
  time: '#64D2FF',
  /** Locked, or not yet earned. */
  locked: '#6B7280',

  // ── Places and the day ──────────────────────────────────────────────
  /** A desk, a screen, indoors and still. */
  desk: '#8E8CD8',
  /** An office: other people, quieter. */
  office: '#7D8CA3',
  /** On your feet, a shift, a site. */
  shift: '#FF9F0A',
  /** Only some days: the week is not yours. */
  weekend: '#C77DFF',
  /** Away from home. */
  travel: '#5AC8FA',
  /** A festival. */
  festival: '#FF2D9D',
  /** Rest, night, off. */
  rest: '#8A93A6',
  /** Hurt. */
  injury: '#FF6B6B',

  // ── Materials ───────────────────────────────────────────────────────
  wood: '#A9714B',
  stone: '#9AA0A6',
  metal: '#C0C6CF',
  brick: '#B4553A',
  cloth: '#D9B08C',
  rope: '#C8A96E',
  glass: '#A8DADC',
  earthGround: '#7C5E3C',
  grass: '#5FA052',

  // ── Services ────────────────────────────────────────────────────────
  // Lightened from the official shades, which are built for white paper.
  army: '#7A8B4A',
  navy: '#5B8DD9',
  airForce: '#6FA8DC',
  marines: '#E03C3C',
  marinesGold: '#FFC94A',
  spaceForce: '#8AA9E6',
  coastGuard: '#FF8A3D',

  // ── Disciplines ─────────────────────────────────────────────────────
  dance: '#FF2D9D',
  martial: '#FF5E5B',
  staff: '#C8A96E',
  yoga: '#9BE0B5',
  jumps: '#FFD166',
  running: '#4ECDC4',
  tests: '#7A8B4A',
} as const;

export type HueName = keyof typeof hues;

/** A translucent version, for the tinted backgrounds cards use. */
export const tint = (hue: string, alpha = '14'): string => `${hue}${alpha}`;
