import {store} from '../../../storage';
import {AUTHOR_LIBRARY, EXERCISE_LIBRARY} from '../../exercises/library';
import {CARRIED_DRILLS} from '../../exercises/kit/carried';
import {FLOW_DRILLS} from '../../exercises/kit/flow';
import {PLACE_DRILLS} from '../../exercises/kit/places';
import {factsUnder, startMode} from '../mode';
import {defaultProgram, prescriptionsFor} from '../../program/repository';
import {__resetProfileCache, setFacts} from '../repository';
import {
  AUTHOR_FACTS,
  CARRIED_GROUPS,
  DEFAULT_FACTS,
  PLACE_KINDS,
  canDo,
  hangOf,
  isLoud,
  limitCost,
  neededDrillIds,
  newPlace,
  toPlaces,
  unlockCount,
  usableDrills,
  whyNot,
  withHang,
  type Facts,
  type KitItem,
  type TrainingPlace,
} from '../kit';

const drill = (id: string) => EXERCISE_LIBRARY.find(e => e.id === id)!;
// Monday and Tuesday between them cover every track's training days.
const MONDAY = new Date(2026, 8, 14);
const TUESDAY = new Date(2026, 8, 15);

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});
const facts = (over: Partial<Facts> = {}): Facts => ({
  ...DEFAULT_FACTS,
  ...over,
});

it('the author can do everything the library was built for', () => {
  const mine = new Set(usableDrills(AUTHOR_FACTS).map(d => d.id));
  expect(AUTHOR_LIBRARY.filter(d => !mine.has(d.id)).map(d => d.id)).toEqual(
    [],
  );
});

it('a bare room still has most of the library', () => {
  // Floor and a wall: no mat, no outdoors, nothing to hang from.
  const bare = usableDrills(facts());
  expect(bare.length).toBeGreaterThan(80);
  expect(bare.length).toBeLessThan(EXERCISE_LIBRARY.length);
  // And nothing in it needs what the room hasn't got.
  for (const d of bare) {
    expect(
      d.venues.some(v => ['standing', 'desk', 'house', 'wall'].includes(v)),
    ).toBe(true);
  }
});

it('gates on the place', () => {
  const porch = facts({kit: ['floor', 'wall', 'hangLow', 'hangHigh']});
  expect(canDo(drill('fire.porch-pullup'), facts())).toBe(false);
  expect(canDo(drill('fire.porch-pullup'), porch)).toBe(true);
  expect(canDo(drill('fire.hill-sprints'), porch)).toBe(false);
  // Streets alone are flat; the hill is its own tile.
  expect(
    canDo(drill('fire.hill-sprints'), facts({kit: ['floor', 'streets']})),
  ).toBe(false);
  expect(
    canDo(
      drill('fire.hill-sprints'),
      facts({kit: ['floor', 'streets', 'hill']}),
    ),
  ).toBe(true);
});

it('gates on the props, and only where they are really needed', () => {
  // The farmer walk wants a yard as well as the bricks; the suitcase
  // carry is the one a flat can do, which is why both exist.
  const withBricks = facts({kit: ['floor', 'wall', 'bricks']});
  expect(canDo(drill('earth.brick-farmer-walk'), facts())).toBe(false);
  expect(canDo(drill('earth.brick-farmer-walk'), withBricks)).toBe(false);
  expect(
    canDo(
      drill('earth.brick-farmer-walk'),
      facts({kit: ['floor', 'bricks', 'yard']}),
    ),
  ).toBe(true);
  expect(canDo(drill('earth.suitcase-carry'), withBricks)).toBe(true);
  // A staff flow needs a staff; a dance step does not.
  expect(
    canDo(drill('water.staff-combat-rounds'), facts({kit: ['floor', 'yard']})),
  ).toBe(false);
  expect(canDo(drill('water.two-step'), facts())).toBe(true);
  // Bricks are optional in a deep squat hold, so it is not gated on them.
  expect(canDo(drill('water.deep-squat-hold'), facts())).toBe(true);
});

it('keeps a quiet flat quiet', () => {
  const quiet = facts({
    kit: ['floor', 'wall', 'doorway', 'table', 'mat'],
    noise: 'quiet',
  });
  expect(isLoud(drill('fire.tuck-jump'))).toBe(true);
  expect(isLoud(drill('water.toprock'))).toBe(true);
  expect(isLoud(drill('air.chin-tuck'))).toBe(false);
  expect(canDo(drill('fire.tuck-jump'), quiet)).toBe(false);
  expect(canDo(drill('air.shadow-rope'), quiet)).toBe(false);
  expect(canDo(drill('earth.plank'), quiet)).toBe(true);
});

it('drops what an injury must not load, and keeps the rest', () => {
  const hurt = {injured: 'shoulder' as const};
  expect(canDo(drill('fire.pushup-groove'), AUTHOR_FACTS, hurt)).toBe(false);
  expect(canDo(drill('earth.porch-dead-hang'), AUTHOR_FACTS, hurt)).toBe(false);
  expect(canDo(drill('earth.squat'), AUTHOR_FACTS, hurt)).toBe(true);
  expect(canDo(drill('air.coherence-breath'), AUTHOR_FACTS, hurt)).toBe(true);
});

it('says what a piece of kit would unlock, for the setup tile', () => {
  const bare = facts();
  // The twelve hanging drills now split between low and high.
  expect(unlockCount('hangHigh', bare)).toBeGreaterThan(5);
  expect(unlockCount('hangLow', bare)).toBeGreaterThan(5);
  expect(unlockCount('mat', bare)).toBeGreaterThan(20);
  expect(unlockCount('yard', bare)).toBeGreaterThan(10);
  // Nothing to unlock twice.
  expect(unlockCount('wall', bare)).toBe(0);
});

describe('a program for a room that is not the author', () => {
  const prescribe = (facts: Facts) => {
    setFacts(facts);
    return prescriptionsFor(defaultProgram(MONDAY), MONDAY);
  };

  it('still pulls, with a towel over a door instead of a bar', () => {
    const flat = prescribe(
      facts({kit: ['floor', 'wall', 'doorway', 'table', 'mat']}),
    );
    const pull = flat.find(p => p.trackId === 'pull');
    const hang = flat.find(p => p.trackId === 'hang');
    // The push/pull rule survives: Pull is still prescribed, as a row.
    // It stands in at the *same step of the ladder*, so a room without a
    // bar gets the substitute for porch pull-ups — which is where the
    // program starts because that is where its author stands. Starting
    // rungs that suit the person arrive with setup (see docs/public-beta.md).
    expect(pull?.label).toBe('Feet-up towel rows');
    expect(pull?.exerciseId).toBe('fire.feet-up-towel-row');
    // Stepping down the ladder gives the easier stand-ins.
    setFacts(facts({kit: ['floor', 'wall', 'doorway', 'table', 'mat']}));
    const program = defaultProgram(MONDAY);
    program.tracks.pull = {...program.tracks.pull, rung: 1};
    expect(
      prescriptionsFor(program, MONDAY).find(p => p.trackId === 'pull')
        ?.exerciseId,
    ).toBe('fire.towel-door-row');
    // Hanging becomes grip work it can actually do.
    expect(hang?.exerciseId).toBe('earth.table-edge-hold');
    // And the hanging leg raises become floor work at the same step.
    setFacts(facts({kit: ['floor', 'wall', 'doorway', 'table', 'mat']}));
    const legs = prescriptionsFor(defaultProgram(TUESDAY), TUESDAY).find(
      p => p.trackId === 'legs-up',
    );
    expect(legs?.exerciseId).not.toContain('hanging');
  });

  it('never prescribes anything the room cannot do', () => {
    const rooms: Facts[] = [
      facts({kit: ['floor', 'wall', 'doorway', 'table']}),
      facts({kit: ['floor', 'wall', 'doorway', 'table', 'mat']}),
      facts({
        kit: ['floor', 'wall', 'doorway', 'table', 'mat'],
        noise: 'quiet',
      }),
      facts({kit: ['floor', 'mat', 'hangLow', 'hangHigh']}),
      facts({kit: ['floor', 'mat', 'yard', 'streets']}),
      AUTHOR_FACTS,
    ];
    for (const room of rooms) {
      for (const date of [MONDAY, TUESDAY]) {
        setFacts(room);
        for (const p of prescriptionsFor(defaultProgram(date), date)) {
          const drill = EXERCISE_LIBRARY.find(e => e.id === p.exerciseId);
          expect(drill).toBeDefined();
          expect({
            room: room.kit,
            drill: p.exerciseId,
            can: canDo(drill!, room),
          }).toEqual({
            room: room.kit,
            drill: p.exerciseId,
            can: true,
          });
        }
      }
    }
  });

  it("leaves the author's program exactly as it was", () => {
    setFacts(AUTHOR_FACTS);
    const mine = prescriptionsFor(defaultProgram(MONDAY), MONDAY);
    expect(mine.find(p => p.trackId === 'pull')?.exerciseId).toBe(
      'fire.porch-pullup',
    );
    expect(mine.find(p => p.trackId === 'hang')?.exerciseId).toBe(
      'earth.porch-dead-hang',
    );
  });
});

it('claiming a piece of kit changes what the program asks for', () => {
  // A flat with a mat: Pull is a towel over a door.
  setFacts(facts({kit: ['floor', 'wall', 'doorway', 'table', 'mat']}));
  expect(
    prescriptionsFor(defaultProgram(MONDAY), MONDAY).find(
      p => p.trackId === 'pull',
    )?.exerciseId,
  ).toBe('fire.feet-up-towel-row');
  // They buy a doorway bar and say so. The same track, the real thing.
  setFacts(facts({kit: ['floor', 'wall', 'mat', 'hangLow', 'hangHigh']}));
  expect(
    prescriptionsFor(defaultProgram(MONDAY), MONDAY).find(
      p => p.trackId === 'pull',
    )?.exerciseId,
  ).toBe('fire.porch-pullup');
});

// ─── Places ─────────────────────────────────────────────────────────────

const place = (
  kind: TrainingPlace['kind'],
  kit: KitItem[],
  limits: TrainingPlace['limits'] = [],
): TrainingPlace => ({...newPlace(kind, []), kit, limits});

describe('places', () => {
  it('keeps a low ceiling in the basement, not in the yard', () => {
    // The bug that started this: ticking a low ceiling took jumps away
    // from a yard with sky over it.
    const basement = place('basement', ['wall', 'mat'], ['lowCeiling']);
    const yard = place('yard', ['yard', 'grass']);
    const jump = drill('fire.jump-squat');
    expect(canDo(jump, facts({kit: [], places: [basement]}))).toBe(false);
    expect(canDo(jump, facts({kit: [], places: [basement, yard]}))).toBe(true);
    // And the basement still does what a basement does.
    expect(
      canDo(drill('earth.plank'), facts({kit: [], places: [basement]})),
    ).toBe(true);
  });

  it('needs the venue and the kit in the same place', () => {
    // A doorway indoors and a hang point on the porch do not add up to a
    // hang point indoors — but a staff, carried, goes everywhere.
    const room = place('room', ['wall', 'doorway']);
    const yard = place('yard', ['yard']);
    const withStaff = facts({kit: ['staff'], places: [room, yard]});
    expect(canDo(drill('water.staff-combat-rounds'), withStaff)).toBe(true);
    expect(
      canDo(
        drill('water.staff-combat-rounds'),
        facts({kit: [], places: [room, yard]}),
      ),
    ).toBe(false);
  });

  it('asks about hanging as a question', () => {
    const porch = place('porch', ['rail']);
    expect(hangOf(porch)).toBe('none');
    const low = withHang(porch, 'low');
    expect(hangOf(low)).toBe('low');
    expect(low.kit).toEqual(['rail', 'hangLow']);
    expect(hangOf(withHang(low, 'both'))).toBe('both');
    expect(hangOf(withHang(low, 'none'))).toBe('none');
    // Low is rows and bent-knee hangs; the leg raises need clearance.
    const lowFacts = facts({kit: [], places: [low]});
    expect(canDo(drill('fire.porch-pullup'), lowFacts)).toBe(true);
    expect(canDo(drill('earth.hanging-leg-raise'), lowFacts)).toBe(false);
  });

  it('counts a limit against the one place it is on', () => {
    const basement = place('basement', ['wall', 'mat']);
    const yard = place('yard', ['yard', 'grass']);
    const both = facts({kit: [], places: [basement, yard]});
    // A low ceiling on the basement costs nothing the yard still has.
    const onBasement = limitCost('lowCeiling', both, basement.id);
    const alone = limitCost(
      'lowCeiling',
      facts({kit: [], places: [basement]}),
      basement.id,
    );
    expect(onBasement).toBeLessThan(alone);
  });

  it('every tile anyone can tick unlocks something somewhere', () => {
    // A tile that does nothing teaches somebody that tiles do nothing.
    const dead: string[] = [];
    for (const kind of PLACE_KINDS) {
      for (const item of kind.offers) {
        const bare: Facts = {
          ...DEFAULT_FACTS,
          kit: [],
          places: [{...newPlace(kind.id, []), kit: [], limits: []}],
        };
        if (
          unlockCount(item, bare, bare.places![0].id) === 0 &&
          !PLACE_KINDS.some(k => {
            const other: Facts = {
              ...DEFAULT_FACTS,
              kit: [],
              places: [{...newPlace(k.id, []), kit: [], limits: []}],
            };
            return (
              k.offers.includes(item) &&
              unlockCount(item, other, other.places![0].id) > 0
            );
          })
        ) {
          dead.push(`${kind.id}:${item}`);
        }
      }
    }
    for (const group of CARRIED_GROUPS) {
      for (const item of group.items) {
        const yard: Facts = {
          ...DEFAULT_FACTS,
          kit: [],
          places: [place('yard', ['yard', 'grass'])],
        };
        if (unlockCount(item, yard) === 0) {
          dead.push(`carried:${item}`);
        }
      }
    }
    expect(dead).toEqual([]);
  });

  it('reads an old flat profile as places without losing a drill', () => {
    const flats: Facts[] = [
      DEFAULT_FACTS,
      facts({kit: ['floor', 'mat', 'wall', 'doorway', 'table', 'bricks']}),
      facts({
        kit: [
          'floor',
          'mat',
          'wall',
          'doorway',
          'table',
          'chair',
          'stairs',
          'hangLow',
          'hangHigh',
          'bricks',
          'staff',
          'ball',
          'yard',
          'streets',
        ],
      }),
      facts({kit: ['floor', 'wall', 'yard', 'bench', 'rail', 'hangHigh']}),
    ];
    for (const flat of flats) {
      const before = usableDrills(flat).map(d => d.id);
      const after = new Set(usableDrills(toPlaces(flat)).map(d => d.id));
      expect({
        kit: flat.kit,
        lost: before.filter(id => !after.has(id)),
      }).toEqual({kit: flat.kit, lost: []});
    }
  });

  it('moves old limits onto the room, where they were always true', () => {
    const flat = facts({
      kit: ['floor', 'wall', 'mat', 'yard'],
      limits: ['lowCeiling'],
    });
    expect(canDo(drill('fire.jump-squat'), flat)).toBe(false);
    const placed = toPlaces(flat);
    expect(placed.limits).toBeUndefined();
    expect(placed.places![0].limits).toEqual(['lowCeiling']);
    expect(canDo(drill('fire.jump-squat'), placed)).toBe(true);
  });

  it('is one room while travelling, whatever home has', () => {
    const away = factsUnder(
      AUTHOR_FACTS,
      startMode('travelling', Date.now(), {}),
    );
    expect(canDo(drill('fire.jump-squat'), AUTHOR_FACTS)).toBe(true);
    expect(canDo(drill('fire.porch-pullup'), away)).toBe(false);
    expect(canDo(drill('water.staff-combat-rounds'), away)).toBe(false);
    expect(canDo(drill('air.chin-tuck'), away)).toBe(true);
  });
});

describe('the new kit', () => {
  it('every drill written for new kit needs that kit', () => {
    // A drill in kit/ with no need would be offered to everybody.
    const free = [...CARRIED_DRILLS, ...PLACE_DRILLS, ...FLOW_DRILLS].filter(
      d => !neededDrillIds().includes(d.id),
    );
    expect(free.map(d => d.id)).toEqual([]);
  });

  it('every need names a drill that exists', () => {
    const ids = new Set(EXERCISE_LIBRARY.map(d => d.id));
    expect(neededDrillIds().filter(id => !ids.has(id))).toEqual([]);
  });

  it('offers the author only what the author has', () => {
    // A ball, bricks and a staff — and nothing that needs a band, a rope,
    // jugs, a sandbag or any other flow toy.
    const mine = new Set(usableDrills(AUTHOR_FACTS).map(d => d.id));
    expect(
      [...CARRIED_DRILLS, ...FLOW_DRILLS]
        .filter(d => mine.has(d.id))
        .map(d => d.id)
        .sort(),
    ).toEqual([
      'air.ball-pec-release',
      'air.band-dislocate', // a band or a staff
      'water.ball-glute-release',
    ]);
  });

  it('says why a drill is not on offer, and says the real reason', () => {
    const room = facts({
      kit: [],
      places: [place('basement', ['wall', 'mat'], ['lowCeiling'])],
    });
    expect(whyNot(drill('air.band-pull-apart'), room)).toBe(
      'Needs a resistance band',
    );
    expect(whyNot(drill('fire.shoulder-roll'), facts())).toBe(
      'Needs grass or a mat or carpet or sand',
    );
    expect(whyNot(drill('fire.jump-squat'), room)).toBe(
      'Not with a low ceiling',
    );
    expect(
      whyNot(drill('fire.tuck-jump'), {
        ...facts({kit: ['floor', 'mat', 'yard']}),
        noise: 'quiet',
      }),
    ).toBe('Too loud for where you train');
    expect(whyNot(drill('air.chin-tuck'), room)).toBeUndefined();
  });
});
