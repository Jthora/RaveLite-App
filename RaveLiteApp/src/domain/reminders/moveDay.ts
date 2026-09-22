import {getActiveHours, setActiveHours} from '../ambient/activeHours';
import type {ActiveHours} from '../ambient/types';
import {hasMealChecks, planForDay} from './defaultPlan';
import {plansEqual} from './planMutations';
import {loadPlan, savePlan} from './repository';
import type {Plan} from './types';

/**
 * My day and the plan, moved together.
 *
 * The default plan's times are set from My day (`planForDay`). A plan
 * nobody has edited moves with the day, so the morning intent is five
 * minutes after waking whenever that is. A plan somebody edited is theirs:
 * only My day moves, and their windows stay where they put them.
 */

const MEAL_IDS = new Set(['fuel-lunch', 'fuel-dinner']);

/** Whether a plan is still the default for these hours. */
export function isDefaultFor(
  plan: Plan,
  hours: Pick<ActiveHours, 'start' | 'end'>,
): boolean {
  return plansEqual(plan, planForDay(hours, {meals: hasMealChecks(plan)}));
}

/** Save My day, moving an untouched default plan with it. */
export function moveMyDay(next: ActiveHours): void {
  const plan = loadPlan();
  if (isDefaultFor(plan, getActiveHours())) {
    savePlan(planForDay(next, {meals: hasMealChecks(plan)}));
  }
  setActiveHours(next);
}

/** Whether the meal check-ins are in the plan. */
export function mealChecksOn(): boolean {
  return hasMealChecks(loadPlan());
}

/**
 * Add or remove the two meal check-ins. They are off by default; this is
 * the one place that turns them on.
 */
export function setMealChecks(on: boolean): void {
  const plan = loadPlan();
  const hours = getActiveHours();
  if (isDefaultFor(plan, hours)) {
    savePlan(planForDay(hours, {meals: on}));
    return;
  }
  const without = plan.windows.filter(w => !MEAL_IDS.has(w.id));
  const meals = on
    ? planForDay(hours, {meals: true}).windows.filter(w => MEAL_IDS.has(w.id))
    : [];
  savePlan({...plan, windows: [...without, ...meals]});
}
