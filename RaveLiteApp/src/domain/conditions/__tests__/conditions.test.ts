import {bugIndex, conditionsAt, heatLevel} from '../conditions';
import {
  forecastUrl,
  hourAt,
  parseForecast,
  recentRainMm,
  type Forecast,
  type HourForecast,
} from '../forecast';
import {parsePlaces, placeSearchUrl, roundCoord} from '../location';
import type {SunTimes} from '../sun';

const DAY = 86_400_000;
const at = (h: number, m = 0) => new Date(2026, 8, 14, h, m).getTime();

const hour = (h: number, over: Partial<HourForecast> = {}): HourForecast => ({
  ts: at(h),
  tempC: 20,
  feelsC: 20,
  humidity: 50,
  rainChance: 0,
  rainMm: 0,
  code: 0,
  windKmh: 10,
  ...over,
});

/** `rain` lists the days before today, oldest first. */
const forecast = (hours: HourForecast[], rain: number[] = []): Forecast => ({
  fetchedAt: at(4),
  lat: 40.7,
  lon: -74,
  hours,
  days: [
    ...rain.map((mm, i) => ({ts: at(0) - (rain.length - i) * DAY, rainMm: mm})),
    {ts: at(0), rainMm: 30},
  ],
});

const sun: SunTimes = {
  civilDawn: at(6, 12),
  sunrise: at(6, 40),
  sunset: at(19, 10),
  civilDusk: at(19, 38),
  solarNoon: at(12, 55),
  dayLengthMin: 750,
};

describe('forecast', () => {
  it('reads an Open-Meteo response, skipping hours with no temperature', () => {
    const parsed = parseForecast(
      {
        hourly: {
          time: [at(5) / 1000, at(6) / 1000, at(7) / 1000],
          temperature_2m: [18.5, null, 21],
          apparent_temperature: [17, 19, 23],
          relative_humidity_2m: [80, 80, 60],
          precipitation_probability: [10, 20, 70],
          precipitation: [0, 0, 1.2],
          weather_code: [3, 3, 61],
          wind_speed_10m: [5, 6, 20],
        },
        daily: {time: [at(0) / 1000 - 86_400], precipitation_sum: [null]},
      },
      {lat: 40.7, lon: -74},
      at(4),
    );
    expect(parsed?.hours).toEqual([
      hour(5, {
        tempC: 18.5,
        feelsC: 17,
        humidity: 80,
        rainChance: 10,
        code: 3,
        windKmh: 5,
      }),
      hour(7, {
        tempC: 21,
        feelsC: 23,
        humidity: 60,
        rainChance: 70,
        rainMm: 1.2,
        code: 61,
        windKmh: 20,
      }),
    ]);
    expect(parsed?.days).toEqual([{ts: at(0) - DAY, rainMm: 0}]);
    expect(parsed).toMatchObject({lat: 40.7, lon: -74, fetchedAt: at(4)});
    expect(parseForecast({}, {lat: 0, lon: 0}, 0)).toBeUndefined();
    expect(
      parseForecast({hourly: {time: []}}, {lat: 0, lon: 0}, 0),
    ).toBeUndefined();
  });

  it('asks for the rounded place in unix time', () => {
    const url = forecastUrl(40.7, -74);
    expect(url).toContain('latitude=40.7&longitude=-74');
    expect(url).toContain('timeformat=unixtime');
  });

  it('finds the hour and the rain of the days before', () => {
    const f = forecast([hour(6), hour(7)], [3, 0, 4]);
    expect(hourAt(f, at(6, 59))?.ts).toBe(at(6));
    expect(hourAt(f, at(8))).toBeUndefined();
    expect(recentRainMm(f, at(8))).toBe(7);
  });
});

describe('places', () => {
  it('reads a place search and rounds coordinates to about 10 km', () => {
    expect(
      parsePlaces({
        results: [
          {
            name: 'Springfield',
            latitude: 37.21533,
            longitude: -93.29824,
            admin1: 'Missouri',
            country: 'United States',
          },
          {name: 'Nowhere'},
        ],
      }),
    ).toEqual([
      {
        name: 'Springfield',
        region: 'Missouri, United States',
        lat: 37.21533,
        lon: -93.29824,
      },
    ]);
    expect(parsePlaces({generationtime_ms: 0.4})).toEqual([]);
    expect(placeSearchUrl('  Saint Paul ')).toContain('name=Saint%20Paul&');
    expect(roundCoord(40.7103)).toBe(40.7);
    expect(roundCoord(-73.9931)).toBe(-74);
  });
});

describe('conditions', () => {
  it('rain by chance or by rain falling', () => {
    const f = forecast([
      hour(7, {rainChance: 60}),
      hour(8, {rainMm: 0.5}),
      hour(9, {rainChance: 40}),
    ]);
    expect(conditionsAt(at(7, 30), {forecast: f})).toMatchObject({
      known: true,
      rain: true,
      rainChance: 60,
    });
    expect(conditionsAt(at(8), {forecast: f}).rain).toBe(true);
    expect(conditionsAt(at(9), {forecast: f}).rain).toBe(false);
  });

  it('heat bands, cold and ice', () => {
    expect(heatLevel(31.9)).toBe('none');
    expect(heatLevel(32)).toBe('caution');
    expect(heatLevel(39)).toBe('danger');
    const f = forecast([
      hour(14, {tempC: 31, feelsC: 35}),
      hour(6, {tempC: -1, feelsC: -2, code: 71}),
    ]);
    expect(conditionsAt(at(14), {forecast: f}).heat).toBe('caution');
    expect(conditionsAt(at(6), {forecast: f})).toMatchObject({
      cold: true,
      icy: true,
      heat: 'none',
    });
  });

  it('dark before first light, from the sun alone', () => {
    expect(conditionsAt(at(6), {sun})).toMatchObject({
      known: false,
      dark: true,
      firstLight: at(6, 12),
      rain: false,
    });
    expect(conditionsAt(at(6, 30), {sun}).dark).toBe(false);
    expect(conditionsAt(at(20), {sun}).dark).toBe(true);
  });

  it('bugs: a warm, humid, still dawn after rain; not a dry breezy noon or a cold one', () => {
    const f = forecast(
      [
        hour(6, {tempC: 20, humidity: 85, windKmh: 4}),
        hour(13, {tempC: 26, humidity: 45, windKmh: 18}),
      ],
      [6],
    );
    expect(conditionsAt(at(6, 30), {forecast: f, sun}).bugs).toBe('high');
    expect(conditionsAt(at(13), {forecast: f, sun}).bugs).toBe('low');
    const context = {recentRainMm: 20, nearDawnOrDusk: true};
    expect(bugIndex({tempC: 8, humidity: 95, windKmh: 0}, context)).toBe('low');
    expect(
      bugIndex(
        {tempC: 22, humidity: 60, windKmh: 10},
        {recentRainMm: 0, nearDawnOrDusk: false},
      ),
    ).toBe('medium');
  });

  it('a buggy-today tap overrides the estimate', () => {
    expect(conditionsAt(at(13), {buggyToday: true}).bugs).toBe('high');
  });
});
