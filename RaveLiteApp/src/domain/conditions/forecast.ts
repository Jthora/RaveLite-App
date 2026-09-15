/**
 * The hourly forecast, from Open-Meteo (free, no account or API key). Only
 * the rounded coordinates are sent. Parsing is pure; fetching lives in
 * `weather.ts`.
 */

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Days of past rain kept, for the bug estimate. */
export const RECENT_RAIN_DAYS = 10;

export interface HourForecast {
  /** Start of the hour, epoch ms. */
  ts: number;
  tempC: number;
  /** Apparent ("feels like") temperature. */
  feelsC: number;
  /** Relative humidity, %. */
  humidity: number;
  /** Chance of rain, %. */
  rainChance: number;
  rainMm: number;
  /** WMO weather code. */
  code: number;
  windKmh: number;
}

export interface DayForecast {
  /** Local midnight at the forecast place, epoch ms. */
  ts: number;
  rainMm: number;
}

export interface Forecast {
  fetchedAt: number;
  /** The rounded coordinates it was fetched for. */
  lat: number;
  lon: number;
  hours: HourForecast[];
  days: DayForecast[];
}

export function forecastUrl(lat: number, lon: number): string {
  return (
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat}&longitude=${lon}` +
    '&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,' +
    'precipitation_probability,precipitation,weather_code,wind_speed_10m' +
    '&daily=precipitation_sum' +
    `&past_days=${RECENT_RAIN_DAYS}&forecast_days=2` +
    '&past_hours=6&forecast_hours=48' +
    '&timezone=auto&timeformat=unixtime'
  );
}

type Column = ReadonlyArray<number | null | undefined>;

function column(source: Record<string, unknown>, key: string): Column {
  const value = source[key];
  return Array.isArray(value) ? (value as Column) : [];
}

const numberOr = (value: number | null | undefined, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/** An Open-Meteo response, or undefined when it has no usable hours. */
export function parseForecast(
  json: unknown,
  place: {lat: number; lon: number},
  fetchedAt: number,
): Forecast | undefined {
  const body = json as {
    hourly?: Record<string, unknown>;
    daily?: Record<string, unknown>;
  };
  const hourly = body?.hourly;
  if (!hourly) {
    return undefined;
  }
  const time = column(hourly, 'time');
  const temp = column(hourly, 'temperature_2m');
  const feels = column(hourly, 'apparent_temperature');
  const humidity = column(hourly, 'relative_humidity_2m');
  const chance = column(hourly, 'precipitation_probability');
  const rain = column(hourly, 'precipitation');
  const code = column(hourly, 'weather_code');
  const wind = column(hourly, 'wind_speed_10m');
  const hours: HourForecast[] = [];
  time.forEach((t, i) => {
    const tempC = temp[i];
    if (typeof t !== 'number' || typeof tempC !== 'number') {
      return;
    }
    hours.push({
      ts: t * 1000,
      tempC,
      feelsC: numberOr(feels[i], tempC),
      humidity: numberOr(humidity[i], 0),
      rainChance: numberOr(chance[i], 0),
      rainMm: numberOr(rain[i], 0),
      code: numberOr(code[i], 0),
      windKmh: numberOr(wind[i], 0),
    });
  });
  if (hours.length === 0) {
    return undefined;
  }
  const days: DayForecast[] = [];
  const daily = body.daily;
  if (daily) {
    const dayTime = column(daily, 'time');
    const dayRain = column(daily, 'precipitation_sum');
    dayTime.forEach((t, i) => {
      if (typeof t === 'number') {
        days.push({ts: t * 1000, rainMm: numberOr(dayRain[i], 0)});
      }
    });
  }
  return {fetchedAt, lat: place.lat, lon: place.lon, hours, days};
}

/** The forecast hour covering `ts`. */
export function hourAt(
  forecast: Forecast,
  ts: number,
): HourForecast | undefined {
  return forecast.hours.find(h => ts >= h.ts && ts < h.ts + HOUR_MS);
}

/** Rain over the days before `ts`'s day, in mm. */
export function recentRainMm(
  forecast: Forecast,
  ts: number,
  days: number = RECENT_RAIN_DAYS,
): number {
  const today = new Date(ts);
  today.setHours(0, 0, 0, 0);
  const to = today.getTime();
  const from = to - days * DAY_MS;
  // Midday of each forecast day, so a place a timezone away still lands.
  return forecast.days
    .filter(d => d.ts + DAY_MS / 2 >= from && d.ts + DAY_MS / 2 < to)
    .reduce((sum, d) => sum + d.rainMm, 0);
}
