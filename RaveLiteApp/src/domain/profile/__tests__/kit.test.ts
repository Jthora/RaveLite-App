import {store} from '../../../storage';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {defaultProgram, prescriptionsFor} from '../../program/repository';
import {__resetProfileCache, setFacts} from '../repository';
import {
  AUTHOR_FACTS,
  DEFAULT_FACTS,
  canDo,
  isLoud,
  unlockCount,
  usableDrills,
  type Facts,
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

it('the author can do everything, because the app was built around him', () => {
  expect(usableDrills(AUTHOR_FACTS)).toHaveLength(EXERCISE_LIBRARY.length);
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
  const porch = facts({kit: ['floor', 'wall', 'hangPoint']});
  expect(canDo(drill('fire.porch-pullup'), facts())).toBe(false);
  expect(canDo(drill('fire.porch-pullup'), porch)).toBe(true);
  expect(canDo(drill('fire.hill-sprints'), porch)).toBe(false);
  expect(
    canDo(drill('fire.hill-sprints'), facts({kit: ['floor', 'streets']})),
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
  const quiet = facts({kit: ['floor', 'wall', 'mat'], noise: 'quiet'});
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
  expect(unlockCount('hangPoint', bare)).toBeGreaterThan(10);
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
    const flat = prescribe(facts({kit: ['floor', 'wall', 'mat']}));
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
    setFacts(facts({kit: ['floor', 'wall', 'mat']}));
    const program = defaultProgram(MONDAY);
    program.tracks.pull = {...program.tracks.pull, rung: 1};
    expect(
      prescriptionsFor(program, MONDAY).find(p => p.trackId === 'pull')
        ?.exerciseId,
    ).toBe('fire.towel-door-row');
    // Hanging becomes grip work it can actually do.
    expect(hang?.exerciseId).toBe('earth.table-edge-hold');
    // And the hanging leg raises become floor work at the same step.
    setFacts(facts({kit: ['floor', 'wall', 'mat']}));
    const legs = prescriptionsFor(defaultProgram(TUESDAY), TUESDAY).find(
      p => p.trackId === 'legs-up',
    );
    expect(legs?.exerciseId).not.toContain('hanging');
  });

  it('never prescribes anything the room cannot do', () => {
    const rooms: Facts[] = [
      facts({kit: ['floor', 'wall']}),
      facts({kit: ['floor', 'wall', 'mat']}),
      facts({kit: ['floor', 'wall', 'mat'], noise: 'quiet'}),
      facts({kit: ['floor', 'mat', 'hangPoint']}),
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

  it('leaves the author exactly as he was', () => {
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
  setFacts(facts({kit: ['floor', 'wall', 'mat']}));
  expect(
    prescriptionsFor(defaultProgram(MONDAY), MONDAY).find(
      p => p.trackId === 'pull',
    )?.exerciseId,
  ).toBe('fire.feet-up-towel-row');
  // They buy a doorway bar and say so. The same track, the real thing.
  setFacts(facts({kit: ['floor', 'wall', 'mat', 'hangPoint']}));
  expect(
    prescriptionsFor(defaultProgram(MONDAY), MONDAY).find(
      p => p.trackId === 'pull',
    )?.exerciseId,
  ).toBe('fire.porch-pullup');
});
