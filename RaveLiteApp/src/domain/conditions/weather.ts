/**
 * Weather — where the operator is, the cached forecast, and what it's like
 * outside at a given time, for chimes and Today.
 *
 * Reads are synchronous: storage plus cheap sun math. The forecast
 * refreshes from Open-Meteo when it's over three hours old, checked every
 * 15 minutes while the app runs and whenever it comes to the front.
 * Offline, the last forecast stays in use until it runs out, and sunrise
 * needs no network at all.
 */
import {AppState, PermissionsAndroid, Platform} from 'react-native';

import {
  getCoarseLocation,
  isLocationEnabled,
} from '../../native/raveLiteDevice';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import type {Exercise} from '../exercises/types';
import {plannedDrill} from '../program/morning';
import type {CadenceSlot, Plan, Window} from '../reminders/types';
import {localDayKey} from '../training/grading';
import {DEFAULT_WEATHER_PREFS, adaptDrill, type WeatherPrefs} from './adapt';
import {
  conditionsAt,
  heatLevel,
  type Conditions,
  type HeatLevel,
} from './conditions';
import {forecastUrl, parseForecast, type Forecast} from './forecast';
import {withHeatWaterCalls} from './heatWater';
import {
  parsePlaces,
  placeSearchUrl,
  planSearch,
  rankPlaces,
  roundCoord,
  type Place,
  type PlaceResult,
} from './location';
import {localNoon, sunTimes, type SunTimes} from './sun';

export const FORECAST_MAX_AGE_MS = 3 * 60 * 60_000;
const REFRESH_CHECK_MS = 15 * 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const DAY_MS = 86_400_000;
const HEAT_RANK: Record<HeatLevel, number> = {none: 0, caution: 1, danger: 2};

type Listener = () => void;
const listeners = new Set<Listener>();

/** The place, the forecast or a weather setting changed. */
export function subscribeWeather(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function readJson<T>(key: string): T | undefined {
  const raw = store.getString(key);
  if (raw === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

// ── Place ─────────────────────────────────────────────────────────────

export function getPlace(): Place | undefined {
  return readJson<Place>(KEYS.weatherPlace);
}

/** Save a place, rounded to about 10 km, and fetch its forecast. */
export function setPlace(
  input: Omit<Place, 'setAt'>,
  now: number = Date.now(),
): Place {
  const place: Place = {
    ...input,
    lat: roundCoord(input.lat),
    lon: roundCoord(input.lon),
    setAt: now,
  };
  store.set(KEYS.weatherPlace, JSON.stringify(place));
  notify();
  refreshForecast({force: true, now}).catch(() => undefined);
  return place;
}

export function clearPlace(): void {
  store.delete(KEYS.weatherPlace);
  store.delete(KEYS.weatherForecast);
  notify();
}

// ── Settings ──────────────────────────────────────────────────────────

export function getWeatherPrefs(): WeatherPrefs {
  return {
    ...DEFAULT_WEATHER_PREFS,
    ...readJson<Partial<WeatherPrefs>>(KEYS.weatherPrefs),
  };
}

export function setWeatherPrefs(patch: Partial<WeatherPrefs>): WeatherPrefs {
  const next = {...getWeatherPrefs(), ...patch};
  store.set(KEYS.weatherPrefs, JSON.stringify(next));
  notify();
  return next;
}

/** The operator said the yard is buggy on `ts`'s day. */
export function isBuggyDay(ts: number): boolean {
  return store.getString(KEYS.weatherBuggyDay) === localDayKey(ts);
}

export function setBuggyToday(on: boolean, now: number = Date.now()): void {
  if (on) {
    store.set(KEYS.weatherBuggyDay, localDayKey(now));
  } else {
    store.delete(KEYS.weatherBuggyDay);
  }
  notify();
}

// ── Forecast ──────────────────────────────────────────────────────────

let parsed: {raw: string; forecast?: Forecast} | undefined;

/** The cached forecast for the saved place, however old. */
export function getForecast(): Forecast | undefined {
  const raw = store.getString(KEYS.weatherForecast);
  if (raw === undefined) {
    return undefined;
  }
  if (parsed?.raw !== raw) {
    let forecast: Forecast | undefined;
    try {
      forecast = JSON.parse(raw) as Forecast;
    } catch {
      forecast = undefined;
    }
    parsed = {raw, forecast};
  }
  const place = getPlace();
  const forecast = parsed.forecast;
  return forecast &&
    place &&
    forecast.lat === place.lat &&
    forecast.lon === place.lon
    ? forecast
    : undefined;
}

async function fetchJson(
  url: string,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {signal: controller.signal});
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export type RefreshResult = 'updated' | 'fresh' | 'no-place' | 'failed';

export interface FetchReport {
  at: number;
  ok: boolean;
  /** Why it failed, in the operator's words. */
  why?: string;
}

const REPORT_KEY = KEYS.setting('weather.lastFetch');

/** What happened the last time the app went looking for a forecast. */
export function getFetchReport(): FetchReport | undefined {
  return readJson<FetchReport>(REPORT_KEY);
}

function report(at: number, ok: boolean, why?: string): void {
  store.set(REPORT_KEY, JSON.stringify({at, ok, ...(why ? {why} : {})}));
}

/** A thrown fetch error, said plainly. */
function reasonFor(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/abort/i.test(message)) {
    return 'the forecast took too long to answer';
  }
  if (/^HTTP 4/.test(message)) {
    return `the forecast service refused the request (${message})`;
  }
  if (/^HTTP 5/.test(message)) {
    return `the forecast service is having trouble (${message})`;
  }
  if (/network|failed to fetch|request failed/i.test(message)) {
    return 'no connection';
  }
  return message || 'something went wrong';
}

let inFlight: Promise<RefreshResult> | undefined;

/** Fetch the forecast when it's stale (or always, with `force`). Never throws. */
export function refreshForecast(
  opts: {force?: boolean; now?: number; fetchImpl?: typeof fetch} = {},
): Promise<RefreshResult> {
  const {force = false, now = Date.now()} = opts;
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const place = getPlace();
  if (!place) {
    return Promise.resolve('no-place');
  }
  if (!fetchImpl) {
    return Promise.resolve('failed');
  }
  const current = getForecast();
  if (!force && current && now - current.fetchedAt < FORECAST_MAX_AGE_MS) {
    return Promise.resolve('fresh');
  }
  if (inFlight) {
    return inFlight;
  }
  const request = (async (): Promise<RefreshResult> => {
    try {
      const json = await fetchJson(
        forecastUrl(place.lat, place.lon),
        fetchImpl,
      );
      const forecast = parseForecast(json, place, now);
      const latest = getPlace();
      if (
        !forecast ||
        !latest ||
        latest.lat !== place.lat ||
        latest.lon !== place.lon
      ) {
        report(
          now,
          false,
          forecast
            ? 'the place changed mid-fetch'
            : 'the forecast made no sense',
        );
        notify();
        return 'failed';
      }
      store.set(KEYS.weatherForecast, JSON.stringify(forecast));
      report(now, true);
      notify();
      return 'updated';
    } catch (error) {
      report(now, false, reasonFor(error));
      notify();
      return 'failed';
    } finally {
      inFlight = undefined;
    }
  })();
  inFlight = request;
  return request;
}

/**
 * Towns matching `query`. Throws when the search can't be reached.
 *
 * The API matches on the name alone, so "Swansea IL" is tried as typed,
 * then as "Swansea" with Illinois as the hint that sorts what comes back.
 */
export async function searchPlaces(
  query: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<PlaceResult[]> {
  const {terms, hint} = planSearch(query);
  for (const term of terms) {
    const found = parsePlaces(await fetchJson(placeSearchUrl(term), fetchImpl));
    if (found.length > 0) {
      return rankPlaces(found, hint);
    }
  }
  return [];
}

export type DetectResult =
  | {ok: true; place: Place}
  | {ok: false; reason: 'denied' | 'unavailable' | 'off'};

/** Ask for coarse location once, and save where the phone is. */
export async function detectPlace(
  now: number = Date.now(),
): Promise<DetectResult> {
  if (Platform.OS !== 'android') {
    return {ok: false, reason: 'unavailable'};
  }
  const answer = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    {
      title: 'Your rough location',
      message:
        'RaveLite uses it for sunrise and the forecast, rounded to about 10 km.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );
  if (answer !== PermissionsAndroid.RESULTS.GRANTED) {
    return {ok: false, reason: 'denied'};
  }
  const fix = await getCoarseLocation();
  if (!fix) {
    // A granted permission still gives nothing while the phone's location
    // switch is off, and that needs different advice.
    return {
      ok: false,
      reason: (await isLocationEnabled()) ? 'unavailable' : 'off',
    };
  }
  const place = setPlace(
    {
      name: fix.place ?? 'Your location',
      lat: fix.latitude,
      lon: fix.longitude,
      source: 'detected',
    },
    now,
  );
  return {ok: true, place};
}

// ── What it's like outside ───────────────────────────────────────────

/** Conditions at `ts`; undefined until a place is saved. */
export function conditionsFor(ts: number): Conditions | undefined {
  const place = getPlace();
  if (!place) {
    return undefined;
  }
  return conditionsAt(ts, {
    forecast: getForecast(),
    sun: sunTimes(localNoon(ts), place.lat, place.lon),
    buggyToday: isBuggyDay(ts),
  });
}

/**
 * A plan chime's drill, bent to the conditions at its time, with why. With
 * its window, a Morning Session chime takes its piece of the day's block,
 * and `detail` says which.
 */
export function drillForPlanChime(
  slot: CadenceSlot | undefined,
  pulseId: string,
  ts: number,
  window?: Window,
): {drill?: Exercise; note?: string; detail?: string} {
  if (!slot) {
    return {};
  }
  const {drill: planned, detail} = plannedDrill(slot, window, pulseId, ts);
  const withDetail = detail ? {detail} : {};
  const conditions = planned ? conditionsFor(ts) : undefined;
  if (!planned || !conditions) {
    return {drill: planned, ...withDetail};
  }
  const {drill, note} = adaptDrill(
    planned,
    conditions,
    getWeatherPrefs(),
    pulseId,
  );
  return {drill, note, ...withDetail};
}

/** The plan with hot-day water calls for today and tomorrow. */
export function planWithWeather(plan: Plan, now: number = Date.now()): Plan {
  if (!getForecast()) {
    return plan;
  }
  return withHeatWaterCalls(plan, ts => conditionsFor(ts)?.heat ?? 'none', now);
}

/** The hottest band any of today's forecast hours reach. */
export function hottestFeelsToday(
  now: number = Date.now(),
): number | undefined {
  const forecast = getForecast();
  if (!forecast) {
    return undefined;
  }
  const today = localDayKey(now);
  let hottest: number | undefined;
  for (const hour of forecast.hours) {
    if (
      localDayKey(hour.ts) === today &&
      (hottest === undefined || hour.feelsC > hottest)
    ) {
      hottest = hour.feelsC;
    }
  }
  return hottest;
}

export function hottestToday(now: number = Date.now()): HeatLevel {
  const forecast = getForecast();
  if (!forecast) {
    return 'none';
  }
  const today = localDayKey(now);
  let hottest: HeatLevel = 'none';
  for (const hour of forecast.hours) {
    const level = heatLevel(hour.feelsC);
    if (
      localDayKey(hour.ts) === today &&
      HEAT_RANK[level] > HEAT_RANK[hottest]
    ) {
      hottest = level;
    }
  }
  return hottest;
}

export interface WeatherLine {
  place: Place;
  units: WeatherPrefs['units'];
  sun: SunTimes;
  /** The next sunrise or sunset. */
  next?: {kind: 'sunrise' | 'sunset'; at: number};
  /** Right now; `known` is false without a forecast for this hour. */
  conditions: Conditions;
}

/** What Today's conditions line shows; undefined until a place is saved. */
export function weatherLine(now: number = Date.now()): WeatherLine | undefined {
  const place = getPlace();
  const conditions = conditionsFor(now);
  if (!place || !conditions) {
    return undefined;
  }
  const sun = sunTimes(localNoon(now), place.lat, place.lon);
  let next: WeatherLine['next'];
  if (sun.sunrise !== undefined && now < sun.sunrise) {
    next = {kind: 'sunrise', at: sun.sunrise};
  } else if (sun.sunset !== undefined && now < sun.sunset) {
    next = {kind: 'sunset', at: sun.sunset};
  } else {
    const tomorrow = sunTimes(localNoon(now + DAY_MS), place.lat, place.lon);
    next =
      tomorrow.sunrise !== undefined
        ? {kind: 'sunrise', at: tomorrow.sunrise}
        : undefined;
  }
  return {place, units: getWeatherPrefs().units, sun, next, conditions};
}

// ── Refresh loop ──────────────────────────────────────────────────────

let timer: ReturnType<typeof setInterval> | null = null;
let appStateSub: {remove: () => void} | null = null;

/** Keep the forecast fresh while the app runs. Idempotent. */
export function startWeather(): void {
  if (timer !== null) {
    return;
  }
  const refresh = () => {
    refreshForecast().catch(() => undefined);
  };
  refresh();
  timer = setInterval(refresh, REFRESH_CHECK_MS);
  appStateSub = AppState.addEventListener('change', state => {
    if (state === 'active') {
      refresh();
    }
  });
}

export function stopWeather(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  appStateSub?.remove();
  appStateSub = null;
}
