import {store} from '../../../storage';
import {planSearch, rankPlaces, type PlaceResult} from '../location';
import {
  getFetchReport,
  refreshForecast,
  searchPlaces,
  setPlace,
} from '../weather';

/** What Open-Meteo actually answers, trimmed to the fields that matter. */
const RESULTS: Record<string, unknown> = {
  'Swansea IL': {},
  Swansea: {
    results: [
      {
        name: 'Swansea',
        admin1: 'Wales',
        country: 'United Kingdom',
        latitude: 51.62,
        longitude: -3.94,
      },
      {
        name: 'Swansea',
        admin1: 'Massachusetts',
        country: 'United States',
        latitude: 41.75,
        longitude: -71.19,
      },
      {
        name: 'Swansea',
        admin1: 'South Carolina',
        country: 'United States',
        latitude: 33.74,
        longitude: -81.1,
      },
      {
        name: 'Swansea',
        admin1: 'Illinois',
        country: 'United States',
        latitude: 38.53,
        longitude: -89.99,
      },
      {
        name: 'Swansea',
        admin1: 'Tasmania',
        country: 'Australia',
        latitude: -42.12,
        longitude: 148.07,
      },
    ],
  },
};

const fakeFetch = (async (url: string) => {
  const name = decodeURIComponent(new URL(url).searchParams.get('name') ?? '');
  const body = RESULTS[name] ?? {};
  return {ok: true, json: async () => body} as Response;
}) as unknown as typeof fetch;

// Nothing here may touch the network: setPlace fetches a forecast of its
// own accord, so the global fetch is stubbed out for the whole file.
const offline = (async () => {
  throw new Error('Network request failed');
}) as unknown as typeof fetch;
const realFetch = globalThis.fetch;

beforeEach(() => {
  store.clearAll();
  globalThis.fetch = offline;
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

describe('typing a town the way people type it', () => {
  it('splits a trailing state off the name, and keeps it as the hint', () => {
    expect(planSearch('Swansea IL')).toEqual({
      terms: ['Swansea IL', 'Swansea'],
      hint: 'Illinois',
    });
    expect(planSearch('Swansea, Illinois')).toEqual({
      terms: ['Swansea, Illinois', 'Swansea'],
      hint: 'Illinois',
    });
    expect(planSearch('Swansea')).toEqual({
      terms: ['Swansea'],
      hint: undefined,
    });
  });

  it('leaves a two-word town alone, but still has a fallback', () => {
    // "York" is no state, so the name stays whole and the first word is
    // only ever tried if the whole name finds nothing.
    expect(planSearch('New York')).toEqual({
      terms: ['New York', 'New'],
      hint: 'York',
    });
  });

  it('puts the matching region first', () => {
    const places: PlaceResult[] = [
      {name: 'Swansea', region: 'Wales, United Kingdom', lat: 1, lon: 1},
      {name: 'Swansea', region: 'Illinois, United States', lat: 2, lon: 2},
    ];
    expect(rankPlaces(places, 'IL')[0].region).toBe('Illinois, United States');
    expect(rankPlaces(places, 'Illinois')[0].lat).toBe(2);
    // An unknown hint changes nothing rather than hiding everything.
    expect(rankPlaces(places, 'Neverland')).toHaveLength(2);
  });

  it('finds Swansea, Illinois even though the API finds nothing for "Swansea IL"', async () => {
    const found = await searchPlaces('Swansea IL', fakeFetch);
    expect(found[0]).toMatchObject({
      name: 'Swansea',
      region: 'Illinois, United States',
      lat: 38.53,
    });
    // The others are still offered, in case the hint was wrong.
    expect(found).toHaveLength(5);
  });

  it('says nothing found when nothing matches anywhere', async () => {
    expect(await searchPlaces('Zzzz', fakeFetch)).toEqual([]);
  });
});

describe('when the forecast cannot be fetched', () => {
  it('records why, in words, so the sheet can say it', async () => {
    setPlace({name: 'Swansea', lat: 38.53, lon: -89.99, source: 'typed'}, 1000);
    // Let the fetch setPlace started settle before asking again.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(
      await refreshForecast({force: true, now: 2000, fetchImpl: offline}),
    ).toBe('failed');
    expect(getFetchReport()).toEqual({
      at: 2000,
      ok: false,
      why: 'no connection',
    });

    const server = (async () =>
      ({ok: false, status: 503} as Response)) as unknown as typeof fetch;
    await refreshForecast({force: true, now: 3000, fetchImpl: server});
    expect(getFetchReport()?.why).toContain('having trouble');
  });
});
