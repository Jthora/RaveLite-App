import {expandPlanToFires} from '../expandPlan';
import {Plan} from '../types';

// Reference: Monday May 4 2026 is a Monday in every locale (DOW is calendrical).
// Picked far enough from DST transitions in most northern-hemisphere zones
// to keep the assertions stable across CI machines.
const MON = new Date(2026, 4, 4); // months are 0-indexed: 4 = May
const SAT = new Date(2026, 4, 9);

function ts(day: Date, h: number, m = 0): number {
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function emptyPlan(): Plan {
  return {id: 'p', name: 'p', windows: []};
}

describe('expandPlanToFires', () => {
  it('returns nothing when plan has no windows', () => {
    expect(
      expandPlanToFires(emptyPlan(), ts(MON, 0), ts(MON, 23, 59)),
    ).toEqual([]);
  });

  it('returns nothing when range is empty or inverted', () => {
    const plan = emptyPlan();
    expect(expandPlanToFires(plan, ts(MON, 12), ts(MON, 12))).toEqual([]);
    expect(expandPlanToFires(plan, ts(MON, 12), ts(MON, 11))).toEqual([]);
  });

  it('expands a single weekday window with one cadence (start inclusive, end exclusive)', () => {
    const plan: Plan = {
      id: 'p',
      name: 'p',
      windows: [
        {
          id: 'desk',
          label: 'Desk',
          startTime: '09:00',
          endTime: '17:00',
          daysOfWeek: [1], // Monday only
          slots: [{element: 'air', everyMinutes: 30}],
        },
      ],
    };
    const fires = expandPlanToFires(plan, ts(MON, 0), ts(MON, 23, 59));

    // 09:00 .. 16:30 step 30 = 16 fires
    expect(fires).toHaveLength(16);
    expect(fires[0].ts).toBe(ts(MON, 9, 0));
    expect(fires[fires.length - 1].ts).toBe(ts(MON, 16, 30));
    fires.forEach(f => {
      expect(f.element).toBe('air');
      expect(f.windowId).toBe('desk');
      expect(f.slotIndex).toBe(0);
    });
  });

  it('respects daysOfWeek (no fires on Saturday for a weekdays-only window)', () => {
    const plan: Plan = {
      id: 'p',
      name: 'p',
      windows: [
        {
          id: 'desk',
          label: 'Desk',
          startTime: '09:00',
          endTime: '17:00',
          daysOfWeek: [1, 2, 3, 4, 5],
          slots: [{element: 'air', everyMinutes: 30}],
        },
      ],
    };
    const fires = expandPlanToFires(plan, ts(SAT, 0), ts(SAT, 23, 59));
    expect(fires).toEqual([]);
  });

  it('clips fires to fromTs (does not emit past pings)', () => {
    const plan: Plan = {
      id: 'p',
      name: 'p',
      windows: [
        {
          id: 'desk',
          label: 'Desk',
          startTime: '09:00',
          endTime: '17:00',
          daysOfWeek: [1],
          slots: [{element: 'air', everyMinutes: 30}],
        },
      ],
    };
    const fires = expandPlanToFires(plan, ts(MON, 12, 15), ts(MON, 23, 59));
    expect(fires[0].ts).toBe(ts(MON, 12, 30));
  });

  it('clips fires to toTs', () => {
    const plan: Plan = {
      id: 'p',
      name: 'p',
      windows: [
        {
          id: 'desk',
          label: 'Desk',
          startTime: '09:00',
          endTime: '17:00',
          daysOfWeek: [1],
          slots: [{element: 'air', everyMinutes: 30}],
        },
      ],
    };
    const fires = expandPlanToFires(plan, ts(MON, 0), ts(MON, 10, 0));
    expect(fires.map(f => f.ts)).toEqual([
      ts(MON, 9, 0),
      ts(MON, 9, 30),
      ts(MON, 10, 0),
    ]);
  });

  it('exclusive windows suppress non-exclusive slots inside their bounds', () => {
    const plan: Plan = {
      id: 'p',
      name: 'p',
      windows: [
        {
          id: 'desk',
          label: 'Desk',
          startTime: '09:00',
          endTime: '12:00',
          daysOfWeek: [1],
          slots: [{element: 'air', everyMinutes: 30}],
        },
        {
          id: 'focus',
          label: 'Focus',
          startTime: '10:00',
          endTime: '11:00',
          daysOfWeek: [1],
          exclusive: true,
          slots: [{element: 'heart', everyMinutes: 30}],
        },
      ],
    };
    const fires = expandPlanToFires(plan, ts(MON, 0), ts(MON, 23, 59));

    // Air would naturally fire at 09:00, 09:30, 10:00, 10:30, 11:00, 11:30.
    // Exclusive Focus 10:00-11:00 suppresses 10:00 and 10:30 (11:00 is end-exclusive of focus).
    const air = fires.filter(f => f.element === 'air').map(f => f.ts);
    expect(air).toEqual([
      ts(MON, 9, 0),
      ts(MON, 9, 30),
      ts(MON, 11, 0),
      ts(MON, 11, 30),
    ]);
    // Focus heart fires inside its own window unaffected.
    const heart = fires.filter(f => f.element === 'heart').map(f => f.ts);
    expect(heart).toEqual([ts(MON, 10, 0), ts(MON, 10, 30)]);
  });

  it('output is sorted ascending across multiple slots and windows', () => {
    const plan: Plan = {
      id: 'p',
      name: 'p',
      windows: [
        {
          id: 'a',
          label: 'A',
          startTime: '09:00',
          endTime: '12:00',
          daysOfWeek: [1],
          slots: [
            {element: 'fire', everyMinutes: 90},
            {element: 'air', everyMinutes: 30},
          ],
        },
      ],
    };
    const fires = expandPlanToFires(plan, ts(MON, 0), ts(MON, 23, 59));
    for (let i = 1; i < fires.length; i++) {
      expect(fires[i].ts).toBeGreaterThanOrEqual(fires[i - 1].ts);
    }
  });

  it('guards against everyMinutes <= 0 (no infinite loop, no fires)', () => {
    const plan: Plan = {
      id: 'p',
      name: 'p',
      windows: [
        {
          id: 'bad',
          label: 'Bad',
          startTime: '09:00',
          endTime: '10:00',
          daysOfWeek: [1],
          slots: [{element: 'air', everyMinutes: 0}],
        },
      ],
    };
    const fires = expandPlanToFires(plan, ts(MON, 0), ts(MON, 23, 59));
    expect(fires).toEqual([]);
  });

  it('skips and warns on cross-midnight windows (endTime <= startTime)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const plan: Plan = {
      id: 'p',
      name: 'p',
      windows: [
        {
          id: 'overnight',
          label: 'Overnight',
          startTime: '22:00',
          endTime: '06:00',
          daysOfWeek: [1],
          slots: [{element: 'water', everyMinutes: 60}],
        },
      ],
    };
    const fires = expandPlanToFires(plan, ts(MON, 0), ts(MON, 23, 59));
    expect(fires).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('expands across multiple days', () => {
    const plan: Plan = {
      id: 'p',
      name: 'p',
      windows: [
        {
          id: 'desk',
          label: 'Desk',
          startTime: '09:00',
          endTime: '10:00',
          daysOfWeek: [1, 2], // Mon + Tue
          slots: [{element: 'air', everyMinutes: 30}],
        },
      ],
    };
    const TUE = new Date(2026, 4, 5);
    const fires = expandPlanToFires(plan, ts(MON, 0), ts(TUE, 23, 59));
    // Mon: 09:00, 09:30. Tue: 09:00, 09:30. = 4 fires
    expect(fires).toHaveLength(4);
    expect(fires[0].ts).toBe(ts(MON, 9, 0));
    expect(fires[3].ts).toBe(ts(TUE, 9, 30));
  });
});
