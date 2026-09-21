/**
 * The plan's acceptance test for Phase 3: every archetype yields a valid
 * day. Ten presets is ten chances to ship someone a program that asks for
 * nothing, or asks for something their archetype cannot do.
 */
import {ARCHETYPES, archetypeById, DEFAULT_ARCHETYPE} from '../archetypes';
import {applyArchetype} from '../setup';
import {
  __resetProfileCache,
  dailyPar,
  dayRounds,
  loadArchetype,
  loadFacts,
  loadPacks,
  authorProfile,
  saveProfile,
} from '../repository';
import {PACKS, groupsFor, inScope} from '../packs';
import {loadProgram, prescriptionsFor} from '../../program/repository';
import {groupIntoRounds} from '../../program/rounds';
import {TRACKS} from '../../program/tracks';
import {ELEMENT_ORDER} from '../../../theme/elements';
import {store} from '../../../storage';

// A Monday, so the busiest day of the week is the one under test.
const MONDAY = new Date(2026, 8, 21, 9, 0);

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
  // These are the author's program; a fresh store is now a stranger's.
  saveProfile(authorProfile());
});

function dayUnder(id: (typeof ARCHETYPES)[number]['id']) {
  applyArchetype(id);
  __resetProfileCache();
  const program = loadProgram(MONDAY);
  const prescriptions = prescriptionsFor(program, MONDAY);
  return {
    prescriptions,
    sets: prescriptions.reduce((sum, p) => sum + p.sets, 0),
    rounds: groupIntoRounds(prescriptions, {rounds: dayRounds()}),
    elements: new Set(prescriptions.map(p => p.element)),
    par: dailyPar(),
  };
}

it('every archetype yields a day worth doing', () => {
  for (const archetype of ARCHETYPES) {
    const day = dayUnder(archetype.id);

    expect(day.prescriptions.length).toBeGreaterThan(4);
    expect(day.sets).toBeGreaterThan(8);
    expect(day.rounds.length).toBeGreaterThan(0);
    expect(day.par).toBeGreaterThanOrEqual(10);

    // Balance is the whole premise; no preset may quietly abandon it.
    expect(day.elements.size).toBe(ELEMENT_ORDER.length);
  }
});

it('never asks for a drill its own packs do not include', () => {
  for (const archetype of ARCHETYPES) {
    const day = dayUnder(archetype.id);
    expect(loadFacts(MONDAY.getTime()).packs).toEqual([...archetype.packs]);

    const outOfScope = day.prescriptions
      .map(p => p.exerciseId)
      .filter(id => !inScope(id, archetype.packs));
    expect({archetype: archetype.id, outOfScope}).toEqual({
      archetype: archetype.id,
      outOfScope: [],
    });
  }
});

it('teaches only what its packs teach', () => {
  for (const archetype of ARCHETYPES) {
    applyArchetype(archetype.id);
    __resetProfileCache();
    const titles = groupsFor(loadPacks()).map(g => g.title);
    expect(titles).toEqual(groupsFor(archetype.packs).map(g => g.title));
  }
});

it('turns tracks back on when the next archetype wants them', () => {
  // The Parent has no kicks and no flow; the Operator has both.
  applyArchetype('parent');
  __resetProfileCache();
  const parent = prescriptionsFor(loadProgram(MONDAY), MONDAY);
  expect(parent.some(p => p.trackId === 'kicks')).toBe(false);

  applyArchetype('operator');
  __resetProfileCache();
  const operator = prescriptionsFor(loadProgram(MONDAY), MONDAY);
  expect(operator.some(p => p.trackId === 'kicks')).toBe(true);
});

it('actually switches off the tracks it says it switches off', () => {
  // Pack gating alone would keep those drills out of the day, but the
  // track would still read as enabled in Daily Sets — an on switch that
  // never fires, which looks like a bug rather than a choice.
  applyArchetype('monk');
  __resetProfileCache();
  const program = loadProgram(MONDAY);
  expect(program.tracks.kicks.enabled).toBe(false);
  expect(program.tracks.breath.enabled).toBe(true);
});

it('remembers where a program started, and says so once', () => {
  expect(loadArchetype()).toBeUndefined();
  applyArchetype('monk');
  __resetProfileCache();
  expect(loadArchetype()).toBe('monk');
});

it('every archetype is a real one: named, placed, and pointing at packs', () => {
  const ids = new Set(PACKS.map(p => p.id));
  const trackIds = new Set(TRACKS.map(t => t.id));
  for (const archetype of ARCHETYPES) {
    expect(archetype.name.length).toBeGreaterThan(0);
    expect(archetype.forWhom.length).toBeGreaterThan(10);
    expect(archetype.leadsWith.length).toBeGreaterThan(5);
    for (const pack of archetype.packs) {
      expect(ids.has(pack)).toBe(true);
    }
    for (const track of archetype.tracksOff ?? []) {
      expect(trackIds.has(track)).toBe(true);
    }
  }
  expect(archetypeById(DEFAULT_ARCHETYPE)).toBeDefined();
  expect(new Set(ARCHETYPES.map(a => a.id)).size).toBe(ARCHETYPES.length);
});
