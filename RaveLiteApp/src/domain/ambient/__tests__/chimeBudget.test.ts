import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {defaultProgram} from '../../program/repository';
import {DEFAULT_PLAN} from '../../reminders/defaultPlan';
import {expandPlanToFires} from '../../reminders/expandPlan';
import {getActiveHours, withinActiveHours} from '../activeHours';
import * as runtime from '../pulseRuntime';
import {__test as setSchedulerTest, setsToday} from '../setScheduler';

/**
 * The operator asked for about twenty chimes a day: Daily Sets rounds, a
 * handful of water calls, two fuel checks, the evening review and the
 * backyard session. This guards the defaults against creeping back up.
 */

// Monday 14 Sep 2026.
const MONDAY = new Date(2026, 8, 14);

beforeEach(() => {
  store.clearAll();
  runtime.__test.reset();
  setSchedulerTest.reset();
});

/** Chimes that actually sound on `date`: rounds plus plan chimes in My day. */
function chimesOn(date: Date): number {
  const morning = new Date(date);
  morning.setHours(8, 0, 0, 0);
  const sets = setsToday(morning.getTime());
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const myDay = getActiveHours();
  const planChimes = expandPlanToFires(
    DEFAULT_PLAN,
    midnight.getTime(),
    midnight.getTime() + 86_399_999,
  ).filter(f => withinActiveHours(new Date(f.ts), myDay));
  return sets.fires.length + planChimes.length - sets.absorbedPlanIds.length;
}

describe('default chime budget', () => {
  it('leaves posture and presence to the rounds', () => {
    const ids = DEFAULT_PLAN.windows.map(w => w.id);
    expect(ids).not.toContain('desk-hours');
    expect(ids).not.toContain('morning-block');
  });

  it('a week 1 Monday comes to about twenty chimes', () => {
    const count = chimesOn(MONDAY);
    expect(count).toBeGreaterThanOrEqual(15);
    expect(count).toBeLessThanOrEqual(24);
  });

  it('week 3 grows the rounds, not the number of chimes', () => {
    // Start the program two weeks earlier, so 14 Sep is week 3.
    store.set(
      KEYS.programState,
      JSON.stringify(defaultProgram(new Date(2026, 7, 31))),
    );
    expect(chimesOn(MONDAY)).toBeLessThanOrEqual(24);
  });
});
