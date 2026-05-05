import {nextFireForElement} from '../nextFire';
import {Plan} from '../types';

const MON = new Date(2026, 4, 4, 10, 0); // Mon 10:00 local

const PLAN: Plan = {
  id: 'p',
  name: 'p',
  windows: [
    {
      id: 'desk',
      label: 'Desk',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      slots: [
        {element: 'air', everyMinutes: 30},
        {element: 'fire', everyMinutes: 90},
      ],
    },
  ],
};

describe('nextFireForElement', () => {
  it('returns the next future pulse for an element', () => {
    const info = nextFireForElement(PLAN, 'air', MON.getTime());
    // From Mon 10:00 the next Air pulse is 10:30.
    const expected = new Date(2026, 4, 4, 10, 30).getTime();
    expect(info?.ts).toBe(expected);
    expect(info?.everyMinutes).toBe(30);
    expect(info?.windowId).toBe('desk');
  });

  it('returns undefined when the element has no pulses in 24h', () => {
    const SAT = new Date(2026, 4, 9, 10, 0).getTime(); // weekend, no fires
    expect(nextFireForElement(PLAN, 'air', SAT)).toBeUndefined();
  });

  it('does not return past pulses', () => {
    const info = nextFireForElement(PLAN, 'air', MON.getTime());
    expect(info!.ts).toBeGreaterThan(MON.getTime());
  });
});
