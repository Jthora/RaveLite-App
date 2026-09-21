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
import type {TrackId} from '../program/types';
import {archetypeById, type ArchetypeId} from './archetypes';
import {applyArchetypeToProfile, hasHistory, setStarting} from './repository';
import {seededMax, startingFactor, type StartingPoint} from './starting';

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
