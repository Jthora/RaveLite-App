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
import {setTrackEnabled} from '../program/repository';
import type {TrackId} from '../program/types';
import {archetypeById, type ArchetypeId} from './archetypes';
import {applyArchetypeToProfile} from './repository';

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
