import {DEFAULT_ACTIVE_HOURS, type ActiveHours} from '../ambient/types';
import {Plan, type Window} from './types';

/**
 * Default reminder plan — factory settings, built around My day.
 *
 * Its backbone is the Daily Sets program: rounds of strength moves across
 * My day, each followed by a short partner drill from another element.
 * Posture, breath and presence ride along with those rounds, so the plan
 * carries only what rounds can't. Every time is set from when My day
 * starts or ends, so moving the day moves them all:
 *
 *   Water calls (from 30 min after the start to 1 h before the end):
 *     Water every 2 h, starting on waking. A call within 20 min of a
 *     round rides along with it instead of chiming alone. Every water call
 *     also asks for a 20 s eye break (Air).
 *
 *   Morning intent (5 min after the start):
 *     Heart 1× — name the day's leading element before anything else
 *
 *   Morning session (45 min to 2 h after the start) — the day's morning
 *   block from the focus wheel (`program/week.ts`): a piece every 25 min.
 *
 *   Evening Review (15 min before the end):
 *     Heart 1× — a still sit, then the review
 *
 *   Meal check-ins (opt-in; before lunch and dinner):
 *     Heart 1× — a question about the meal, never a prescription. Off by
 *     default: counting meals is not safe for everyone. Phones set up
 *     before this kept theirs, because their plan was stored.
 *
 * For the default My day (05:00–21:00) that is 05:05, 05:30, 05:45, 11:55,
 * 19:05 and 20:45 — the times this plan always had. A day that runs past
 * midnight splits a window that would cross it in two, because plan
 * windows cannot (`expandPlan.ts`).
 *
 * Keep this file the single source of "factory settings". A persisted plan
 * is only replaced by a storage migration (which keeps the old one as a
 * backup, or moves an untouched default), by Plan → Reset to default, or
 * by moving My day while the plan is still the default for the old day
 * (`moveMyDay`).
 */

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const DAY = 24 * 60;

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function hhmm(minutes: number): string {
  const t = ((minutes % DAY) + DAY) % DAY;
  const h = String(Math.floor(t / 60)).padStart(2, '0');
  const m = String(t % 60).padStart(2, '0');
  return `${h}:${m}`;
}

const round5 = (n: number) => Math.round(n / 5) * 5;

type WindowBase = Omit<Window, 'startTime' | 'endTime'>;

/**
 * A window with its keys in the order the stored default always had.
 * Plans are compared as JSON (`plansEqual`), so an untouched default is
 * only recognised if it is written the same way.
 */
function windowOf(
  base: WindowBase,
  startTime: string,
  endTime: string,
): Window {
  return {
    id: base.id,
    label: base.label,
    startTime,
    endTime,
    daysOfWeek: base.daysOfWeek,
    slots: base.slots,
  };
}

/**
 * A window from `from` to `to` minutes after midnight of the day it
 * starts on, split at midnight when it crosses it.
 */
function span(base: WindowBase, from: number, to: number): Window[] {
  const start = ((from % DAY) + DAY) % DAY;
  const length = to - from;
  if (start + length <= DAY - 1) {
    return [windowOf(base, hhmm(start), hhmm(start + length))];
  }
  return [
    windowOf(base, hhmm(start), '23:59'),
    windowOf(
      {...base, id: `${base.id}-after-midnight`},
      '00:00',
      hhmm(start + length - DAY),
    ),
  ];
}

/** A one-minute window: one chime at `at`. */
function once(base: WindowBase, at: number): Window {
  const t = Math.min(((at % DAY) + DAY) % DAY, DAY - 2);
  return windowOf(base, hhmm(t), hhmm(t + 1));
}

/** The default plan for a My day, with meal check-ins if asked for. */
export function planForDay(
  hours: Pick<ActiveHours, 'start' | 'end'>,
  opts: {meals?: boolean} = {},
): Plan {
  const start = minutesOf(hours.start);
  const length = (minutesOf(hours.end) - start + DAY) % DAY || DAY;
  const end = start + length;
  const windows: Window[] = [
    ...span(
      {
        id: 'hydration',
        label: 'Water Calls',
        daysOfWeek: ALL_DAYS,
        slots: [
          {
            element: 'water',
            everyMinutes: 120,
            maxSeconds: 60,
            requiredTags: ['Hydration'],
          },
        ],
      },
      start + 30,
      end - 60,
    ),
    once(
      {
        id: 'morning-intent',
        label: 'Morning Intent',
        daysOfWeek: ALL_DAYS,
        slots: [
          {
            element: 'heart',
            everyMinutes: 1,
            exerciseId: 'heart.morning-intent',
          },
        ],
      },
      start + 5,
    ),
    // Id kept from the evening "Backyard Session" so migrations and
    // stored pulse ids line up.
    ...span(
      {
        id: 'backyard-session',
        label: 'Morning Session',
        daysOfWeek: ALL_DAYS,
        slots: [{element: 'fire', everyMinutes: 25, block: 'morning'}],
      },
      start + 45,
      start + 120,
    ).slice(0, 1),
  ];
  if (opts.meals) {
    windows.push(
      once(
        {
          id: 'fuel-lunch',
          label: 'Fuel Check — Lunch',
          daysOfWeek: ALL_DAYS,
          slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
        },
        start + round5((length * 415) / 960),
      ),
      once(
        {
          id: 'fuel-dinner',
          label: 'Fuel Check — Dinner',
          daysOfWeek: ALL_DAYS,
          slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
        },
        end - round5((length * 115) / 960),
      ),
    );
  }
  windows.push(
    once(
      {
        id: 'evening-close',
        label: 'Evening Review',
        daysOfWeek: ALL_DAYS,
        slots: [
          {
            element: 'heart',
            everyMinutes: 1,
            exerciseId: 'heart.evening-review',
          },
        ],
      },
      end - 15,
    ),
  );
  return {id: 'default', name: 'Operator Baseline', windows};
}

export const DEFAULT_PLAN: Plan = planForDay(DEFAULT_ACTIVE_HOURS);

/** Whether a plan has the meal check-ins in it. */
export function hasMealChecks(plan: Plan): boolean {
  return plan.windows.some(
    w => w.id === 'fuel-lunch' || w.id === 'fuel-dinner',
  );
}
