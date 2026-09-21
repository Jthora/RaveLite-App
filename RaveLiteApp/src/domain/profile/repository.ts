import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {DAILY_PAR} from '../activity/par';
import {densityFor, parFor, roundsFor} from '../program/density';
import type {DayShapeId} from '../program/types';
import {AUTHOR_FACTS, type Facts, type Region} from './kit';

/**
 * Who is using the app, and what they have to train with.
 *
 * Until the setup flow lands, an install with nothing stored is assumed
 * to be the author's — the app was his before it was anyone's, and that
 * keeps every existing install exactly as it was. When setup arrives,
 * a fresh install will start from `DEFAULT_FACTS` and ask instead.
 */

export interface Profile {
  version: 1;
  facts: Facts;
  /** A temporary override: an injury that must not be loaded. */
  injured?: Region;
  /** Set once setup has been answered, so it is never shown twice. */
  setUpAt?: number;
  /** How much day there is to train in. See `program/density.ts`. */
  shape?: DayShapeId;
  /** Rounds, when `shape` is 'custom'. */
  customRounds?: number;
}

export function defaultProfile(): Profile {
  return {version: 1, facts: {...AUTHOR_FACTS, kit: [...AUTHOR_FACTS.kit]}};
}

let cached: Profile | undefined;

export function loadProfile(): Profile {
  if (cached) {
    return cached;
  }
  const raw = store.getString(KEYS.profile);
  if (!raw) {
    cached = defaultProfile();
    return cached;
  }
  try {
    const parsed = JSON.parse(raw) as Profile;
    cached = {...defaultProfile(), ...parsed};
  } catch {
    cached = defaultProfile();
  }
  return cached;
}

const listeners = new Set<() => void>();

export function saveProfile(profile: Profile): void {
  cached = profile;
  store.set(KEYS.profile, JSON.stringify(profile));
  for (const listener of listeners) {
    try {
      listener();
    } catch (e) {
      console.warn('[profile] listener threw', e);
    }
  }
}

export function subscribeProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** What the program should assume about this person's kit and room. */
export function loadFacts(): Facts {
  return loadProfile().facts;
}

export function setFacts(facts: Facts): void {
  saveProfile({...loadProfile(), facts});
}

/**
 * How much day there is. Everything that sizes a day goes through here,
 * rather than reading a constant, so one answer in setup reaches the
 * prescription, the chimes and the score together.
 *
 * An install that has never been asked is the author's desk day, which is
 * what every constant in the app was written for — so nothing moves until
 * someone says otherwise.
 */
export function loadShape(): DayShapeId {
  return loadProfile().shape ?? 'desk';
}

export function setShape(shape: DayShapeId, customRounds?: number): void {
  saveProfile({...loadProfile(), shape, customRounds});
}

/** This person's share of a full day, 0–1. */
export function dayDensity(): number {
  const profile = loadProfile();
  return densityFor(profile.shape ?? 'desk', profile.customRounds);
}

/** Chimes this day can carry. */
export function dayRounds(): number {
  const profile = loadProfile();
  return roundsFor(profile.shape ?? 'desk', profile.customRounds);
}

/** Points an element aims for today. */
export function dailyPar(): number {
  return parFor(dayDensity(), DAILY_PAR);
}

/** Only for tests: forget what was read. */
export function __resetProfileCache(): void {
  cached = undefined;
}
