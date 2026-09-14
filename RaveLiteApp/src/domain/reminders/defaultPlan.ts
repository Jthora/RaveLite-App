import {Plan} from './types';

/**
 * Default reminder plan — the operator's factory settings.
 *
 * Kit: bodyweight, a mat right behind the desk, a big backyard, a porch
 * edge to hang from, and bricks. No pool, no weights.
 *
 * The day's backbone is the Daily Sets program: about nine rounds of
 * strength moves, each followed by a short partner drill from another
 * element (a chest opener, a hip opener, a breath). Posture, breath and
 * presence ride along with those rounds, so the plan no longer chimes for
 * them on its own. The plan carries only what rounds can't:
 *
 *   Water calls (daily 09:20-21:00):
 *     Water every 90 min — drink a glass. 8 calls ≈ 2 L. A call within
 *     20 min of a round rides along with it instead of chiming alone.
 *
 *   Backyard session (daily 17:30-19:00) — explosive + skill work that
 *   needs a warm-up and fresh legs, so it never rides a desk chime:
 *     Fire every 45 min  — strides, jump squats, kick-flip foundations
 *     Water every 40 min — beat-step, staff combat, flow
 *
 *   Fuel checks (11:55 and 19:05 daily):
 *     Heart 1× — hand-portion plate check before lunch and dinner
 *
 *   Evening (21:30):
 *     Heart 1× — Evening Review
 *
 * Everything sits inside the default My day (09:00-22:00); a weekday comes
 * to roughly twenty chimes.
 *
 * Keep this file the single source of "factory settings". A persisted plan
 * is only replaced by a storage migration (which keeps the old one as a
 * backup) or by Plan → Reset to default.
 */

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const DEFAULT_PLAN: Plan = {
  id: 'default',
  name: 'Operator Baseline',
  windows: [
    {
      id: 'hydration',
      label: 'Water Calls',
      startTime: '09:20',
      endTime: '21:00',
      daysOfWeek: ALL_DAYS,
      slots: [
        {
          element: 'water',
          everyMinutes: 90,
          maxSeconds: 60,
          requiredTags: ['Hydration'],
        },
      ],
    },
    {
      id: 'backyard-session',
      label: 'Backyard Session',
      startTime: '17:30',
      endTime: '19:00',
      daysOfWeek: ALL_DAYS,
      slots: [
        {element: 'fire', everyMinutes: 45, requiredTags: ['Agility']},
        {element: 'water', everyMinutes: 40, requiredTags: ['Flow']},
      ],
    },
    {
      id: 'fuel-lunch',
      label: 'Fuel Check — Lunch',
      startTime: '11:55',
      endTime: '11:56',
      daysOfWeek: ALL_DAYS,
      slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
    },
    {
      id: 'fuel-dinner',
      label: 'Fuel Check — Dinner',
      startTime: '19:05',
      endTime: '19:06',
      daysOfWeek: ALL_DAYS,
      slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
    },
    {
      id: 'evening-close',
      label: 'Evening Review',
      startTime: '21:30',
      endTime: '21:31',
      daysOfWeek: ALL_DAYS,
      slots: [{element: 'heart', everyMinutes: 1, maxSeconds: 200}],
    },
  ],
};
