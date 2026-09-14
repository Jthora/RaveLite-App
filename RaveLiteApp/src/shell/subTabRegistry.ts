/**
 * Sub-tab registry — single source of truth for what sub-pages each
 * element offers, in what order, with what icon and label.
 *
 * The shell reads this to render the SubTabRail. Element screens read
 * their slug list to type-check their own switch statement.
 *
 * Heart is home: Today (the day at a glance and the chime to answer),
 * Progress (Daily Sets and the week), Setup (My day, chimes, plan, look).
 * Fire, Air, Earth and Water: Drills (a drill to try now and the library),
 * Train (sessions typed in by hand), History (everything done, by day).
 */
import {
  Dumbbell,
  History,
  ListChecks,
  Settings,
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

export type ElementSubSlug = 'drills' | 'train' | 'history';

const ELEMENT_SUB_TABS: ReadonlyArray<SubTab<ElementSubSlug>> = [
  {slug: 'drills', label: 'Drills', Icon: ListChecks},
  {slug: 'train', label: 'Train', Icon: Dumbbell},
  {slug: 'history', label: 'History', Icon: History},
];

// ---- Registry -------------------------------------------------------------

export const SUB_TABS_BY_ELEMENT: Record<
  ElementId,
  ReadonlyArray<SubTab<string>>
> = {
  fire: ELEMENT_SUB_TABS,
  air: ELEMENT_SUB_TABS,
  earth: ELEMENT_SUB_TABS,
  water: ELEMENT_SUB_TABS,
  heart: HEART_SUB_TABS,
};

/** First slug for each element — what we land on when the element is
 *  first opened (and what we fall back to if a stored slug is invalid). */
export const DEFAULT_SUB_SLUG: Record<ElementId, string> = {
  fire: 'drills',
  air: 'drills',
  earth: 'drills',
  water: 'drills',
  heart: 'today',
};
