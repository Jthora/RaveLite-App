import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {
  __test as planSchedulerTest,
  reconcileNow,
} from '../../ambient/planScheduler';
import * as runtime from '../../ambient/pulseRuntime';
import {__test as setSchedulerTest} from '../../ambient/setScheduler';
import {DEFAULT_PLAN} from '../../reminders/defaultPlan';
import {pickDrillForSlotSeeded} from '../../reminders/scheduler';
import type {CadenceSlot, Plan} from '../../reminders/types';
import type {HourForecast} from '../forecast';
import {HEAT_WATER_WINDOW_ID} from '../heatWater';
import {
  conditionsFor,
  drillForPlanChime,
  getForecast,
  hottestToday,
  planWithWeather,
  refreshForecast,
  weatherLine,
} from '../weather';

const at = (h: number, m = 0) => new Date(2026, 8, 14, h, m).getTime();
const place = {
  name: 'Test Town',
  lat: 40.7,
  lon: -74,
  source: 'typed',
  setAt: 0,
};

/** Every hour of 14 September, with `over` applied to the hours it picks. */
function saveForecast(
  over: (h: number) => Partial<HourForecast> = () => ({}),
): void {
  const hours: HourForecast[] = Array.from({length: 24}, (_, h) => ({
    ts: at(h),
    tempC: 20,
    feelsC: 20,
    humidity: 50,
    rainChance: 0,
    rainMm: 0,
    code: 0,
    windKmh: 10,
    ...over(h),
  }));
  store.set(
    KEYS.weatherForecast,
    JSON.stringify({fetchedAt: at(4), lat: 40.7, lon: -74, hours, days: []}),
  );
}

const run: CadenceSlot = {
  element: 'fire',
  everyMinutes: 1,
  exerciseId: 'fire.zone2-run',
};

beforeEach(() => {
  store.clearAll();
  runtime.__test.reset();
  planSchedulerTest.reset();
  setSchedulerTest.reset();
});

it('without a place, nothing about the day changes', () => {
  const slot = DEFAULT_PLAN.windows[0].slots[0];
  expect(conditionsFor(at(6))).toBeUndefined();
  expect(drillForPlanChime(slot, 'plan:x:0:1', at(6))).toEqual({
    drill: pickDrillForSlotSeeded(slot, 'plan:x:0:1'),
  });
  expect(planWithWeather(DEFAULT_PLAN, at(0))).toBe(DEFAULT_PLAN);
  expect(weatherLine(at(6))).toBeUndefined();
});

it('fetches the forecast for the rounded place, then keeps it for three hours', async () => {
  store.set(KEYS.weatherPlace, JSON.stringify(place));
  const fetchImpl = jest.fn(async (_url: string) => ({
    ok: true,
    json: async () => ({
      hourly: {time: [at(5) / 1000], temperature_2m: [12]},
      daily: {time: [], precipitation_sum: []},
    }),
  }));
  const asFetch = fetchImpl as unknown as typeof fetch;
  expect(await refreshForecast({now: at(5), fetchImpl: asFetch})).toBe(
    'updated',
  );
  expect(fetchImpl.mock.calls[0][0]).toContain('latitude=40.7&longitude=-74');
  expect(getForecast()?.hours).toHaveLength(1);
  expect(await refreshForecast({now: at(7), fetchImpl: asFetch})).toBe('fresh');

  const offline = jest.fn(async () => {
    throw new Error('offline');
  }) as unknown as typeof fetch;
  expect(
    await refreshForecast({now: at(9), fetchImpl: offline, force: true}),
  ).toBe('failed');
  expect(getForecast()?.hours).toHaveLength(1);
});

it('a rainy hour swaps the run for something indoors, and says why', () => {
  store.set(KEYS.weatherPlace, JSON.stringify(place));
  saveForecast(() => ({rainChance: 90}));
  const {drill, note} = drillForPlanChime(run, 'plan:yard:0:1', at(12));
  // Which drill it lands on is the library's business, and the library
  // keeps growing; what matters is that it is indoors and of a length
  // that can stand in for a run.
  expect(drill!.venues).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/^(mat|standing|wall|desk|house)$/),
    ]),
  );
  expect(drill!.approxSeconds).toBeGreaterThanOrEqual(240);
  expect(note).toMatch(/^Rain 90% — .+ inside instead$/);
});

it('the plan scheduler queues the adapted drill, and queues it again when the forecast changes', () => {
  const plan: Plan = {
    id: 'test',
    name: 'Test',
    windows: [
      {
        id: 'yard',
        label: 'Yard',
        startTime: '12:00',
        endTime: '12:01',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        slots: [run],
      },
    ],
  };
  store.set(KEYS.planCurrent, JSON.stringify(plan));
  store.set(KEYS.weatherPlace, JSON.stringify(place));
  saveForecast(() => ({rainChance: 90}));
  const id = `plan:yard:0:${at(12)}`;
  const queued = () => runtime.queuedPulses().find(p => p.id === id);

  reconcileNow(at(11));
  expect(queued()).toMatchObject({
    exerciseId: 'fire.fire-rounds',
    note: 'Rain 90% — Fire Rounds (20 on / 10 off) inside instead',
  });

  saveForecast();
  reconcileNow(at(11, 1));
  expect(queued()?.exerciseId).toBe('fire.zone2-run');
  expect(queued()?.note).toBeUndefined();
});

it('a hot afternoon adds water calls and raises the heat level', () => {
  store.set(KEYS.weatherPlace, JSON.stringify(place));
  saveForecast(h => (h >= 12 && h < 17 ? {feelsC: 35} : {}));
  const plan = planWithWeather(DEFAULT_PLAN, at(0));
  expect(
    plan.windows.filter(w => w.id === HEAT_WATER_WINDOW_ID).length,
  ).toBeGreaterThan(0);
  expect(hottestToday(at(8))).toBe('caution');
  expect(weatherLine(at(3))).toMatchObject({
    place: expect.objectContaining({name: 'Test Town'}),
    next: expect.objectContaining({kind: 'sunrise'}),
    conditions: expect.objectContaining({known: true, tempC: 20}),
  });
});
