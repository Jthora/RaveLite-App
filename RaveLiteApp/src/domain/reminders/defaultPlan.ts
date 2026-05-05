import {Plan} from './types';

/**
 * Default reminder plan — opinionated starting point for the operator.
 *
 *   Desk hours (Mon-Fri 09:00-17:00):
 *     Air every 30 min   — micro posture/breath reset
 *     Heart every 45 min — pulse check (UCS+Hourglass+presence in 30 sec)
 *     Earth every 60 min — pelvic-tilt + glute reset
 *     Fire every 90 min  — short capacity burst (wall pushups etc.)
 *     Water every 120 min — 1 min staff figure-8 if space allows
 *
 *   Morning training block (06:00-08:00 daily):
 *     Heart 0:00  — Morning Intent
 *     Air 0:10    — Crocodile / Standing Belly Release
 *     Earth 0:20  — Posterior pelvic tilt + glute bridge work
 *     Fire 0:35   — PFT block (rotating: pushups / situps / run day)
 *     Water 0:55  — Flow segment, full song minimum
 *     Heart 1:55  — Closing presence drill
 *
 *   Evening (21:30):
 *     Heart 1× — Evening Review
 *
 * The user can edit this from the Heart screen later. Keep this file the
 * single source of "factory settings".
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
        {element: 'heart', everyMinutes: 45, maxSeconds: 60, requiredTags: ['NoFloor']},
        {element: 'earth', everyMinutes: 60, maxSeconds: 120, requiredTags: ['NoFloor']},
        {element: 'fire', everyMinutes: 90, maxSeconds: 90, requiredTags: ['NoFloor']},
        {element: 'water', everyMinutes: 120, maxSeconds: 180},
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
      id: 'evening-close',
      label: 'Evening Review',
      startTime: '21:30',
      endTime: '21:31',
      daysOfWeek: ALL_DAYS,
      slots: [{element: 'heart', everyMinutes: 1, maxSeconds: 200}],
    },
  ],
};
