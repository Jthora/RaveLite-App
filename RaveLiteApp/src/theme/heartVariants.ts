/**
 * Core themes — how the central element presents itself.
 *
 * Two choices, made in Settings › Theme:
 *   - A mark: Core (⊙), Heart (♡), Æther (a six-pointed star in lines),
 *     Star (a five-pointed star in lines) or Commander (the Star Commander
 *     mark). The mark carries the name, glyph and copy.
 *   - A color: one of five that keep clear of the four elements' red,
 *     yellow, green and blue. Until one is chosen, each mark brings its own
 *     (Core orange, Heart magenta, the stars white).
 *
 * How it is applied: we mutate the `ELEMENTS.heart` object at boot (after
 * persistence hydration) and on each choice. Every consumer reads
 * `ELEMENTS.heart.<field>` at render, and App.tsx re-keys the shell when
 * told, so every screen re-mounts with the new look. The picker tells it
 * once, when it closes (`flushHeartTheme`), so trying colors doesn't
 * rebuild the app under the Settings sheet on every tap.
 *
 * The `'heart'` ElementId stays the same whatever the theme: plans,
 * journal entries and storage keys all keep using `'heart'`.
 */
import {ELEMENTS, type ElementIdentity} from './elements';
import {store} from '../storage';
import {KEYS} from '../storage/keys';

export type HeartVariantId = 'core' | 'heart' | 'aether' | 'star' | 'commander';
export type HeartColorId = 'orange' | 'magenta' | 'violet' | 'cyan' | 'white';

/** The order the picker shows them in. */
export const HEART_VARIANT_ORDER: readonly HeartVariantId[] = [
  'core',
  'heart',
  'aether',
  'star',
  'commander',
];
export const HEART_COLOR_ORDER: readonly HeartColorId[] = [
  'orange',
  'magenta',
  'violet',
  'cyan',
  'white',
];

export interface HeartColorDef {
  id: HeartColorId;
  name: string;
  color: string;
  /** The color at 0.12 alpha, for backgrounds. */
  tint: string;
  /** A deep shade for borders and pressed states. */
  deep: string;
}

/**
 * Hues well away from Fire (red), Air (yellow), Earth (green) and Water
 * (blue): orange sits between red and yellow, cyan between green and blue,
 * violet and magenta past blue toward red, and white has no hue at all.
 */
export const HEART_COLORS: Record<HeartColorId, HeartColorDef> = {
  orange: {
    id: 'orange',
    name: 'Orange',
    color: '#FF9F0A',
    tint: '#FF9F0A1F',
    deep: '#B86F00',
  },
  magenta: {
    id: 'magenta',
    name: 'Magenta',
    color: '#FF2D9D',
    tint: '#FF2D9D1F',
    deep: '#B0186E',
  },
  violet: {
    id: 'violet',
    name: 'Violet',
    color: '#BF5AF2',
    tint: '#BF5AF21F',
    deep: '#7A2FA3',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyan',
    color: '#2EE6D6',
    tint: '#2EE6D61F',
    deep: '#138C82',
  },
  white: {
    id: 'white',
    name: 'White',
    color: '#F5F7FA',
    tint: '#F5F7FA1F',
    deep: '#5C6475',
  },
};

export interface HeartVariantDef {
  id: HeartVariantId;
  /** Identity overrides applied to ELEMENTS.heart; the color comes separately. */
  identity: Omit<ElementIdentity, 'id' | 'color' | 'tint' | 'deep'>;
  /** The color this mark wears until the operator picks one. */
  defaultColor: HeartColorId;
  /** One line for the picker. */
  description: string;
}

/**
 * Geometric / abstract symbols only. No cultural or religious glyphs.
 *  ⊙  U+2299  CIRCLED DOT OPERATOR    — circle with a point in the center
 *  ♡  U+2661  WHITE HEART SUIT        — outline heart, geometric
 *  ✶  U+2736  SIX POINTED BLACK STAR  — Æther's text fallback
 *  ☆  U+2606  WHITE STAR              — Star's text fallback
 *  ★  U+2605  BLACK STAR              — Commander's text fallback
 *
 * Æther, Star and Commander draw their mark as SVG (`icon`); the Unicode
 * glyph stays for plain text such as notification titles.
 */
export const HEART_VARIANTS: Record<HeartVariantId, HeartVariantDef> = {
  core: {
    id: 'core',
    defaultColor: 'orange',
    description: 'Circled point — the center, the geometric hub.',
    identity: {
      name: 'Core',
      domain: 'Center & Cadence',
      ethos:
        'The center point. Schedule, reminders, presence. The hub the four orbit; the still place the rave departs from and returns to.',
      glyph: '⊙', // ⊙
      emoji: '◉',
      accent: '#C6FF00',
      verbDone: 'Center',
    },
  },
  heart: {
    id: 'heart',
    defaultColor: 'magenta',
    description: 'Heart — the integrator, where the four meet.',
    identity: {
      name: 'Heart',
      domain: 'Integration & Cadence',
      ethos:
        'The conductor. Schedule, reminders, streaks, presence. Where the four meet and the rave begins.',
      glyph: '♡', // ♡
      emoji: '♦',
      accent: '#C6FF00',
      verbDone: 'Seal',
    },
  },
  aether: {
    id: 'aether',
    defaultColor: 'white',
    description:
      'Six-pointed star in lines — the quintessence, the fifth that holds the four.',
    identity: {
      name: 'Æther',
      domain: 'Spirit & Cadence',
      ethos:
        'The quintessence. Schedule, reminders, presence. The fifth that holds the four; the still light the rave rises from.',
      glyph: '✶', // ✶
      icon: 'star6',
      emoji: '✶',
      accent: '#C6FF00',
      verbDone: 'Still',
    },
  },
  star: {
    id: 'star',
    defaultColor: 'white',
    description:
      'Five-pointed star in lines — a fixed point to steer the day by.',
    identity: {
      name: 'Star',
      domain: 'Aim & Cadence',
      ethos:
        'The guiding star. Schedule, reminders, presence. The fixed point the day steers by.',
      glyph: '☆', // ☆
      icon: 'star5',
      emoji: '☆',
      accent: '#C6FF00',
      verbDone: 'Shine',
    },
  },
  commander: {
    id: 'commander',
    defaultColor: 'white',
    description:
      'Star Commander — the star with two chevrons: rank earned one set at a time.',
    identity: {
      name: 'Commander',
      domain: 'Command & Cadence',
      ethos:
        'Star Commander. Schedule, reminders, presence. The call answered, the rank earned one set at a time.',
      glyph: '★', // ★
      icon: 'commander',
      emoji: '★',
      accent: '#C6FF00',
      verbDone: 'Command',
    },
  },
};

const VARIANT_KEY = KEYS.setting('heart.variant');
const COLOR_KEY = KEYS.setting('heart.color');

/** The saved mark; `'heart'` when none (or an unknown one) is saved. */
export function getHeartVariant(): HeartVariantId {
  const raw = store.getString(VARIANT_KEY);
  return raw !== undefined && raw in HEART_VARIANTS
    ? (raw as HeartVariantId)
    : 'heart';
}

/** The saved color, or the mark's own until one is chosen. */
export function getHeartColor(): HeartColorId {
  const raw = store.getString(COLOR_KEY);
  return raw !== undefined && raw in HEART_COLORS
    ? (raw as HeartColorId)
    : HEART_VARIANTS[getHeartVariant()].defaultColor;
}

/**
 * Overwrite the fields of `ELEMENTS.heart` in place with a mark and a
 * color. Safe to call repeatedly. Does not notify subscribers.
 */
export function applyHeartVariant(
  id: HeartVariantId,
  colorId: HeartColorId = getHeartColor(),
): void {
  const {identity} = HEART_VARIANTS[id];
  const color = HEART_COLORS[colorId];
  // Keep the same object so any module holding `ELEMENTS.heart` sees it.
  const target = ELEMENTS.heart;
  target.name = identity.name;
  target.domain = identity.domain;
  target.ethos = identity.ethos;
  target.glyph = identity.glyph;
  target.icon = identity.icon;
  target.emoji = identity.emoji;
  target.accent = identity.accent;
  target.verbDone = identity.verbDone;
  target.color = color.color;
  target.tint = color.tint;
  target.deep = color.deep;
}

// ── Redraw bus ──────────────────────────────────────────────────────
// App.tsx re-keys the shell when a theme change is flushed.
type Listener = (id: HeartVariantId) => void;
const listeners = new Set<Listener>();
let pending = false;

export function subscribeHeartVariant(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Save and apply a mark. The app redraws on the next `flushHeartTheme`. */
export function setHeartVariant(id: HeartVariantId): void {
  store.set(VARIANT_KEY, id);
  applyHeartVariant(id);
  pending = true;
}

/** Save and apply a color. The app redraws on the next `flushHeartTheme`. */
export function setHeartColor(id: HeartColorId): void {
  store.set(COLOR_KEY, id);
  applyHeartVariant(getHeartVariant(), id);
  pending = true;
}

/** Tell the app to redraw with the theme chosen since the last flush. */
export function flushHeartTheme(): void {
  if (!pending) {
    return;
  }
  pending = false;
  const id = getHeartVariant();
  for (const fn of listeners) {
    fn(id);
  }
}

/**
 * Boot-time hook. Call AFTER `hydratePersistence()` so the saved choices
 * are in the synchronous store before we read them.
 */
export function bootstrapHeartVariant(): void {
  applyHeartVariant(getHeartVariant());
}
