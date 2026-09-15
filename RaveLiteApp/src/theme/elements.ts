/**
 * Elemental identity — the metaphysical spine of RaveLite.
 *
 * Five elements. Four classical (Fire, Air, Earth, Water) plus Heart as the
 * non-spectral integrator (magenta = the color that doesn't exist in the
 * visible spectrum, only in perception — the conductor).
 *
 * Every screen, badge, accent, notification, and progress bar pulls its
 * identity from this file. Single source of truth.
 */

export type ElementId = 'fire' | 'air' | 'earth' | 'water' | 'heart';

/** SVG glyph shapes, drawn by `components/icons/ElementGlyph`. */
export type GlyphIconId = 'star5' | 'star6' | 'commander';

export interface ElementIdentity {
  id: ElementId;
  /** Display name. */
  name: string;
  /** One-line domain — what training lives here. */
  domain: string;
  /** Long-form purpose — drives copy and onboarding. */
  ethos: string;
  /** Alchemical glyph (unicode); also the text fallback for `icon`. */
  glyph: string;
  /** An SVG shape drawn in place of `glyph` wherever the UI can. */
  icon?: GlyphIconId;
  /** Emoji fallback if alchemical glyph fails to render. */
  emoji: string;
  /** Primary brand color for this element. */
  color: string;
  /** Soft tint of the brand color for backgrounds (0.12 alpha hex). */
  tint: string;
  /** Deep shade for active gradients / pressed states. */
  deep: string;
  /** Secondary accent for highlights / pulses. */
  accent: string;
  /**
   * Ceremonial verb used in place of "Mark Done" when sealing a drill.
   * Kept on the element so the felt vocabulary lives at the source of
   * truth, not scattered across components.
   */
  verbDone: string;
}

export const ELEMENTS: Record<ElementId, ElementIdentity> = {
  fire: {
    id: 'fire',
    name: 'Fire',
    domain: 'Power & Conditioning',
    ethos:
      'Outward expression of force. Lean strength and fat-burning heat: push-ups, porch pull-ups, sprints, kicks, explosive rounds. Burn the cage.',
    glyph: '\u{1F702}', // 🜂
    emoji: '🔥',
    color: '#FF3B2F',
    tint: '#FF3B2F1F',
    deep: '#B81E15',
    accent: '#FF8A3D',
    verbDone: 'Ignite',
  },
  air: {
    id: 'air',
    name: 'Air',
    domain: 'Breath & Posture',
    ethos:
      'The unwinding of the spine. UCS reversal, abdominal-grip release, diaphragmatic breath, neck reset. Lift from the crown.',
    glyph: '\u{1F701}', // 🜁
    emoji: '💨',
    color: '#FFD60A',
    tint: '#FFD60A1F',
    deep: '#B89500',
    accent: '#FFF275',
    verbDone: 'Inhale',
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    domain: 'Foundation & Core',
    ethos:
      'Pelvis, glutes, hips, core. Crunches, leg-ups, side-ups, planks, squats, hangs and brick carries. Reverse anterior pelvic tilt. Build the base that holds every flow.',
    glyph: '\u{1F703}', // 🜃
    emoji: '🌍',
    color: '#34C759',
    tint: '#34C7591F',
    deep: '#1F8A3C',
    accent: '#7CF59E',
    verbDone: 'Root',
  },
  water: {
    id: 'water',
    name: 'Water',
    domain: 'Flow & Fascia',
    ethos:
      'Staff flow and dance-combat on the beat. Long fascia stretches that turn stiffness into glide. Drink on the call. Adapt without breaking shape.',
    glyph: '\u{1F704}', // 🜄
    emoji: '💧',
    color: '#0A84FF',
    tint: '#0A84FF1F',
    deep: '#0A4FB8',
    accent: '#5DBBFF',
    verbDone: 'Flow',
  },
  heart: {
    id: 'heart',
    name: 'Heart',
    domain: 'Integration & Cadence',
    ethos:
      'The conductor. Schedule, reminders, streaks, presence. Where the four meet and the rave begins.',
    glyph: '\u2661', // ♡ — outline heart, text presentation
    emoji: '♦',
    color: '#FF2D9D',
    tint: '#FF2D9D1F',
    deep: '#B0186E',
    accent: '#C6FF00', // chartreuse — the heart pulse
    verbDone: 'Seal',
  },
};

/** Tab bar order. Heart deliberately centered. */
export const ELEMENT_ORDER: ElementId[] = [
  'fire',
  'air',
  'heart',
  'earth',
  'water',
];

export const elementOf = (id: ElementId): ElementIdentity => ELEMENTS[id];
