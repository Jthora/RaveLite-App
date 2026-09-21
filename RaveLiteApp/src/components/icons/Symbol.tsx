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
  Anchor,
  Aperture,
  Armchair,
  Award,
  Backpack,
  Bandage,
  BookOpen,
  BrickWall,
  Briefcase,
  Building,
  CalendarDays,
  ChevronsDown,
  Circle,
  CircleDashed,
  CircleDot,
  Compass,
  DoorOpen,
  Download,
  Dumbbell,
  Eye,
  Fan,
  Fence,
  Flag,
  Flame,
  FlipHorizontal2,
  Flower,
  Footprints,
  Globe,
  GraduationCap,
  Hammer,
  Hand,
  Heart,
  House,
  Infinity as InfinityLoop,
  LampDesk,
  Landmark,
  Layers,
  Lightbulb,
  Medal,
  Milk,
  Minimize2,
  Minus,
  Moon,
  Mountain,
  MountainSnow,
  Music,
  Orbit,
  Package,
  PersonStanding,
  Plane,
  Rocket,
  RotateCw,
  Route,
  Ruler,
  Shell,
  Shield,
  Ship,
  Sofa,
  Sparkles,
  Spline,
  Sprout,
  Star,
  Sun,
  Swords,
  Table,
  Target,
  Tent,
  Timer,
  Trash2,
  TreeDeciduous,
  TreePalm,
  Trees,
  TriangleAlert,
  type LucideIcon,
  Upload,
  Volume2,
  Wand,
  WandSparkles,
  Warehouse,
  Weight,
  Wind,
  Zap,
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

  // Kit — one picture and one colour per thing, grouped as the panel is
  floor: [Layers, 'stone'],
  mat: [Layers, 'cloth'],
  grass: [Sprout, 'grass'],
  sand: [Shell, 'cloth'],
  wall: [BrickWall, 'brick'],
  doorway: [DoorOpen, 'wood'],
  chair: [Armchair, 'wood'],
  table: [Table, 'wood'],
  stairs: [Mountain, 'stone'],
  hallway: [Route, 'stone'],
  bench: [Armchair, 'wood'],
  rail: [Fence, 'metal'],
  beam: [Minus, 'wood'],
  mirror: [FlipHorizontal2, 'glass'],
  kerb: [Footprints, 'stone'],
  hill: [MountainSnow, 'grass'],
  hangLow: [Hammer, 'metal'],
  hangHigh: [Hammer, 'metal'],
  frame: [Landmark, 'metal'],
  bricks: [BrickWall, 'brick'],
  jugs: [Milk, 'glass'],
  sandbag: [Weight, 'cloth'],
  ball: [Circle, 'rope'],
  rope: [RotateCw, 'rope'],
  band: [InfinityLoop, 'rope'],
  // Flow toys — the rave's colours, not the hardware shop's
  doubleStaff: [Swords, 'dance'],
  poi: [Orbit, 'dance'],
  hoop: [CircleDashed, 'festival'],
  fans: [Fan, 'festival'],
  wand: [WandSparkles, 'secret'],
  ropeDart: [Anchor, 'rope'],
  contactBall: [Globe, 'glass'],
  buugeng: [Spline, 'secret'],
  dragonStaff: [Aperture, 'staff'],
  flags: [Flag, 'festival'],
  gloves: [Hand, 'secret'],
  juggling: [CircleDot, 'jumps'],
  devilSticks: [Wand, 'wood'],
  yard: [TreeDeciduous, 'grass'],
  streets: [Compass, 'running'],
  park: [Trees, 'grass'],
  stairwell: [Building, 'stone'],

  // Places — what kind of somewhere it is
  roomPlace: [Sofa, 'wood'],
  basement: [Warehouse, 'stone'],
  housePlace: [House, 'wood'],
  deskPlace: [LampDesk, 'desk'],
  porch: [Fence, 'wood'],
  beach: [TreePalm, 'idea'],

  // Limits — things a room takes away
  lowCeiling: [ChevronsDown, 'warning'],
  below: [Volume2, 'warning'],
  watched: [Eye, 'warning'],
  tight: [Minimize2, 'warning'],
  barefoot: [Footprints, 'warning'],

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

  // Settings groups — each its own colour, none of them grey: a grey
  // row on that index reads as switched off.
  you: [PersonStanding, 'jumps'],
  program: [GraduationCap, 'running'],
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
