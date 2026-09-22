/**
 * The pack split has one load-bearing claim: turning every pack off still
 * leaves a complete program. If that is false, packs are not optional
 * content — they are the app, and switching one off breaks someone's
 * training rather than narrowing it.
 */
import {
  ALL_PACKS,
  PACKS,
  drillsOf,
  groupsFor,
  inScope,
  packDrill,
  scopedDrills,
  tracksFor,
} from '../packs';
import {AUTHOR_FACTS, canDo} from '../kit';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {ELEMENT_ORDER} from '../../../theme/elements';
import {TRACKS} from '../../program/tracks';
import {loadProgram, prescriptionsFor} from '../../program/repository';
import {skillGroupsFor} from '../../activity/practice';
import {
  __resetProfileCache,
  loadFacts,
  loadPacks,
  setPacks,
} from '../repository';
import {store} from '../../../storage';

it('every drill a pack names is really in the library', () => {
  const missing: string[] = [];
  for (const pack of PACKS) {
    for (const id of drillsOf(pack)) {
      if (!packDrill(id)) {
        missing.push(`${pack.id} names ${id}`);
      }
    }
  }
  expect(missing).toEqual([]);
});

it('every track a pack turns on is a real track', () => {
  const ids = new Set(TRACKS.map(t => t.id));
  for (const id of tracksFor(ALL_PACKS)) {
    expect(ids.has(id)).toBe(true);
  }
});

it('with every pack off, there is still a whole program', () => {
  const base = scopedDrills([]);

  // Enough to train on, in every element, with the room the app assumes.
  expect(base.length).toBeGreaterThan(100);
  for (const element of ELEMENT_ORDER) {
    const mine = base.filter(
      d => d.element === element && canDo(d, AUTHOR_FACTS),
    );
    expect(mine.length).toBeGreaterThan(5);
  }

  // And the base movements specifically: nothing here is a specialism.
  for (const id of [
    'fire.pushups',
    'earth.squat',
    'earth.plank',
    'air.chin-tuck',
    'water.deep-squat-hold',
  ]) {
    expect(inScope(id, [])).toBe(true);
  }
});

it('a pack drill is gone without its pack, and back with it', () => {
  expect(inScope('water.toprock', [])).toBe(false);
  expect(inScope('water.toprock', ['dance'])).toBe(true);
  expect(inScope('water.toprock', ['martial'])).toBe(false);

  // A drill two packs both want needs only one of them.
  expect(inScope('fire.run-2mi', ['runs'])).toBe(true);
  expect(inScope('fire.run-2mi', ['military-tests'])).toBe(true);
});

it('the author has everything, and everything is reachable', () => {
  expect(scopedDrills(ALL_PACKS)).toHaveLength(EXERCISE_LIBRARY.length);
  // No pack is a dead end: each brings drills or a track.
  for (const pack of PACKS) {
    expect(drillsOf(pack).length + (pack.tracks?.length ?? 0)).toBeGreaterThan(
      0,
    );
  }
});

it('the curriculum follows the packs you carry', () => {
  expect(groupsFor([]).length).toBe(0);
  const titles = groupsFor(['martial']).map(g => g.title);
  expect(titles).toEqual(['Kicks', 'Strikes and blocks']);
  expect(groupsFor(ALL_PACKS).length).toBeGreaterThan(titles.length);
});

it('no pack claims a drill twice, and each says what it is for', () => {
  for (const pack of PACKS) {
    const ids = drillsOf(pack);
    expect(new Set(ids).size).toBe(ids.length);
    expect(pack.name.length).toBeGreaterThan(0);
    expect(pack.detail.length).toBeGreaterThan(15);
  }
});

/**
 * And the same claim through the real seam: what the app actually asks
 * for when someone carries fewer packs.
 */
describe('through the profile', () => {
  const NOW = new Date(2026, 8, 21, 9, 0);

  beforeEach(() => {
    store.clearAll();
    __resetProfileCache();
  });

  it('an install that was never asked carries everything', () => {
    expect(loadPacks().sort()).toEqual([...ALL_PACKS].sort());
    expect(loadFacts(NOW.getTime()).packs?.length).toBe(ALL_PACKS.length);
  });

  it('dropping a pack narrows the day without emptying it', () => {
    const full = prescriptionsFor(loadProgram(NOW), NOW);

    setPacks([]);
    const bare = prescriptionsFor(loadProgram(NOW), NOW);

    // Fewer tracks, because kicks and flow came from packs — but still a
    // real day, in every element.
    expect(bare.length).toBeLessThan(full.length);
    expect(bare.length).toBeGreaterThan(8);
    expect(new Set(bare.map(p => p.element)).size).toBe(5);
    expect(bare.reduce((sum, p) => sum + p.sets, 0)).toBeGreaterThan(20);
  });

  it('the practice curriculum follows the packs, and empties cleanly', () => {
    expect(skillGroupsFor(loadFacts(), loadPacks()).length).toBeGreaterThan(3);

    setPacks(['dance']);
    const only = skillGroupsFor(loadFacts(), loadPacks());
    // Filming a round is Dance's too — the camera as a mirror.
    expect(only.map(g => g.title)).toEqual(['Dance', 'On film']);

    setPacks([]);
    expect(skillGroupsFor(loadFacts(), loadPacks())).toEqual([]);
  });
});

it('keeps fighting out of Flow arts', () => {
  // Plenty of people who spin a staff never want to fight with it. The
  // staff's combat drills belong to Dance combat, so a raver carrying
  // Flow arts and not Dance combat is never handed strikes and blocks.
  const flow = PACKS.find(p => p.id === 'staff')!;
  const ids = flow.groups.flatMap(g => [...g.ids]);
  expect(ids).not.toContain('water.staff-combat-rounds');
  expect(ids).not.toContain('water.sword-form-slow');
  expect(inScope('water.staff-combat-rounds', ['staff', 'dance'])).toBe(false);
  // It is dance combat — fighting as dance — which is its own pack.
  expect(inScope('water.staff-combat-rounds', ['martial'])).toBe(false);
  expect(inScope('water.staff-combat-rounds', ['dance-combat'])).toBe(true);
  expect(inScope('water.poi-weave', ['staff'])).toBe(true);
});
