/**
 * Taking an archetype rewrites packs, the day's shape and every track's
 * enabled flag. Somebody trying them out does that a dozen times, so
 * nothing may accumulate, and taking one twice must mean the same as
 * taking it once.
 */
import {store} from '../../../storage';
import {TRACKS} from '../../program/tracks';
import {loadProgram} from '../../program/repository';
import {archetypeById, type ArchetypeId} from '../archetypes';
import {blockPhase} from '../blocks';
import {__resetProfileCache, loadPacks, loadProfile} from '../repository';
import {applyArchetype} from '../setup';

const NOW = new Date(2026, 9, 5, 12).getTime();
const DAY = 86_400_000;

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

const enabledTracks = () =>
  TRACKS.filter(t => loadProgram().tracks[t.id].enabled)
    .map(t => t.id)
    .sort();

function matchesArchetype(id: ArchetypeId) {
  const archetype = archetypeById(id)!;
  const off = new Set(archetype.tracksOff ?? []);
  expect([...loadPacks()].sort()).toEqual([...archetype.packs].sort());
  expect(enabledTracks()).toEqual(
    TRACKS.filter(t => !off.has(t.id))
      .map(t => t.id)
      .sort(),
  );
  expect(loadProfile().shape).toBe(archetype.shape);
}

it('leaves nothing behind from the archetype before it', () => {
  const order: ArchetypeId[] = [
    'operator',
    'monk',
    'flow-artist',
    'comeback',
    'raver',
  ];
  for (const id of [...order, ...order]) {
    applyArchetype(id);
    matchesArchetype(id);
  }
  // Twice around and the profile is the same size, not a growing list.
  const once = store.getString('profile');
  applyArchetype('raver');
  expect(store.getString('profile')).toBe(once);
});

it('starts Festival Six again with a new date when the old one has passed', () => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  try {
    applyArchetype('festival-six');
    const first = loadProfile().eventDate;
    expect(first).toBeDefined();
    // The festival happens; weeks pass; they take it again for the next one.
    const later = NOW + 90 * DAY;
    jest.setSystemTime(later);
    applyArchetype('raver');
    applyArchetype('festival-six');
    expect(loadProfile().eventDate).not.toBe(first);
    // And it is a block again, not a date that has already been and gone.
    expect(blockPhase(loadProfile(), later)).toBeDefined();
  } finally {
    jest.useRealTimers();
  }
});
