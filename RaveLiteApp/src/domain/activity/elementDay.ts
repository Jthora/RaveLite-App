/**
 * An element's own view of activity, for its page: the 14-day ribbon, the
 * stat line under its name, and one day's log.
 *
 * Counts everywhere credit a Train entry to one element (`trainElement`).
 * The page also lists older Train entries whose kind is `'any'` and that
 * name no element: the Train tab used to show those on every element, and
 * without this a custom kind would only surface on Heart. They still count
 * once, where `trainElement` puts them.
 */
import type {ElementId} from '../../theme/elements';
import {getMetric, loadEntries} from '../training/repository';
import type {MetricKind, TrainingLogEntry} from '../training/types';
import {activityInRange, buildActivity, type ActivityItem} from './activity';
import {DAILY_PAR} from './par';

const MS_PER_DAY = 86_400_000;

export interface RibbonDay {
  /** Local midnight. */
  dayStart: number;
  /** Effort points that day. */
  points: number;
  /** A Train entry was logged that day. */
  hasTrain: boolean;
  isToday: boolean;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Pure: `days` days ending today, oldest first, from that window's items. */
export function buildDayRibbon({
  items,
  days,
  now,
}: {
  items: readonly ActivityItem[];
  days: number;
  now: Date;
}): RibbonDay[] {
  const out: RibbonDay[] = [];
  for (let back = days - 1; back >= 0; back--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - back);
    out.push({
      dayStart: d.getTime(),
      points: 0,
      hasTrain: false,
      isToday: back === 0,
    });
  }
  const first = out[0]?.dayStart ?? 0;
  for (const item of items) {
    // Round so a 23 or 25 hour DST day still lands on its own index.
    const day = out[Math.round((startOfDay(item.at) - first) / MS_PER_DAY)];
    if (!day) {
      continue;
    }
    day.points += item.points;
    day.hasTrain = day.hasTrain || item.source === 'train';
  }
  return out;
}

/** "14/20 today · 62 this week · 4-day streak": effort points against par; the week is the last 7 days. */
export function elementStatLine({
  today,
  week,
  streak,
  par = DAILY_PAR,
}: {
  today: number;
  week: number;
  streak: number;
  par?: number;
}): string {
  const parts = [`${today}/${par} today`, `${week} this week`];
  if (streak > 0) {
    parts.push(`${streak}-day streak`);
  }
  return parts.join(' · ');
}

/** Pure: what an element's page lists, from a window's activity and Train log. */
export function itemsForElement({
  items,
  train,
  element,
  metricFor = getMetric,
}: {
  items: readonly ActivityItem[];
  /** Train entries in the same window. */
  train: readonly TrainingLogEntry[];
  element: ElementId;
  metricFor?: (kindId: string) => MetricKind | undefined;
}): ActivityItem[] {
  const own = items.filter(i => i.element === element);
  const shared = buildActivity({
    journal: [],
    train: train.filter(
      e => !e.element && metricFor(e.kindId)?.element === 'any',
    ),
    metricFor,
  })
    .filter(i => i.element !== element)
    .map(i => ({...i, element}));
  return [...own, ...shared].sort((a, b) => a.at - b.at);
}

/** An element page's items across an inclusive range of local days. */
export function elementActivityInRange(
  fromDay: Date,
  toDay: Date,
  element: ElementId,
): ActivityItem[] {
  const from = startOfDay(fromDay.getTime());
  const to = startOfDay(toDay.getTime()) + MS_PER_DAY - 1;
  return itemsForElement({
    items: activityInRange(fromDay, toDay),
    train: loadEntries().filter(e => e.at >= from && e.at <= to),
    element,
  });
}

/** An element page's items for one local day. */
export function elementDayItems(
  date: Date,
  element: ElementId,
): ActivityItem[] {
  return elementActivityInRange(date, date, element);
}
