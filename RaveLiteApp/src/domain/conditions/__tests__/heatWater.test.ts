import {DEFAULT_PLAN} from '../../reminders/defaultPlan';
import {expandPlanToFires, planPulseId} from '../../reminders/expandPlan';
import type {HeatLevel} from '../conditions';
import {clockHM} from '../format';
import {
  HEAT_WATER_WINDOW_ID,
  drinkTarget,
  withHeatWaterCalls,
} from '../heatWater';

const DAY = 86_400_000;
const MONDAY = new Date(2026, 8, 14).getTime();

const hotAfternoon = (ts: number): HeatLevel => {
  const h = new Date(ts).getHours();
  return h >= 12 && h < 17 ? 'caution' : 'none';
};

const waterCalls = (plan: typeof DEFAULT_PLAN, from: number) =>
  expandPlanToFires(plan, from, from + DAY - 1).filter(
    f => f.windowId === 'hydration' || f.windowId === HEAT_WATER_WINDOW_ID,
  );

it('water calls come hourly while it is hot, today and tomorrow', () => {
  const plan = withHeatWaterCalls(DEFAULT_PLAN, hotAfternoon, MONDAY);
  expect(waterCalls(plan, MONDAY).map(f => clockHM(f.ts))).toEqual([
    '05:30',
    '07:30',
    '09:30',
    '11:30',
    '12:30',
    '13:30',
    '14:30',
    '15:30',
    '16:30',
    '17:30',
    '19:30',
  ]);
  const tuesday = waterCalls(plan, MONDAY + DAY);
  expect(tuesday.filter(f => f.windowId === HEAT_WATER_WINDOW_ID)).toHaveLength(
    3,
  );
  const ids = waterCalls(plan, MONDAY).map(planPulseId);
  expect(new Set(ids).size).toBe(ids.length);
});

it('leaves the plan itself alone when nothing is hot', () => {
  expect(withHeatWaterCalls(DEFAULT_PLAN, () => 'none', MONDAY)).toBe(
    DEFAULT_PLAN,
  );
});

it('raises the Drink target by 2 in caution and 4 in danger', () => {
  expect(drinkTarget(8, 'none')).toBe(8);
  expect(drinkTarget(8, 'caution')).toBe(10);
  expect(drinkTarget(8, 'danger')).toBe(12);
});
