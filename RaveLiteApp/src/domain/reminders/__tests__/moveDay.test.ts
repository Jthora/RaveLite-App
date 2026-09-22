import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {getActiveHours} from '../../ambient/activeHours';
import {DEFAULT_PLAN, planForDay} from '../defaultPlan';
import {mealChecksOn, moveMyDay, setMealChecks} from '../moveDay';
import {loadPlan, savePlan} from '../repository';

const LATE = {start: '10:00', end: '02:00', daysMask: 0b1111111};
const startOf = (id: string) =>
  loadPlan().windows.find(w => w.id === id)?.startTime;

beforeEach(() => store.clearAll());

it('moves an untouched plan with My day', () => {
  moveMyDay(LATE);
  expect(getActiveHours()).toEqual(LATE);
  expect(loadPlan()).toEqual(planForDay(LATE));
  expect(startOf('morning-intent')).toBe('10:05');
});

it('leaves a plan somebody edited where they put it', () => {
  const mine = {
    ...DEFAULT_PLAN,
    windows: DEFAULT_PLAN.windows.map(w =>
      w.id === 'morning-intent'
        ? {...w, startTime: '06:30', endTime: '06:31'}
        : w,
    ),
  };
  savePlan(mine);
  moveMyDay(LATE);
  expect(getActiveHours()).toEqual(LATE);
  expect(loadPlan()).toEqual(mine);
});

it('moves a phone that kept its meal check-ins, and keeps them', () => {
  store.set(
    KEYS.planCurrent,
    JSON.stringify(planForDay(getActiveHours(), {meals: true})),
  );
  moveMyDay(LATE);
  expect(loadPlan()).toEqual(planForDay(LATE, {meals: true}));
});

it('turns the meal check-ins on and off', () => {
  expect(mealChecksOn()).toBe(false);
  setMealChecks(true);
  expect(mealChecksOn()).toBe(true);
  expect(startOf('fuel-lunch')).toBe('11:55');
  setMealChecks(false);
  expect(loadPlan()).toEqual(DEFAULT_PLAN);
});

it('adds them to an edited plan without touching the rest', () => {
  const mine = {...DEFAULT_PLAN, name: 'Mine'};
  savePlan(mine);
  setMealChecks(true);
  const plan = loadPlan();
  expect(plan.name).toBe('Mine');
  expect(plan.windows.slice(0, mine.windows.length)).toEqual(mine.windows);
  expect(mealChecksOn()).toBe(true);
  setMealChecks(false);
  expect(loadPlan()).toEqual(mine);
});
