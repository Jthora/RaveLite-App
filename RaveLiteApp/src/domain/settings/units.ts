/**
 * Miles or kilometres, Fahrenheit or Celsius, feet or centimetres.
 *
 * The app was written in one country and quietly assumed it: distances in
 * miles, height in inches, and a temperature line that had a `TempUnits`
 * type nobody ever passed, so everybody saw Celsius whatever they thought
 * in. Neither is a default so much as an accident.
 *
 * Two rules here.
 *
 * **Guess, don't ask.** The phone knows the country. A units question in
 * setup is a question the app could have answered itself, and every one
 * of those is a small insult.
 *
 * **Never move the ground under somebody already standing on it.** An
 * install that predates this setting keeps exactly what it was showing,
 * because waking up to a number that means something different is worse
 * than a number in the units you would not have picked. The guess only
 * applies to installs that have not been running.
 */
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {METERS_PER_MILE} from '../../lib/constants';
import type {TempUnits} from '../conditions/format';

export type UnitSystem = 'metric' | 'imperial';

/**
 * The three countries that use imperial for everyday measures. The UK is
 * deliberately not here: road distances are miles but weather is Celsius
 * and a person's height is feet — no single system fits, and "metric with
 * miles" is a mess this app does not need to model.
 */
const IMPERIAL_COUNTRIES: ReadonlySet<string> = new Set(['US', 'LR', 'MM']);

/** What the app showed before it could be asked. */
export const LEGACY_UNITS: UnitSystem = 'metric';

export function unitsForCountry(country: string | undefined): UnitSystem {
  return country && IMPERIAL_COUNTRIES.has(country.toUpperCase())
    ? 'imperial'
    : 'metric';
}

export function loadUnits(): UnitSystem {
  const stored = store.getString(KEYS.units);
  return stored === 'imperial' || stored === 'metric' ? stored : LEGACY_UNITS;
}

export function setUnits(units: UnitSystem): void {
  store.set(KEYS.units, units);
}

/** True once anybody or anything has decided, so a guess must not overwrite. */
export function unitsChosen(): boolean {
  return store.getString(KEYS.units) !== undefined;
}

export const tempUnits = (units: UnitSystem = loadUnits()): TempUnits =>
  units === 'imperial' ? 'F' : 'C';

const METERS_PER_KM = 1000;
const CM_PER_INCH = 2.54;

/** "3.1 mi" or "5.0 km". */
export function formatDistance(
  meters: number,
  units: UnitSystem = loadUnits(),
): string {
  if (units === 'imperial') {
    return `${(meters / METERS_PER_MILE).toFixed(1)} mi`;
  }
  return `${(meters / METERS_PER_KM).toFixed(1)} km`;
}

/** "5 ft 10 in" or "178 cm", from the height the app stores in inches. */
export function formatHeight(
  inches: number,
  units: UnitSystem = loadUnits(),
): string {
  if (units === 'imperial') {
    const feet = Math.floor(inches / 12);
    const rest = Math.round(inches - feet * 12);
    return `${feet} ft ${rest} in`;
  }
  return `${Math.round(inches * CM_PER_INCH)} cm`;
}

/** What to ask for when somebody types their height. */
export function heightUnitLabel(units: UnitSystem = loadUnits()): string {
  return units === 'imperial' ? 'inches' : 'centimetres';
}

/** Their typed height, back to the inches the app stores. */
export function heightToInches(
  value: number,
  units: UnitSystem = loadUnits(),
): number {
  return units === 'imperial' ? value : value / CM_PER_INCH;
}

/**
 * Guess the units from the phone, once, and only for an install that has
 * not been running. It writes nothing if anybody has already chosen, and
 * nothing for an install with a history — waking up to a number that
 * means something different is worse than one in units you would not
 * have picked.
 *
 * `seedTemperature` is handed in rather than imported so this module
 * stays out of the weather's business: temperature has had its own C/F
 * toggle since before units existed, and that toggle stays the truth for
 * temperature. This only sets what it starts at.
 */
export async function guessUnitsOnce(
  fresh: boolean,
  read: () => Promise<{country: string} | null>,
  seedTemperature?: (units: TempUnits) => void,
): Promise<UnitSystem> {
  if (unitsChosen() || !fresh) {
    return loadUnits();
  }
  const locale = await read();
  const guess = unitsForCountry(locale?.country);
  setUnits(guess);
  seedTemperature?.(tempUnits(guess));
  return guess;
}
