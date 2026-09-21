import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {DAILY_PAR} from '../activity/par';
import {densityFor, parFor, roundsFor} from '../program/density';
import type {DayShapeId} from '../program/types';
import {AUTHOR_FACTS, type Facts, type KitItem, type Region} from './kit';
import {archetypeById, type ArchetypeId} from './archetypes';
import {ALL_PACKS, type PackId} from './packs';
import {
  activeMode,
  densityUnder,
  factsUnder,
  injuredRegion,
  rampPaused,
  startMode as buildMode,
  trainsUnder,
  type Mode,
  type ModeId,
} from './mode';

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
  /** What is true right now, over the top of the rest. See `mode.ts`. */
  mode?: Mode;
  /** Which curricula this person carries. Absent means all of them. */
  packs?: PackId[];
  /** Where this program started. Changing anything else does not clear it. */
  archetype?: ArchetypeId;
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

/**
 * The mode in force, or undefined. Expiry is read, never written: a mode
 * that has run out simply stops answering, so no timer has to fire and a
 * phone that was off all weekend still comes back to the right day.
 */
export function loadMode(now: number = Date.now()): Mode | undefined {
  return activeMode(loadProfile().mode, now);
}

export function setMode(
  id: ModeId,
  opts: {region?: Region; kit?: KitItem[]} = {},
  now: number = Date.now(),
): void {
  const mode = buildMode(id, now, opts);
  if (mode) {
    saveProfile({...loadProfile(), mode});
  }
}

export function clearMode(): void {
  const profile = loadProfile();
  saveProfile({...profile, mode: undefined});
}

/**
 * What the program should assume about this person's kit and room —
 * already under whatever mode is running, so every caller that asks what
 * can be done here gets the hotel room without knowing modes exist.
 */
export function loadFacts(now: number = Date.now()): Facts {
  const profile = loadProfile();
  return factsUnder({...profile.facts, packs: loadPacks()}, loadMode(now));
}

/**
 * The curricula this person carries. An install that has never been asked
 * carries all of them, which is the app as it was before packs existed.
 */
export function loadPacks(): PackId[] {
  return loadProfile().packs ?? [...ALL_PACKS];
}

export function setPacks(packs: readonly PackId[]): void {
  saveProfile({...loadProfile(), packs: [...packs]});
}

/** Where this program started, if anyone said. */
export function loadArchetype(): ArchetypeId | undefined {
  return loadProfile().archetype;
}

/**
 * The profile half of taking an archetype — packs and the day shape. The
 * tracks are turned off by `setup.ts`, which is the one module allowed to
 * reach both here and into the program (this file must not import the
 * program: the program already imports this one).
 */
export function applyArchetypeToProfile(id: ArchetypeId): void {
  const archetype = archetypeById(id);
  if (!archetype) {
    return;
  }
  saveProfile({
    ...loadProfile(),
    archetype: id,
    packs: [...archetype.packs],
    shape: archetype.shape,
    customRounds: undefined,
  });
}

/** What the room is really like, with no mode over the top. */
export function baseFacts(): Facts {
  return loadProfile().facts;
}

/** A part of the body nothing may load today. */
export function loadInjured(now: number = Date.now()): Region | undefined {
  return injuredRegion(loadMode(now)) ?? loadProfile().injured;
}

/** Whether Daily Sets ask for anything today. */
export function trainsToday(now: number = Date.now()): boolean {
  return trainsUnder(loadMode(now));
}

/** Whether the ramp should stop reading today as a verdict. */
export function rampIsPaused(now: number = Date.now()): boolean {
  return rampPaused(loadMode(now));
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
export function dayDensity(now: number = Date.now()): number {
  const profile = loadProfile();
  return densityUnder(
    densityFor(profile.shape ?? 'desk', profile.customRounds),
    loadMode(now),
  );
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

/**
 * Whether this install has never been used by anybody.
 *
 * Deliberately paranoid, because showing setup to someone with a year of
 * training would be the worst bug this app could have: it asks for a
 * stored profile *and* an unanswered setup *and* nothing ever logged. Any
 * one of those being wrong still leaves the other two guarding the door.
 */
function hasAnyHistory(): boolean {
  const entries = store.getString(KEYS.trainingEntries);
  if (entries !== undefined && entries !== '[]') {
    return true;
  }
  return store.keysWithPrefix(KEYS.journalPrefix).length > 0;
}

export function needsSetup(): boolean {
  if (loadProfile().setUpAt !== undefined) {
    return false;
  }
  if (store.getString(KEYS.profile) !== undefined) {
    return false;
  }
  return !hasAnyHistory();
}

/** Mark setup answered, so it is never shown again. */
export function finishSetup(now: number = Date.now()): void {
  saveProfile({...loadProfile(), setUpAt: now});
}

/** Only for tests: forget what was read. */
export function __resetProfileCache(): void {
  cached = undefined;
}
