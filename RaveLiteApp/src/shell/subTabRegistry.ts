/**
 * Sub-tab registry — single source of truth for what sub-pages each
 * element offers, in what order, with what icon and label.
 *
 * The shell reads this to render the SubTabRail. Element screens read
 * their slug list to type-check their own switch statement.
 *
 * Heart is fully built out. Fire/Air/Earth/Water share a 5-slot shape
 * (now/drills/log/stats/tune) as placeholders until step 4 fleshes
 * them out per element.
 */
import {
  Activity,
  BarChart3,
  CalendarClock,
  Dumbbell,
  Gauge,
  GitBranch,
  History,
  ListChecks,
  Radio,
  Repeat,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react-native';

import type {ElementId} from '../theme/elements';
import type {SubTab} from '../components/SubTabStrip';

// ---- Heart sub-tabs -------------------------------------------------------

export type HeartSubSlug =
  | 'dash'
  | 'sets'
  | 'plan'
  | 'circuits'
  | 'always-on'
  | 'insights'
  | 'settings';

const HEART_SUB_TABS: ReadonlyArray<SubTab<HeartSubSlug>> = [
  {slug: 'dash', label: 'Dash', Icon: Gauge},
  {slug: 'sets', label: 'Sets', Icon: Repeat},
  {slug: 'plan', label: 'Plan', Icon: CalendarClock},
  {slug: 'circuits', label: 'Circuits', Icon: GitBranch},
  {slug: 'always-on', label: 'Always-On', Icon: Radio},
  {slug: 'insights', label: 'Insights', Icon: Sparkles},
  {slug: 'settings', label: 'Settings', Icon: Settings},
];

// ---- Shared element sub-tabs (Fire/Air/Earth/Water) -----------------------

export type ElementSubSlug = 'now' | 'drills' | 'log' | 'stats' | 'tune' | 'train';

// All four non-Heart elements share the same six-slot shape, with a
// 'Train' tab between Drills and Log for manual numerical entries
// (runs, holds, reps). Per-element catalogs (see
// `domain/training/builtinMetrics.ts`) decide what shows up inside.
const WITH_TRAIN_SUB_TABS: ReadonlyArray<SubTab<ElementSubSlug>> = [
  {slug: 'now', label: 'Now', Icon: Activity},
  {slug: 'drills', label: 'Drills', Icon: ListChecks},
  {slug: 'train', label: 'Train', Icon: Dumbbell},
  {slug: 'log', label: 'Log', Icon: History},
  {slug: 'stats', label: 'Stats', Icon: BarChart3},
  {slug: 'tune', label: 'Tune', Icon: SlidersHorizontal},
];

// ---- Registry -------------------------------------------------------------

export const SUB_TABS_BY_ELEMENT: Record<
  ElementId,
  ReadonlyArray<SubTab<string>>
> = {
  fire: WITH_TRAIN_SUB_TABS,
  air: WITH_TRAIN_SUB_TABS,
  earth: WITH_TRAIN_SUB_TABS,
  water: WITH_TRAIN_SUB_TABS,
  heart: HEART_SUB_TABS,
};

/** First slug for each element — what we land on when the element is
 *  first opened (and what we fall back to if a stored slug is invalid). */
export const DEFAULT_SUB_SLUG: Record<ElementId, string> = {
  fire: 'now',
  air: 'now',
  earth: 'now',
  water: 'now',
  heart: 'dash',
};
