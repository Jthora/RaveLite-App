/**
 * Sunrise, sunset, first light and season, worked out on the phone from the
 * date and a rough location: no network. Uses the standard sunrise
 * equation (the low-precision solar position NOAA's calculator is built
 * on), good to a minute or two away from the poles.
 */

const DAY_MS = 86_400_000;
const J1970 = 2440587.5;
const J2000 = 2451545;
const RAD = Math.PI / 180;
/** The sun's upper edge on the horizon, allowing for refraction. */
const SUNRISE_ALTITUDE = -0.833;
/** Civil twilight: enough light to see by outside. */
const CIVIL_ALTITUDE = -6;

/** Day length under this reads as a short winter day. */
export const SHORT_DAY_MIN = 600;

export interface SunTimes {
  /** Undefined when the sun doesn't rise or set that day (polar day or night). */
  sunrise?: number;
  sunset?: number;
  /** First light: the sun 6° below the horizon. */
  civilDawn?: number;
  civilDusk?: number;
  solarNoon: number;
  /** Sunrise to sunset in minutes: 0 in polar night, 1440 in polar day. */
  dayLengthMin: number;
}

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

const toJulian = (ms: number) => ms / DAY_MS + J1970;
const fromJulian = (j: number) => Math.round((j - J1970) * DAY_MS);
const sin = (deg: number) => Math.sin(deg * RAD);
const cos = (deg: number) => Math.cos(deg * RAD);
const mod360 = (deg: number) => ((deg % 360) + 360) % 360;

/** Solar transit and the sun's declination for day `n` after J2000. */
function transitFor(n: number, lon: number) {
  const jStar = n - lon / 360;
  const m = mod360(357.5291 + 0.98560028 * jStar);
  const center = 1.9148 * sin(m) + 0.02 * sin(2 * m) + 0.0003 * sin(3 * m);
  const lambda = mod360(m + center + 180 + 102.9372);
  const transit = J2000 + jStar + 0.0053 * sin(m) - 0.0069 * sin(2 * lambda);
  const declination = Math.asin(sin(lambda) * sin(23.4397)) / RAD;
  return {transit, declination};
}

/** Local noon of the day holding `ms`: the day `sunTimes` works out. */
export function localNoon(ms: number): number {
  const d = new Date(ms);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

/** The sun's times for the day whose local noon is `noonMs`. */
export function sunTimes(noonMs: number, lat: number, lon: number): SunTimes {
  // The transit nearest local noon is that day's.
  const base = Math.floor(toJulian(noonMs) - J2000);
  let day = transitFor(base, lon);
  for (const n of [base - 1, base + 1]) {
    const other = transitFor(n, lon);
    if (
      Math.abs(fromJulian(other.transit) - noonMs) <
      Math.abs(fromJulian(day.transit) - noonMs)
    ) {
      day = other;
    }
  }
  const cosHourAngle = (altitude: number) =>
    (sin(altitude) - sin(lat) * sin(day.declination)) /
    (cos(lat) * cos(day.declination));
  const around = (altitude: number): [number, number] | undefined => {
    const x = cosHourAngle(altitude);
    if (x > 1 || x < -1) {
      return undefined;
    }
    const halfDay = Math.acos(x) / RAD / 360;
    return [
      fromJulian(day.transit - halfDay),
      fromJulian(day.transit + halfDay),
    ];
  };
  const up = around(SUNRISE_ALTITUDE);
  const light = around(CIVIL_ALTITUDE);
  return {
    sunrise: up?.[0],
    sunset: up?.[1],
    civilDawn: light?.[0],
    civilDusk: light?.[1],
    solarNoon: fromJulian(day.transit),
    dayLengthMin: up
      ? Math.round((up[1] - up[0]) / 60_000)
      : cosHourAngle(SUNRISE_ALTITUDE) > 1
      ? 0
      : 1440,
  };
}

/** Before first light or after last light. */
export function isDark(ts: number, sun: SunTimes): boolean {
  if (sun.civilDawn === undefined || sun.civilDusk === undefined) {
    return sun.dayLengthMin === 0;
  }
  return ts < sun.civilDawn || ts > sun.civilDusk;
}

const NORTH_SEASONS: readonly Season[] = [
  'winter',
  'winter',
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'autumn',
  'autumn',
  'autumn',
  'winter',
];
const OPPOSITE: Record<Season, Season> = {
  winter: 'summer',
  summer: 'winter',
  spring: 'autumn',
  autumn: 'spring',
};

/** Meteorological season: whole months, flipped south of the equator. */
export function seasonAt(ms: number, lat: number): Season {
  const north = NORTH_SEASONS[new Date(ms).getMonth()];
  return lat >= 0 ? north : OPPOSITE[north];
}
