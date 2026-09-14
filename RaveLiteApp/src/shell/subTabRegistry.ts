/**
 * Sub-tab registry — single source of truth for what sub-pages each
 * element offers, in what order, with what icon and label.
 *
 * The shell reads this to render the SubTabRail. Element screens read
 * their slug list to type-check their own switch statement.
 *
 * Heart is home: Today (the day at a glance and the chime to answer),
 * Progress (Daily Sets and the week), Setup (My day, chimes, plan, look).
 */
import {
  Activity,
  BarChart3,
  Dumbbell,
  History,
  ListChecks,
  Settings,
  SlidersHorizontal,
  Sun,
  TrendingUp,
} from 'lucide-react-native';

import type {ElementId} from '../theme/elements';
import type {SubTab} from '../components/SubTabStrip';

// ---- Heart sub-tabs -------------------------------------------------------

export const HEART_SLUGS = ['today', 'progress', 'setup'] as const;
export type HeartSubSlug = (typeof HEART_SLUGS)[number];

const HEART_SUB_TABS: ReadonlyArray<SubTab<HeartSubSlug>> = [
  {slug: 'today', label: 'Today', Icon: Sun},
  {slug: 'progress', label: 'Progress', Icon: TrendingUp},
  {slug: 'setup', label: 'Setup', Icon: Settings},
];

export function isHeartSlug(slug: string): slug is HeartSubSlug {
  return (HEART_SLUGS as readonly string[]).includes(slug);
}

// ---- Shared element sub-tabs (Fire/Air/Earth/Water) -----------------------

export type ElementSubSlug =
  | 'now'
  | 'drills'
  | 'log'
  | 'stats'
  | 'tune'
  | 'train';

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
  heart: 'today',
};
