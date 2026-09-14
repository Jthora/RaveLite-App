import {Plan} from './types';

/**
 * Default reminder plan — opinionated starting point for the operator.
 *
 * Kit: bodyweight, a mat right behind the desk, a big backyard, a porch
 * edge to hang from, and bricks. No pool, no weights.
 *
 * Strength volume (push, row, pull, squat, core, holds, hangs) is NOT in
 * this plan — the Daily Sets program spreads those sets across the day
 * and ramps them week by week. The plan carries everything else:
 *
 *   Desk hours (Mon-Fri 09:00-17:00):
 *     Air every 30 min    — micro posture/breath reset
 *     Heart every 45 min  — pulse check / rave vision (presence, ≤ 60 sec)
 *     Water every 120 min — fascia stretch that fits beside the desk
 *
 *   Water calls (daily 09:20-21:00):
 *     Water every 90 min — drink a glass. 8 calls ≈ 2 L. Starts at :20 so
 *     it never lands on the quarter-hour ticks every other slot uses, and
 *     inside the default active hours so no call is suppressed.
 *
 *   Morning training block (06:00-08:00 daily):
 *     Heart 0:00  — Morning Intent
 *     Air 0:10    — Crocodile / Standing Belly Release
 *     Earth 0:20  — Posterior pelvic tilt + glute bridge work
 *     Fire 0:35   — PFT block (rotating: pushups / situps / run day)
 *     Water 0:55  — Flow segment, full song minimum
 *     Heart 1:55  — Closing presence drill
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
 * The user can edit this from the Heart screen later. Keep this file the
 * single source of "factory settings". A persisted plan is never
 * overwritten — changes here reach a device via Plan → Reset to default.
 */

const WORK_DAYS = [1, 2, 3, 4, 5];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const DEFAULT_PLAN: Plan = {
  id: 'default',
  name: 'Operator Baseline',
  windows: [
    {
      id: 'desk-hours',
      label: 'Desk Hours',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: WORK_DAYS,
      slots: [
        {element: 'air', everyMinutes: 30, maxSeconds: 90, requiredTags: ['NoFloor']},
        {element: 'heart', everyMinutes: 45, maxSeconds: 60, requiredTags: ['Presence', 'NoFloor']},
        {element: 'water', everyMinutes: 120, maxSeconds: 120, requiredTags: ['Mobility']},
      ],
    },
    {
      id: 'hydration',
      label: 'Water Calls',
      startTime: '09:20',
      endTime: '21:00',
      daysOfWeek: ALL_DAYS,
      slots: [
        {element: 'water', everyMinutes: 90, maxSeconds: 60, requiredTags: ['Hydration']},
      ],
    },
    {
      id: 'morning-block',
      label: 'Morning Training',
      startTime: '06:00',
      endTime: '08:00',
      daysOfWeek: ALL_DAYS,
      exclusive: true,
      slots: [
        {element: 'heart', everyMinutes: 120, maxSeconds: 180},
        {element: 'air', everyMinutes: 30},
        {element: 'earth', everyMinutes: 30},
        {element: 'fire', everyMinutes: 60},
        {element: 'water', everyMinutes: 90},
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
