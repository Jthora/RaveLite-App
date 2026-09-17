/**
 * Hot days — pure. Water calls come hourly while the heat is on, and the
 * Drink target rises: +2 glasses in the caution band, +4 in danger.
 *
 * The extra calls are plan windows added for the day (`heat-water`), one
 * minute long, halfway between the plan's own water calls. Being plan
 * chimes, they ride along with rounds, get OS backups and show on Today
 * like any other water call.
 */
import type {Plan, Window} from '../reminders/types';
import type {HeatLevel} from './conditions';

export const HEAT_WATER_WINDOW_ID = 'heat-water';

const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
};

function atLocalTime(day: Date, time: string): number {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/**
 * `plan` with an extra water call halfway between its own in each hot
 * hour, for `days` days from `fromTs`'s day. Returns `plan` itself when no
 * hour is hot.
 */
export function withHeatWaterCalls(
  plan: Plan,
  heatAt: (ts: number) => HeatLevel,
  fromTs: number,
  days: number = 2,
): Plan {
  const extra: Window[] = [];
  const first = new Date(fromTs);
  first.setHours(0, 0, 0, 0);
  for (let d = 0; d < days; d++) {
    const day = new Date(first);
    day.setDate(first.getDate() + d);
    const dow = day.getDay();
    for (const window of plan.windows) {
      if (!window.daysOfWeek.includes(dow)) {
        continue;
      }
      for (const slot of window.slots) {
        const hydration = slot.requiredTags?.includes('Hydration') ?? false;
        if (!hydration || slot.everyMinutes < 90) {
          continue;
        }
        const step = slot.everyMinutes * 60_000;
        const end = atLocalTime(day, window.endTime);
        for (
          let t = atLocalTime(day, window.startTime) + step / 2;
          t < end;
          t += step
        ) {
          if (heatAt(t) === 'none') {
            continue;
          }
          extra.push({
            id: HEAT_WATER_WINDOW_ID,
            label: 'Hot day: extra water',
            startTime: hhmm(t),
            endTime: hhmm(t + 60_000),
            daysOfWeek: [dow],
            slots: [{...slot, everyMinutes: 1}],
          });
        }
      }
    }
  }
  return extra.length > 0
    ? {...plan, windows: [...plan.windows, ...extra]}
    : plan;
}

/** The Drink target on a day whose hottest hour reaches `heat`. */
/** Glasses the heat adds at its worst: two in caution, four in danger. */
export function heatGlasses(heat: HeatLevel): number {
  return heat === 'danger' ? 4 : heat === 'caution' ? 2 : 0;
}

/** A glass for every this many minutes spent out in the heat. */
export const MINUTES_PER_HEAT_GLASS = 20;

/**
 * The day's glasses. A hot forecast only costs water if you are in it:
 * with air conditioning the heat adds a glass for each 20 minutes spent
 * outside, up to its own maximum. Without it, the heat is the whole day
 * and the maximum applies from the start.
 */
export function drinkTarget(
  base: number,
  heat: HeatLevel,
  outside: {airConditioned: boolean; outdoorMinutes: number} = {
    airConditioned: false,
    outdoorMinutes: 0,
  },
): number {
  const most = heatGlasses(heat);
  if (!outside.airConditioned) {
    return base + most;
  }
  const earned = Math.floor(outside.outdoorMinutes / MINUTES_PER_HEAT_GLASS);
  return base + Math.min(most, earned);
}
