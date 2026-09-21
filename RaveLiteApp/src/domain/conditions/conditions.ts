/**
 * What it's like outside at a given time — pure.
 *
 *   Dark   before first light (civil dawn) or after last light
 *   Rain   rain chance 50% or more, or rain falling that hour
 *   Storm  thunder forecast that hour — inside whatever you think of rain
 *   Heat   feels-like 32 °C+ is caution, 39 °C+ danger (the heat index's
 *          "extreme caution" and "danger" bands)
 *   Cold   feels-like 0 °C or below; icy with snow or freezing rain
 *   Bugs   an estimate: warm, humid, still air, near dawn or dusk, and rain
 *          in the last ten days all raise it; below 10 °C they're gone.
 *          A "buggy today" tap overrides it.
 *
 * No dependable free mosquito feed exists, so the bug level is a guess from
 * the weather, and says so wherever it shows.
 */
import {
  hourAt,
  recentRainMm,
  type Forecast,
  type HourForecast,
} from './forecast';
import {isDark, type SunTimes} from './sun';

export const RAIN_CHANCE_PCT = 50;
export const RAIN_MM = 0.2;
export const HEAT_CAUTION_C = 32;
export const HEAT_DANGER_C = 39;
export const COLD_C = 0;
/** Mosquitoes are busiest within this of sunrise and sunset. */
const DAWN_DUSK_MS = 90 * 60_000;
/** WMO codes: freezing drizzle and rain, snow, snow grains and showers. */
const ICY_CODES: ReadonlySet<number> = new Set([
  56, 57, 66, 67, 71, 73, 75, 77, 85, 86,
]);
/** WMO codes: thunderstorm, and thunderstorm with hail. */
const STORM_CODES: ReadonlySet<number> = new Set([95, 96, 99]);

export type HeatLevel = 'none' | 'caution' | 'danger';
export type BugLevel = 'low' | 'medium' | 'high';

export interface Conditions {
  /** A forecast hour covers this time (sun-only otherwise). */
  known: boolean;
  dark: boolean;
  /** Civil dawn that day, for "dark till 06:12". */
  firstLight?: number;
  rain: boolean;
  rainChance?: number;
  /** Thunder. Training in the rain is a choice; lightning is not. */
  storm: boolean;
  tempC?: number;
  feelsC?: number;
  heat: HeatLevel;
  cold: boolean;
  icy: boolean;
  bugs: BugLevel;
}

export function heatLevel(feelsC: number): HeatLevel {
  return feelsC >= HEAT_DANGER_C
    ? 'danger'
    : feelsC >= HEAT_CAUTION_C
    ? 'caution'
    : 'none';
}

/** The bug estimate for one forecast hour. */
export function bugIndex(
  hour: Pick<HourForecast, 'tempC' | 'humidity' | 'windKmh'>,
  context: {recentRainMm: number; nearDawnOrDusk: boolean},
): BugLevel {
  if (hour.tempC < 10) {
    return 'low';
  }
  let score = hour.tempC >= 18 && hour.tempC <= 32 ? 2 : 1;
  score += hour.humidity >= 70 ? 2 : hour.humidity >= 55 ? 1 : 0;
  score += hour.windKmh < 8 ? 1 : hour.windKmh < 15 ? 0 : -2;
  score += context.nearDawnOrDusk ? 1 : 0;
  score += context.recentRainMm >= 5 ? 1 : 0;
  return score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low';
}

export function conditionsAt(
  ts: number,
  input: {forecast?: Forecast; sun?: SunTimes; buggyToday?: boolean},
): Conditions {
  const {forecast, sun, buggyToday = false} = input;
  const dark = sun ? isDark(ts, sun) : false;
  const firstLight = sun?.civilDawn;
  const hour = forecast ? hourAt(forecast, ts) : undefined;
  if (!forecast || !hour) {
    return {
      known: false,
      dark,
      firstLight,
      rain: false,
      storm: false,
      heat: 'none',
      cold: false,
      icy: false,
      bugs: buggyToday ? 'high' : 'low',
    };
  }
  const nearDawnOrDusk =
    sun !== undefined &&
    [sun.sunrise, sun.sunset].some(
      t => t !== undefined && Math.abs(ts - t) <= DAWN_DUSK_MS,
    );
  return {
    known: true,
    dark,
    firstLight,
    rain: hour.rainChance >= RAIN_CHANCE_PCT || hour.rainMm >= RAIN_MM,
    rainChance: hour.rainChance,
    storm: STORM_CODES.has(hour.code),
    tempC: hour.tempC,
    feelsC: hour.feelsC,
    heat: heatLevel(hour.feelsC),
    cold: hour.feelsC <= COLD_C,
    icy: ICY_CODES.has(hour.code),
    bugs: buggyToday
      ? 'high'
      : bugIndex(hour, {
          recentRainMm: recentRainMm(forecast, ts),
          nearDawnOrDusk,
        }),
  };
}
