import {store} from '../../storage';
import {quarantine} from '../diagnostics/quarantine';
import {KEYS} from '../../storage/keys';
import {DAILY_PAR} from '../activity/par';
import {densityFor, parFor, roundsFor} from '../program/density';
import type {DayShapeId} from '../program/types';
import {
  AUTHOR_FACTS,
  DEFAULT_FACTS,
  type Facts,
  type KitItem,
  type Region,
} from './kit';
import {archetypeById, type ArchetypeId} from './archetypes';
import {AUTHOR_PUSHUP_GOAL} from './archetypes';
import {ALL_PACKS, type PackId} from './packs';
import type {StartingPoint} from './starting';
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
import {markRest} from './restDays';
import {myDayRunsOn} from '../ambient/activeHours';

/**
 * Who is using the app, and what they have to train with.
 *
 * An install with nothing stored starts from `DEFAULT_FACTS` — a floor,
 * a wall, a door and a table — and setup asks for the rest. Installs
 * from before the profile existed had the author's kit written down by
 * migration v8, so none of them ever sees this default.
 */

export interface Profile {
  version: 1;
  facts: Facts;
  /**
   * A part of the body that must not be loaded, until cleared by hand.
   * Kept apart from `mode`, so a day off or a festival sits on top of an
   * injury instead of ending it. (Before 22 Sep 2026 an injury was a mode;
   * a stored one still counts — see `loadInjured`.)
   */
  injured?: Region;
  /** When the injury was set, so its days can be marked as rest. */
  injuredAt?: number;
  /** Set once setup has been answered, so it is never shown twice. */
  setUpAt?: number;
  /**
   * Set when setup first opens, alongside the gentle defaults it writes
   * (`setup.beginSetup`). Anything setup leaves unanswered — Skip, Back,
   * a killed app — falls back to those, not to the author's program.
   */
  startedSetupAt?: number;
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
  /** Where the body was starting from, used once to seed the maxes. */
  starting?: StartingPoint;
  /** Push-ups a day, when it has been set by hand. */
  pushupGoal?: number;
  /** When the first-chime tutorial was finished or skipped. */
  taughtAt?: number;
}

export function defaultProfile(): Profile {
  return {version: 1, facts: {...DEFAULT_FACTS, kit: [...DEFAULT_FACTS.kit]}};
}

/** The author's own profile, for installs that predate the profile. */
export function authorProfile(): Profile {
  return {version: 1, facts: structuredCopy(AUTHOR_FACTS)};
}

const structuredCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

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
  } catch (e) {
    quarantine(KEYS.profile, raw, e);
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
  if (id === 'injured') {
    if (opts.region) {
      setInjury(opts.region, now);
    }
    return;
  }
  const mode = buildMode(id, now, opts);
  if (mode) {
    // The mode being replaced has its days written down first.
    noteRestDays(now);
    const profile = loadProfile();
    // A hurt mode from before injuries stacked is carried over, not lost.
    const injured = profile.injured ?? injuredRegion(profile.mode);
    saveProfile({...profile, mode, ...(injured ? {injured} : {})});
  }
}

/** End the mode. An injury stays until it is cleared on its own. */
export function clearMode(now: number = Date.now()): void {
  noteRestDays(now);
  const profile = loadProfile();
  saveProfile({...profile, mode: undefined});
}

/** A hurt mode stored before injuries stacked, read as the injury. */
const withoutOldHurtMode = (mode: Mode | undefined) =>
  mode?.id === 'injured' ? undefined : mode;

/** Protect a part of the body until it is cleared by hand. */
export function setInjury(region: Region, now: number = Date.now()): void {
  const profile = loadProfile();
  saveProfile({
    ...profile,
    injured: region,
    injuredAt: profile.injured ? profile.injuredAt ?? now : now,
    mode: withoutOldHurtMode(profile.mode),
  });
  noteRestDays(now);
}

export function clearInjury(now: number = Date.now()): void {
  noteRestDays(now);
  const profile = loadProfile();
  saveProfile({
    ...profile,
    injured: undefined,
    injuredAt: undefined,
    mode: withoutOldHurtMode(profile.mode),
  });
}

/**
 * Write down which days are rest — the mode's days, the injury's days and
 * a day My day is off — so the ramp, the streak and attribute decay read
 * them as rest after the mode has gone. Cheap to call often; it only
 * writes when something new is marked.
 */
export function noteRestDays(now: number = Date.now()): void {
  const profile = loadProfile();
  const mode = profile.mode;
  if (mode && mode.startedAt <= now) {
    markRest(mode.id, mode.startedAt, Math.min(now, mode.expiresAt ?? now));
  }
  if (profile.injured) {
    markRest('injured', profile.injuredAt ?? now, now);
  }
  if (!myDayRunsOn(new Date(now))) {
    markRest('day-off', now, now);
  }
}

/**
 * What the program should assume about this person's kit and room —
 * already under whatever mode is running, so every caller that asks what
 * can be done here gets the hotel room without knowing modes exist.
 */
export function loadFacts(now: number = Date.now()): Facts {
  const profile = loadProfile();
  const injured = loadInjured(now);
  return factsUnder(
    {...profile.facts, packs: loadPacks(), ...(injured ? {injured} : {})},
    loadMode(now),
  );
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

/** Push-ups a day for somebody who set up without an archetype. */
export const GENTLE_PUSHUP_GOAL = 100;

/**
 * Push-ups a day to aim at.
 *
 * Falls back through the archetype. Somebody who went through setup
 * without one gets 100. An install from before setup keeps 200 — the
 * number this app was written around — so nothing moves for anyone who
 * was already training toward it.
 *
 * The archetype's number is a fallback, not an override: taking one later
 * does not undo a goal set by hand. Packs and the day shape *are* what an
 * archetype is, so those get rewritten; this is a number somebody chose.
 */
export function loadPushupGoal(): number {
  const profile = loadProfile();
  if (profile.pushupGoal !== undefined) {
    return profile.pushupGoal;
  }
  const archetype = profile.archetype
    ? archetypeById(profile.archetype)
    : undefined;
  if (archetype) {
    return archetype.pushupGoal;
  }
  return profile.startedSetupAt !== undefined
    ? GENTLE_PUSHUP_GOAL
    : AUTHOR_PUSHUP_GOAL;
}

export function setPushupGoal(reps: number): void {
  saveProfile({...loadProfile(), pushupGoal: Math.max(1, Math.round(reps))});
}

/** Where the body was starting from, if anyone said. */
export function loadStarting(): StartingPoint | undefined {
  return loadProfile().starting;
}

/**
 * Record where you are starting. The policy about *when* this may still
 * be answered lives in `setup.ts`, which can see the program too — this
 * only writes it down.
 */
export function setStarting(starting: StartingPoint): void {
  saveProfile({...loadProfile(), starting});
}

/** Whether anything has ever been logged on this install. */
export function hasHistory(): boolean {
  return hasAnyHistory();
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
  return loadProfile().injured ?? injuredRegion(loadMode(now));
}

/** Whether Daily Sets ask for anything today. */
export function trainsToday(now: number = Date.now()): boolean {
  return trainsUnder(loadMode(now));
}

/** Whether the ramp should stop reading today as a verdict. */
export function rampIsPaused(now: number = Date.now()): boolean {
  return rampPaused(loadMode(now)) || loadInjured(now) !== undefined;
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
export function hasAnyHistory(): boolean {
  const entries = store.getString(KEYS.trainingEntries);
  if (entries !== undefined && entries !== '[]') {
    return true;
  }
  return store.keysWithPrefix(KEYS.journalPrefix).length > 0;
}

export function needsSetup(): boolean {
  const profile = loadProfile();
  if (profile.setUpAt !== undefined) {
    return false;
  }
  if (profile.startedSetupAt !== undefined) {
    // Setup opened and was never finished — the app was closed part way.
    // Chimes may have fired since, so only something the person did
    // counts as a reason to stay away.
    return !hasAnswered();
  }
  if (store.getString(KEYS.profile) !== undefined) {
    return false;
  }
  return !hasAnyHistory();
}

/** How long someone counts as new: the tiles are named, and so on. */
export const NEW_FOR_MS = 14 * 86_400_000;

/** Whether this person finished setup less than two weeks ago. */
export function isNewcomer(now: number = Date.now()): boolean {
  const at = loadProfile().setUpAt;
  return at !== undefined && now - at < NEW_FOR_MS;
}

/** Mark setup answered, so it is never shown again. */
export function finishSetup(now: number = Date.now()): void {
  saveProfile({...loadProfile(), setUpAt: now});
}

/**
 * Whether the three taps still need teaching.
 *
 * Only ever offered to somebody who has just finished setup, and only
 * while they have not answered a chime yet — the moment they answer one
 * unaided, the lesson has been learnt and showing it would be a lecture.
 */
export function needsTutorial(): boolean {
  const profile = loadProfile();
  if (profile.taughtAt !== undefined || profile.setUpAt === undefined) {
    return false;
  }
  return !hasAnswered();
}

/**
 * Whether the person has done something, as opposed to the app having
 * done something.
 *
 * `hasAnyHistory` counts any trace at all, which is right for setup —
 * there, being wrong means showing a first-run screen to somebody with a
 * year of training, so anything at all is reason enough to stay away. It
 * is wrong here, because firing the tutorial's own chime writes a
 * `reminder.fired` entry: the lesson would switch itself off by starting.
 */
/** Whether the person has logged or answered anything themselves. */
export function hasAnsweredAnything(): boolean {
  return hasAnswered();
}

function hasAnswered(): boolean {
  const entries = store.getString(KEYS.trainingEntries);
  if (entries !== undefined && entries !== '[]') {
    return true;
  }
  return store
    .keysWithPrefix(KEYS.journalPrefix)
    .some(key => (store.getString(key) ?? '').includes('"completion"'));
}

export function finishTutorial(now: number = Date.now()): void {
  saveProfile({...loadProfile(), taughtAt: now});
}

/** Only for tests: forget what was read. */
export function __resetProfileCache(): void {
  cached = undefined;
}
