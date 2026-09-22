/**
 * Pass 3: the forecast is the one thing the app takes from the internet.
 * A free public API can answer with anything — an outage page, a half
 * response, nulls where numbers go, an empty result, a clock at 1970 —
 * and none of it may reach a chime or stop the app.
 */
import {
  conditionsFor,
  getForecast,
  getFetchReport,
  refreshForecast,
  setPlace,
} from '../weather';
import {parseForecast} from '../forecast';
import {parsePlaces} from '../location';
import {searchPlaces} from '../weather';
import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';

const NOW = new Date(2026, 8, 20, 9).getTime();
const PLACE = {
  name: 'Somewhere',
  lat: 51.5,
  lon: -0.1,
  source: 'typed' as const,
};

/** A fetch that answers with `body`, or fails the way the argument says. */
function fetchOf(body: unknown, opts: {status?: number; hang?: boolean} = {}) {
  return jest.fn(
    (_url: string, init?: {signal?: AbortSignal}) =>
      new Promise((resolve, reject) => {
        if (opts.hang) {
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('Aborted')),
          );
          return;
        }
        resolve({
          ok: opts.status === undefined || opts.status < 400,
          status: opts.status ?? 200,
          json: async () => {
            if (body === '<<throw>>') {
              throw new SyntaxError('Unexpected token < in JSON');
            }
            return body;
          },
        });
      }) as unknown as Promise<Response>,
  ) as unknown as typeof fetch;
}

beforeEach(async () => {
  store.clearAll();
  // Setting a place fetches for it, and that fetch is refused here (see
  // jest.setup.js). Let it settle, so each case starts with no forecast
  // and nothing in flight.
  setPlace(PLACE, NOW);
  await new Promise(resolve => setImmediate(resolve));
  store.delete(KEYS.weatherForecast);
});

/** Answers that must leave the app without a forecast, and still standing. */
const NONSENSE: [name: string, body: unknown][] = [
  ['null', null],
  ['an empty object', {}],
  ['an error object', {error: true, reason: 'No matching data'}],
  ['HTML', '<<throw>>'],
  ['hourly missing', {daily: {time: [1], precipitation_sum: [0]}}],
  ['hourly empty', {hourly: {time: [], temperature_2m: []}}],
  ['hourly of nulls', {hourly: {time: [null, null], temperature_2m: [null]}}],
  [
    'times as text',
    {hourly: {time: ['2026-09-20T09:00'], temperature_2m: [14]}},
  ],
  ['a string where the body goes', 'sorry'],
  ['an array where the body goes', [1, 2, 3]],
];

it('keeps no forecast at all from an answer that makes no sense', async () => {
  for (const [name, body] of NONSENSE) {
    const result = await refreshForecast({
      force: true,
      now: NOW,
      fetchImpl: fetchOf(body),
    });
    expect({name, result}).toEqual({name, result: 'failed'});
    expect({name, forecast: getForecast()}).toEqual({
      name,
      forecast: undefined,
    });
    // It says why, rather than looking like it never tried.
    expect({name, said: (getFetchReport()?.why ?? '').length > 0}).toEqual({
      name,
      said: true,
    });
    // And nothing downstream throws without one.
    expect({name, threw: false}).toEqual({
      name,
      threw: (() => {
        try {
          conditionsFor(NOW);
          return false;
        } catch {
          return true;
        }
      })(),
    });
  }
});

it('gives up on a request that never answers, and on a server error', async () => {
  jest.useFakeTimers();
  try {
    const hung = refreshForecast({
      force: true,
      now: NOW,
      fetchImpl: fetchOf({}, {hang: true}),
    });
    jest.advanceTimersByTime(60_000);
    expect(await hung).toBe('failed');
  } finally {
    jest.useRealTimers();
  }
  expect(
    await refreshForecast({
      force: true,
      now: NOW,
      fetchImpl: fetchOf({}, {status: 500}),
    }),
  ).toBe('failed');
  expect(getForecast()).toBeUndefined();
});

it('reads hours it can use and drops the rest, whatever the columns say', () => {
  const forecast = parseForecast(
    {
      hourly: {
        time: [0, 1_759_000_000, 'noon', 1_759_003_600, null],
        temperature_2m: [12, 14, 15, null, 9],
        apparent_temperature: [null, 13],
        relative_humidity_2m: 'not a column',
        precipitation_probability: [200, -5],
        precipitation: [NaN, 1.5],
        weather_code: [61],
        wind_speed_10m: [Infinity, 12],
      },
      daily: {time: [1_758_931_200, null], precipitation_sum: [3.2]},
    },
    PLACE,
    NOW,
  )!;
  expect(forecast.hours).toHaveLength(2);
  for (const hour of forecast.hours) {
    for (const value of Object.values(hour)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  }
  // 1970 is a real timestamp, just a useless one: it is kept and ignored
  // by everything that asks for "the hour covering now".
  expect(forecast.hours[0].ts).toBe(0);
  expect(forecast.days).toHaveLength(1);
});

it('finds no town rather than a broken one', async () => {
  expect(parsePlaces(null)).toEqual([]);
  expect(parsePlaces({results: null})).toEqual([]);
  expect(
    parsePlaces({results: [{}, {name: 'Nowhere'}, {latitude: 1}]}),
  ).toEqual([]);
  expect(
    await searchPlaces('somewhere', fetchOf({results: [{name: 'X'}]})),
  ).toEqual([]);
  await expect(
    searchPlaces('somewhere', fetchOf({}, {status: 500})),
  ).rejects.toThrow();
});
