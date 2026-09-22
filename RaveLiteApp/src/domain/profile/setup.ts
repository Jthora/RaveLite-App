/**
 * Taking an archetype, all of it.
 *
 * This is the only module that reaches into both the profile and the
 * program. It has to be: an archetype answers questions that live in both
 * places, and the program already imports the profile, so the profile
 * cannot import the program back without a cycle — the kind that shows up
 * at runtime as a module being undefined and nowhere near the cause.
 *
 * What it writes is exactly what the panels write. An archetype is where
 * a program starts, not a mode it stays in: every dial it moved is
 * visible in Settings afterwards, and changing one is an ordinary edit.
 */
import {TRACKS} from '../program/tracks';
import {loadProgram, saveProgram, setTrackEnabled} from '../program/repository';
import type {DayShapeId, TrackId} from '../program/types';
import {archetypeById, type ArchetypeId} from './archetypes';
import {
  applyArchetypeToProfile,
  hasHistory,
  loadProfile,
  loadStarting,
  saveProfile,
  setStarting,
} from './repository';
import {seededMax, startingFactor, type StartingPoint} from './starting';

/** Six chimes a day, where the author's desk day has nine. */
export const GENTLE_SHAPE: DayShapeId = 'office';

export function applyArchetype(id: ArchetypeId): void {
  const archetype = archetypeById(id);
  if (!archetype) {
    return;
  }
  applyArchetypeToProfile(id);

  // Subtraction, not a whitelist: a track added to the app later turns up
  // in every archetype rather than silently in none of them.
  const off = new Set<TrackId>(archetype.tracksOff ?? []);
  for (const track of TRACKS) {
    setTrackEnabled(track.id, !off.has(track.id));
  }
}

/**
 * Say where you are starting, and re-seed the maxes from it.
 *
 * The re-seed is the whole point. Merely reading the program — which the
 * setup preview does on its first render, before this question is even
 * asked — writes a seeded program to storage, so waiting until the first
 * seed to apply the answer means the answer never applies. Instead the
 * numbers are rewritten whenever they are still nobody's.
 *
 * Refused once anything has been logged: by then those numbers have been
 * trained against and a max test is the honest way to change them.
 */
export function chooseStarting(id: StartingPoint): boolean {
  if (hasHistory()) {
    return false;
  }
  setStarting(id);
  const factor = startingFactor(id);
  const program = loadProgram();
  const tracks = {...program.tracks};
  for (const track of TRACKS) {
    const state = tracks[track.id];
    if (state) {
      tracks[track.id] = {
        ...state,
        testMax: seededMax(track.defaultMax, factor),
      };
    }
  }
  saveProgram({...program, tracks});
  return true;
}

/**
 * What setup starts from, written the moment it opens.
 *
 * The base program only (no packs), a day with fewer chimes than the
 * author's desk day, and a beginner's numbers. So Skip, Back, a killed
 * app or a question left alone all leave somebody on a gentle start,
 * not on the program this app was written for. Every one of these is an
 * ordinary answer: the panels show it, and changing it is one tap.
 *
 * Runs once. An install that has been used, or that finished setup, is
 * left alone.
 */
export function beginSetup(now: number = Date.now()): void {
  const profile = loadProfile();
  if (
    profile.startedSetupAt !== undefined ||
    profile.setUpAt !== undefined ||
    hasHistory()
  ) {
    return;
  }
  saveProfile({
    ...profile,
    startedSetupAt: now,
    packs: profile.packs ?? [],
    shape: profile.shape ?? GENTLE_SHAPE,
  });
  if (loadStarting() === undefined) {
    chooseStarting('new');
  }
}
