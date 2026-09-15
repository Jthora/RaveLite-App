import {store} from './index';
import {CURRENT_SCHEMA_VERSION, KEYS} from './keys';
import {DEFAULT_ACTIVE_HOURS, type ActiveHours} from '../domain/ambient/types';
import {DEFAULT_PLAN} from '../domain/reminders/defaultPlan';
import {plansEqual} from '../domain/reminders/planMutations';
import type {Plan} from '../domain/reminders/types';

/**
 * Storage schema migration runner.
 *
 * Called once at app start (from App.tsx), before any scheduler starts.
 * Reads the persisted schema version, applies any pending step-migrations,
 * then writes the current version back.
 *
 * Conventions:
 *   - Migrations are forward-only. We do not downgrade.
 *   - Each step takes the store from version N to N+1. Compose for jumps.
 *   - Migrations must be idempotent (safe to re-run on partial failure).
 */
export function runMigrations(now: number = Date.now()): void {
  const stored = store.getNumber(KEYS.schemaVersion);
  const from = typeof stored === 'number' ? stored : 0;

  if (from === CURRENT_SCHEMA_VERSION) {
    return;
  }
  if (from > CURRENT_SCHEMA_VERSION) {
    console.warn(
      `[migrations] stored schema v${from} is newer than app v${CURRENT_SCHEMA_VERSION}; ` +
        'leaving data untouched (downgrade not supported).',
    );
    return;
  }

  if (from < 2) {
    migrateToRoundsAndMyDay(now);
  }
  if (from < 3) {
    forgetSubTabs();
  }
  if (from < 4) {
    moveDayToMorning();
  }
  if (from < 5) {
    addCoreCheckIns();
  }
  if (from < 6) {
    windDownAtNine();
  }

  store.set(KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
}

/**
 * v2 — Daily Sets rounds and one My day window.
 *
 *  - A saved plan that isn't the new default is kept under `planBackupV1`
 *    and replaced, so its posture and presence cadences stop chiming on
 *    top of the rounds. Setup offers to restore it.
 *  - Daily Sets lose their own day window; rounds spread across My day.
 *
 * A fresh install has nothing saved yet, so nothing changes.
 */
function migrateToRoundsAndMyDay(now: number): void {
  const rawPlan = store.getString(KEYS.planCurrent);
  if (rawPlan !== undefined && !isDefaultPlan(rawPlan)) {
    // Keep the first backup if an earlier run was interrupted.
    if (store.getString(KEYS.planBackupV1) === undefined) {
      store.set(KEYS.planBackupV1, rawPlan);
    }
    store.set(KEYS.planCurrent, JSON.stringify(DEFAULT_PLAN));
    store.set(KEYS.planReplacedAt, now);
  }

  const rawProgram = store.getString(KEYS.programState);
  if (rawProgram !== undefined) {
    try {
      const program = JSON.parse(rawProgram) as Record<string, unknown>;
      delete program.dayStart;
      delete program.dayEnd;
      store.set(KEYS.programState, JSON.stringify(program));
    } catch {
      // Corrupt: loadProgram already falls back to a fresh program.
    }
  }
}

/**
 * v3 — one page per element. The shell has no sub-tabs any more, so the
 * tab each element was last left on is dropped.
 */
function forgetSubTabs(): void {
  store.delete(KEYS.setting('shell.subTabByElement'));
}

function isDefaultPlan(raw: string): boolean {
  return isPlan(raw, DEFAULT_PLAN);
}

function isPlan(raw: string, plan: Plan): boolean {
  try {
    return plansEqual(JSON.parse(raw) as Plan, plan);
  } catch {
    return false;
  }
}

/** My day as the factory set it before v4. */
const V3_DEFAULT_HOURS: ActiveHours = {
  start: '09:00',
  end: '22:00',
  daysMask: 0b1111111,
};

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** The default plan as it stood in v2 and v3, before the day moved to 05:00. */
export const V3_DEFAULT_PLAN: Plan = {
  id: 'default',
  name: 'Operator Baseline',
  windows: [
    {
      id: 'hydration',
      label: 'Water Calls',
      startTime: '09:20',
      endTime: '21:00',
      daysOfWeek: EVERY_DAY,
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
      daysOfWeek: EVERY_DAY,
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
      daysOfWeek: EVERY_DAY,
      slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
    },
    {
      id: 'fuel-dinner',
      label: 'Fuel Check — Dinner',
      startTime: '19:05',
      endTime: '19:06',
      daysOfWeek: EVERY_DAY,
      slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
    },
    {
      id: 'evening-close',
      label: 'Evening Review',
      startTime: '21:30',
      endTime: '21:31',
      daysOfWeek: EVERY_DAY,
      slots: [{element: 'heart', everyMinutes: 1, maxSeconds: 200}],
    },
  ],
};

/**
 * v4 — the day starts at 05:00, water calls start on waking, and the
 * evening Backyard Session becomes a Morning Session. Only untouched
 * defaults move: a My day or plan the operator changed stays as it is.
 */
function moveDayToMorning(): void {
  const rawHours = store.getString(KEYS.activeHours);
  if (rawHours !== undefined) {
    try {
      const hours = JSON.parse(rawHours) as ActiveHours;
      if (
        hours.start === V3_DEFAULT_HOURS.start &&
        hours.end === V3_DEFAULT_HOURS.end &&
        hours.daysMask === V3_DEFAULT_HOURS.daysMask
      ) {
        store.set(KEYS.activeHours, JSON.stringify(DEFAULT_ACTIVE_HOURS));
      }
    } catch {
      // Corrupt: getActiveHours already falls back to the default.
    }
  }

  const rawPlan = store.getString(KEYS.planCurrent);
  if (rawPlan !== undefined && isPlan(rawPlan, V3_DEFAULT_PLAN)) {
    store.set(KEYS.planCurrent, JSON.stringify(DEFAULT_PLAN));
  }
}

/** The default plan as it stood in v4, before the Core check-ins. */
export const V4_DEFAULT_PLAN: Plan = {
  id: 'default',
  name: 'Operator Baseline',
  windows: [
    {
      id: 'hydration',
      label: 'Water Calls',
      startTime: '05:30',
      endTime: '20:00',
      daysOfWeek: EVERY_DAY,
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
      id: 'backyard-session',
      label: 'Morning Session',
      startTime: '05:45',
      endTime: '07:00',
      daysOfWeek: EVERY_DAY,
      slots: [
        {element: 'fire', everyMinutes: 45, requiredTags: ['Conditioning']},
        {element: 'water', everyMinutes: 40, requiredTags: ['Flow']},
      ],
    },
    {
      id: 'fuel-lunch',
      label: 'Fuel Check — Lunch',
      startTime: '11:55',
      endTime: '11:56',
      daysOfWeek: EVERY_DAY,
      slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
    },
    {
      id: 'fuel-dinner',
      label: 'Fuel Check — Dinner',
      startTime: '19:05',
      endTime: '19:06',
      daysOfWeek: EVERY_DAY,
      slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
    },
    {
      id: 'evening-close',
      label: 'Evening Review',
      startTime: '21:30',
      endTime: '21:31',
      daysOfWeek: EVERY_DAY,
      slots: [{element: 'heart', everyMinutes: 1, maxSeconds: 200}],
    },
  ],
};

/**
 * v5 — Core gets its check-ins: a Morning Intent at 05:05, and the Evening
 * Review always chimes as itself (it used to pick any Heart drill). Only an
 * untouched default plan moves.
 */
function addCoreCheckIns(): void {
  const rawPlan = store.getString(KEYS.planCurrent);
  if (rawPlan !== undefined && isPlan(rawPlan, V4_DEFAULT_PLAN)) {
    store.set(KEYS.planCurrent, JSON.stringify(DEFAULT_PLAN));
  }
}

/** My day as the factory set it in v4 and v5. */
const V5_DEFAULT_HOURS: ActiveHours = {
  start: '05:00',
  end: '22:00',
  daysMask: 0b1111111,
};

/** The default plan as it stood in v5, before the 21:00 wind-down. */
export const V5_DEFAULT_PLAN: Plan = {
  id: 'default',
  name: 'Operator Baseline',
  windows: [
    {
      id: 'hydration',
      label: 'Water Calls',
      startTime: '05:30',
      endTime: '20:00',
      daysOfWeek: EVERY_DAY,
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
      daysOfWeek: EVERY_DAY,
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
      daysOfWeek: EVERY_DAY,
      slots: [
        {element: 'fire', everyMinutes: 45, requiredTags: ['Conditioning']},
        {
          element: 'water',
          everyMinutes: 40,
          maxSeconds: 600,
          requiredTags: ['Flow', 'Coordination'],
        },
      ],
    },
    {
      id: 'fuel-lunch',
      label: 'Fuel Check — Lunch',
      startTime: '11:55',
      endTime: '11:56',
      daysOfWeek: EVERY_DAY,
      slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
    },
    {
      id: 'fuel-dinner',
      label: 'Fuel Check — Dinner',
      startTime: '19:05',
      endTime: '19:06',
      daysOfWeek: EVERY_DAY,
      slots: [{element: 'heart', everyMinutes: 1, requiredTags: ['Fuel']}],
    },
    {
      id: 'evening-close',
      label: 'Evening Review',
      startTime: '21:30',
      endTime: '21:31',
      daysOfWeek: EVERY_DAY,
      slots: [
        {element: 'heart', everyMinutes: 1, exerciseId: 'heart.evening-review'},
      ],
    },
  ],
};

/**
 * v6 — the day winds down at 21:00: an untouched My day ends at 21:00
 * instead of 22:00, and an untouched default plan moves the Evening Review
 * to 20:45, inside it.
 */
function windDownAtNine(): void {
  const rawHours = store.getString(KEYS.activeHours);
  if (rawHours !== undefined) {
    try {
      const hours = JSON.parse(rawHours) as ActiveHours;
      if (
        hours.start === V5_DEFAULT_HOURS.start &&
        hours.end === V5_DEFAULT_HOURS.end &&
        hours.daysMask === V5_DEFAULT_HOURS.daysMask
      ) {
        store.set(KEYS.activeHours, JSON.stringify(DEFAULT_ACTIVE_HOURS));
      }
    } catch {
      // Corrupt: getActiveHours already falls back to the default.
    }
  }
  const rawPlan = store.getString(KEYS.planCurrent);
  if (rawPlan !== undefined && isPlan(rawPlan, V5_DEFAULT_PLAN)) {
    store.set(KEYS.planCurrent, JSON.stringify(DEFAULT_PLAN));
  }
}
