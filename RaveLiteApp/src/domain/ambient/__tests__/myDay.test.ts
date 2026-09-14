import {store} from '../../../storage';
import {DEFAULT_PLAN} from '../../reminders/defaultPlan';
import {expandPlanToFires, planPulseId} from '../../reminders/expandPlan';
import {setActiveHours, subscribeActiveHours} from '../activeHours';
import {reconcilePlan} from '../planScheduler';
import * as runtime from '../pulseRuntime';
import {
  ROUND_END_MARGIN_MS,
  WATER_RIDE_ALONG_MS,
  __test as setSchedulerTest,
  absorbedWaterCalls,
  setsToday,
} from '../setScheduler';
import {SPILL_MS} from '../../program/schedule';
import type {ActiveHours} from '../types';

/**
 * My day is the one window: rounds spread across it and follow it when it
 * changes, and plan water calls near a round ride along as its glass.
 */

// Monday 14 Sep 2026, 04:00 local — before My day starts, so every round
// and water call is still upcoming.
const MORNING = new Date(2026, 8, 14, 4, 0).getTime();
const at = (h: number, m = 0) => new Date(2026, 8, 14, h, m).getTime();

beforeEach(() => {
  store.clearAll();
  runtime.__test.reset();
  setSchedulerTest.reset();
});

describe('My day', () => {
  it('tells subscribers when it is saved', () => {
    const seen: ActiveHours[] = [];
    const off = subscribeActiveHours(next => seen.push(next));
    const cfg: ActiveHours = {
      start: '08:00',
      end: '21:30',
      daysMask: 0b1111111,
    };
    setActiveHours(cfg);
    off();
    setActiveHours({...cfg, end: '22:00'});
    expect(seen).toEqual([cfg]);
  });

  it('spreads rounds from its start to 90 min before its end', () => {
    const {fires} = setsToday(MORNING);
    expect(fires.length).toBeGreaterThan(0);
    const latest = at(22) - ROUND_END_MARGIN_MS + SPILL_MS;
    for (const f of fires) {
      expect(f.ts).toBeGreaterThanOrEqual(at(5));
      expect(f.ts).toBeLessThanOrEqual(latest);
    }
  });

  it('moves the rounds when it changes', () => {
    setActiveHours({start: '07:00', end: '20:00', daysMask: 0b1111111});
    const {fires} = setsToday(at(6));
    expect(new Date(fires[0].ts).getHours()).toBeLessThan(9);
    expect(fires[fires.length - 1].ts).toBeLessThanOrEqual(
      at(20) - ROUND_END_MARGIN_MS + SPILL_MS,
    );
  });
});

describe('water riding along', () => {
  const midnight = new Date(2026, 8, 14).getTime();
  const waterCalls = expandPlanToFires(
    DEFAULT_PLAN,
    midnight,
    midnight + 86_399_999,
  ).filter(f => f.windowId === 'hydration');

  it('folds a nearby water call into a round', () => {
    const today = setsToday(MORNING);
    const withGlass = today.upcoming.filter(f => f.prescription.water);
    expect(withGlass.length).toBeGreaterThan(0);
    expect(today.absorbedPlanIds).toHaveLength(withGlass.length);
    for (const id of today.absorbedPlanIds) {
      const call = waterCalls.find(c => planPulseId(c) === id)!;
      expect(call).toBeDefined();
      expect(
        withGlass.some(r => Math.abs(r.ts - call.ts) <= WATER_RIDE_ALONG_MS),
      ).toBe(true);
    }
  });

  it('keeps the plan from chiming a call that rides along, but not the rest', () => {
    const skipIds = absorbedWaterCalls(MORNING);
    const {toEnqueue} = reconcilePlan({
      now: MORNING,
      plan: DEFAULT_PLAN,
      alreadyEnqueued: new Set(),
      skipIds,
    });
    const enqueued = new Set(toEnqueue.map(planPulseId));
    for (const call of waterCalls) {
      const id = planPulseId(call);
      expect(enqueued.has(id)).toBe(!skipIds.has(id));
    }
  });

  it('cancels a water call that was queued before it rode along', () => {
    const [id] = setsToday(MORNING).absorbedPlanIds;
    const {toCancel} = reconcilePlan({
      now: MORNING,
      plan: DEFAULT_PLAN,
      alreadyEnqueued: new Set([id]),
      queuedPlanIds: new Set([id]),
      skipIds: new Set([id]),
    });
    expect(toCancel).toEqual([id]);
  });
});
