/**
 * Symbol — a named thing, drawn and coloured in one decision.
 *
 * The home page has had pictograms since early on: every drill shows what
 * it is, tinted by its element. Everything built since — day shapes,
 * modes, packs, archetypes, kit, the data panel — went out as rows of
 * grey text, which is what a screen looks like when nobody decided.
 *
 * The rule this fixes is that a symbol and its colour are **one** choice,
 * not two. `<Symbol name="travelling" />` is always the same suitcase in
 * the same blue, on every screen it appears on, so the picture starts
 * meaning something instead of decorating something.
 *
 * Icons come from Lucide (ISC), which ships 1700 of them and is already a
 * dependency — hand-drawing fifty would have been slower and worse. The
 * element glyphs and move pictograms stay hand-drawn, because those are
 * the app's own alphabet and no library has them.
 */
import React, {memo} from 'react';
import {
  Armchair,
  Award,
  Backpack,
  Bandage,
  BookOpen,
  BrickWall,
  Briefcase,
  CalendarDays,
  Compass,
  Download,
  Droplet,
  Dumbbell,
  Flame,
  Flower,
  Footprints,
  GraduationCap,
  Hammer,
  Hand,
  Heart,
  House,
  Layers,
  Lightbulb,
  Medal,
  Moon,
  Mountain,
  Music,
  Package,
  PersonStanding,
  Plane,
  Rocket,
  Ruler,
  Shield,
  Ship,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Swords,
  Target,
  Tent,
  Timer,
  TreeDeciduous,
  Trash2,
  TriangleAlert,
  Upload,
  Volume2,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

import {hues, type HueName} from '../../theme/hues';

/** Everything the app can name and draw. */
const SYMBOLS = {
  // Day shapes
  desk: [Armchair, 'desk'],
  office: [Briefcase, 'office'],
  shift: [Footprints, 'shift'],
  weekend: [CalendarDays, 'weekend'],

  // Modes
  travelling: [Plane, 'travel'],
  injured: [Bandage, 'injury'],
  festival: [Tent, 'festival'],
  resting: [Moon, 'rest'],

  // Packs and disciplines
  dance: [Music, 'dance'],
  martial: [Hand, 'martial'],
  staff: [Swords, 'staff'],
  yoga: [Flower, 'yoga'],
  jumps: [Zap, 'jumps'],
  running: [Footprints, 'running'],
  militaryTests: [Medal, 'tests'],

  // Archetypes
  raver: [Music, 'dance'],
  guardian: [Shield, 'martial'],
  monk: [Flower, 'yoga'],
  operator: [Target, 'tests'],
  deskRebel: [Armchair, 'desk'],
  comeback: [Sprout, 'success'],
  flowArtist: [Sparkles, 'staff'],
  nightShift: [Moon, 'rest'],
  parent: [House, 'weekend'],
  festivalSix: [Tent, 'festival'],

  // Starting point
  new: [Sprout, 'success'],
  returning: [TreeDeciduous, 'grass'],
  training: [Dumbbell, 'metal'],

  // Kit
  floor: [Layers, 'stone'],
  mat: [Layers, 'cloth'],
  wall: [BrickWall, 'brick'],
  chair: [Armchair, 'wood'],
  stairs: [Mountain, 'stone'],
  hangPoint: [Hammer, 'metal'],
  bricks: [BrickWall, 'brick'],
  ball: [Droplet, 'rope'],
  yard: [TreeDeciduous, 'grass'],
  streets: [Compass, 'stone'],

  // Data
  export: [Download, 'success'],
  restore: [Upload, 'info'],
  erase: [Trash2, 'danger'],

  // Services
  army: [Shield, 'army'],
  navy: [Ship, 'navy'],
  airForce: [Plane, 'airForce'],
  marines: [Award, 'marines'],
  spaceForce: [Rocket, 'spaceForce'],
  coastGuard: [Ship, 'coastGuard'],

  // Concepts
  idea: [Lightbulb, 'idea'],
  warning: [TriangleAlert, 'warning'],
  learn: [BookOpen, 'info'],
  standard: [GraduationCap, 'tests'],
  measure: [Ruler, 'metal'],
  time: [Timer, 'time'],
  loud: [Volume2, 'warning'],
  quiet: [Moon, 'rest'],
  heart: [Heart, 'danger'],
  sun: [Sun, 'idea'],
  wind: [Wind, 'info'],
  fire: [Flame, 'danger'],
  star: [Star, 'idea'],
  pack: [Package, 'secret'],
  carry: [Backpack, 'cloth'],
  body: [PersonStanding, 'stone'],
} as const satisfies Record<string, readonly [LucideIcon, HueName]>;

export type SymbolName = keyof typeof SYMBOLS;

/** The colour this symbol is always drawn in. */
export function hueOf(name: SymbolName): string {
  return hues[SYMBOLS[name][1]];
}

export const Symbol = memo(function Symbol({
  name,
  size = 18,
  color,
}: {
  name: SymbolName;
  size?: number;
  /** Overrides the symbol's own hue. Use sparingly — it is the hue that
   * makes the symbol mean the same thing twice. */
  color?: string;
}) {
  const [Icon] = SYMBOLS[name];
  return <Icon size={size} color={color ?? hueOf(name)} strokeWidth={2} />;
});
