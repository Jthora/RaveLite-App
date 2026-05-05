/**
 * Heart variants — selectable identities for the central conductor.
 *
 * Why variants: the conductor element is the closest thing to the user's
 * own self in the metaphor. Different operators want different framings.
 * "Heart" (♡, magenta) is the default — emotional/integrative. "Core"
 * (⊙, gold) is the geometric/abstract framing — center-of-mass, hub,
 * point-of-truth.
 *
 * How variants are applied: we mutate the `ELEMENTS.heart` object at
 * boot (after persistence hydration) and on user switch. Mutation is
 * acceptable because:
 *   1. Every consumer reads `ELEMENTS.heart.<field>` lazily inside
 *      render functions — they pick up the new values on the next render.
 *   2. We push a re-render via a tiny subscriber bus consumed by `App.tsx`,
 *      which re-keys the shell so all screens re-mount with the new theme.
 *
 * The `'heart'` ElementId stays the same — we are NOT introducing a new
 * element. Plans, journal entries, sub-tab registries, and storage keys
 * all continue to use `'heart'` regardless of variant. The variant is a
 * pure presentation skin: name, glyph, colors, ethos, verb.
 */
import {ELEMENTS, type ElementIdentity} from './elements';
import {store} from '../storage';
import {KEYS} from '../storage/keys';

export type HeartVariantId = 'heart' | 'core';

export interface HeartVariantDef {
  id: HeartVariantId;
  /** Identity overrides applied to ELEMENTS.heart. */
  identity: Omit<ElementIdentity, 'id'>;
  /** One-line description for the picker. */
  description: string;
}

/**
 * Geometric / abstract symbols only. No cultural or religious glyphs.
 *  ⊙  U+2299  CIRCLED DOT OPERATOR    — circle with a point in the center
 *  ♡  U+2661  WHITE HEART SUIT        — outline heart, geometric
 *
 * Color palette for `core`:
 *   Hue ~32° — orange that sits between yellow (~60°) and red (~0°).
 *   Saturated and OLED-bright. Pairs with chartreuse pulse-accent.
 */
export const HEART_VARIANTS: Record<HeartVariantId, HeartVariantDef> = {
  heart: {
    id: 'heart',
    description: 'Magenta conductor — the integrator that doesn’t exist in the spectrum.',
    identity: {
      name: 'Heart',
      domain: 'Integration & Cadence',
      ethos:
        'The conductor. Schedule, reminders, streaks, presence. Where the four meet and the rave begins.',
      glyph: '\u2661', // ♡
      emoji: '♦',
      color: '#FF2D9D',
      tint: '#FF2D9D1F',
      deep: '#B0186E',
      accent: '#C6FF00',
      verbDone: 'Seal',
    },
  },
  core: {
    id: 'core',
    description: 'Gold core — the center point, the geometric hub.',
    identity: {
      name: 'Core',
      domain: 'Center & Cadence',
      ethos:
        'The center point. Schedule, reminders, presence. The hub the four orbit; the still place the rave departs from and returns to.',
      glyph: '\u2299', // ⊙
      emoji: '◉',
      color: '#FF9F0A',
      tint: '#FF9F0A1F',
      deep: '#B86F00',
      accent: '#C6FF00',
      verbDone: 'Center',
    },
  },
};

const STORAGE_KEY = KEYS.setting('heart.variant');

/**
 * Read the persisted variant id. Falls back to `'heart'` for unknown
 * values (defensive against a future enum-rename).
 */
export function getHeartVariant(): HeartVariantId {
  const raw = store.getString(STORAGE_KEY);
  if (raw === 'heart' || raw === 'core') {
    return raw;
  }
  return 'heart';
}

/**
 * Apply a variant by overwriting the fields of `ELEMENTS.heart` in
 * place. Safe to call repeatedly. Does NOT notify subscribers — call
 * `setHeartVariant` for the user-driven path.
 */
export function applyHeartVariant(id: HeartVariantId): void {
  const def = HEART_VARIANTS[id];
  const target = ELEMENTS.heart;
  // Mutate fields in place — keep the same object reference so any
  // module that captured `ELEMENTS.heart` sees the new values.
  target.name = def.identity.name;
  target.domain = def.identity.domain;
  target.ethos = def.identity.ethos;
  target.glyph = def.identity.glyph;
  target.emoji = def.identity.emoji;
  target.color = def.identity.color;
  target.tint = def.identity.tint;
  target.deep = def.identity.deep;
  target.accent = def.identity.accent;
  target.verbDone = def.identity.verbDone;
}

// ── Subscription bus ────────────────────────────────────────────────
// Tiny pub/sub so a single `setHeartVariant` call from a settings panel
// can trigger a re-render at the App.tsx level (which re-keys the shell).
type Listener = (id: HeartVariantId) => void;
const listeners = new Set<Listener>();

export function subscribeHeartVariant(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * User-driven setter. Persists, applies, and broadcasts.
 */
export function setHeartVariant(id: HeartVariantId): void {
  store.set(STORAGE_KEY, id);
  applyHeartVariant(id);
  for (const fn of listeners) {
    fn(id);
  }
}

/**
 * Boot-time hook. Call AFTER `hydratePersistence()` so the persisted
 * value is in the synchronous store before we read it.
 */
export function bootstrapHeartVariant(): void {
  applyHeartVariant(getHeartVariant());
}
