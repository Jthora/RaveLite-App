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
  BellRing,
  CalendarClock,
  Dumbbell,
  Gauge,
  GitBranch,
  History,
  ListChecks,
  Palette,
  Radio,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react-native';

import type {ElementId} from '../theme/elements';
import type {SubTab} from '../components/SubTabStrip';

// ---- Heart sub-tabs -------------------------------------------------------

export type HeartSubSlug =
  | 'dash'
  | 'plan'
  | 'circuits'
  | 'signal'
  | 'aos'
  | 'insights'
  | 'theme';

const HEART_SUB_TABS: ReadonlyArray<SubTab<HeartSubSlug>> = [
  {slug: 'dash', label: 'Dash', Icon: Gauge},
  {slug: 'plan', label: 'Plan', Icon: CalendarClock},
  {slug: 'circuits', label: 'Circuits', Icon: GitBranch},
  {slug: 'signal', label: 'Signal', Icon: BellRing},
  {slug: 'aos', label: 'Always-On', Icon: Radio},
  {slug: 'insights', label: 'Insights', Icon: Sparkles},
  {slug: 'theme', label: 'Theme', Icon: Palette},
];

// ---- Shared element sub-tabs (Fire/Air/Earth/Water) -----------------------

export type ElementSubSlug = 'now' | 'drills' | 'log' | 'stats' | 'tune' | 'train';

const SHARED_ELEMENT_SUB_TABS: ReadonlyArray<SubTab<ElementSubSlug>> = [
  {slug: 'now', label: 'Now', Icon: Activity},
  {slug: 'drills', label: 'Drills', Icon: ListChecks},
  {slug: 'log', label: 'Log', Icon: History},
  {slug: 'stats', label: 'Stats', Icon: BarChart3},
  {slug: 'tune', label: 'Tune', Icon: SlidersHorizontal},
];

// Fire gets an extra 'Train' tab — manual numerical workout log
// (runs, pushups, plank). Lives alongside the journal-driven 'Log'.
const FIRE_SUB_TABS: ReadonlyArray<SubTab<ElementSubSlug>> = [
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
  fire: FIRE_SUB_TABS,
  air: SHARED_ELEMENT_SUB_TABS,
  earth: SHARED_ELEMENT_SUB_TABS,
  water: SHARED_ELEMENT_SUB_TABS,
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
