import {withinActiveHours} from '../../ambient/activeHours';
import {DEFAULT_ACTIVE_HOURS} from '../../ambient/types';
import {DEFAULT_PLAN, hasMealChecks, planForDay} from '../defaultPlan';
import {expandPlanToFires} from '../expandPlan';
import type {Plan} from '../types';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** The default plan as it was stored until 22 Sep 2026. */
const BEFORE: Plan = {
  id: 'default',
  name: 'Operator Baseline',
  windows: [
    {
      id: 'hydration',
      label: 'Water Calls',
      startTime: '05:30',
      endTime: '20:00',
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
    {
      id: 'morning-intent',
      label: 'Morning Intent',
      startTime: '05:05',
      endTime: '05:06',
      daysOfWeek: ALL_DAYS,
      slots: [
        {element: 'heart', everyMinutes: 1, exerciseId: 'heart.morning-intent'},
      ],
    },
    {
      // Id kept from the evening "Backyard Session" so migrations and
      // stored pulse ids line up.
      id: 'backyard-session',
      label: 'Morning Session',
      startTime: '05:45',
      endTime: '07:00',
      daysOfWeek: ALL_DAYS,
      slots: [{element: 'fire', everyMinutes: 25, block: 'morning'}],
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
      startTime: '20:45',
      endTime: '20:46',
      daysOfWeek: ALL_DAYS,
      slots: [
        {element: 'heart', everyMinutes: 1, exerciseId: 'heart.evening-review'},
      ],
    },
  ],
};

it('is the plan it always was, for the day it always had', () => {
  // Written out the same way too: plans are compared as JSON, so this is
  // what lets a phone's untouched plan follow its My day.
  expect(JSON.stringify(planForDay(DEFAULT_ACTIVE_HOURS, {meals: true}))).toBe(
    JSON.stringify(BEFORE),
  );
});

it('leaves the meal check-ins out unless asked', () => {
  expect(hasMealChecks(DEFAULT_PLAN)).toBe(false);
  expect(hasMealChecks(BEFORE)).toBe(true);
  expect(DEFAULT_PLAN.windows.map(w => w.id)).toEqual([
    'hydration',
    'morning-intent',
    'backyard-session',
    'evening-close',
  ]);
});

it('moves with the day', () => {
  const late = planForDay({start: '09:00', end: '01:00'});
  const at = (id: string) => late.windows.find(w => w.id === id)!.startTime;
  expect(at('morning-intent')).toBe('09:05');
  expect(at('backyard-session')).toBe('09:45');
  expect(at('evening-close')).toBe('00:45');
});

describe('a night shift, 22:00 to 06:00', () => {
  const hours = {start: '22:00', end: '06:00', daysMask: 0b1111111};
  const plan = planForDay(hours, {meals: true});
  const monday = new Date(2026, 8, 14).getTime();
  const fires = expandPlanToFires(plan, monday, monday + 86_399_999);

  it('has no window that crosses midnight', () => {
    for (const w of plan.windows) {
      expect(w.endTime > w.startTime).toBe(true);
    }
  });

  it('chimes only inside My day, and still chimes', () => {
    expect(fires.length).toBeGreaterThan(5);
    for (const f of fires) {
      expect(withinActiveHours(new Date(f.ts), hours)).toBe(true);
    }
    const water = fires.filter(f => f.windowId.startsWith('hydration'));
    expect(water.length).toBeGreaterThanOrEqual(3);
  });
});
