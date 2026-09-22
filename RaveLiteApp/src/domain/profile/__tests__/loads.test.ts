import {EXERCISE_LIBRARY} from '../../exercises/library';
import {moveForExercise} from '../../exercises/moves';
import {AUTHOR_FACTS, REGIONS, canDo, needsFor, type Region} from '../kit';
import {regionsOf} from '../loads';

const drill = (id: string) => EXERCISE_LIBRARY.find(e => e.id === id)!;
const loads = (id: string) => regionsOf(drill(id), needsFor(id));
/** Moves that ask nothing of a joint: breathing, drinking, sitting still. */
const STILL = new Set([
  'breath',
  'drink',
  'fuel',
  'presence',
  'intent',
  'evening',
  'pulse',
]);

it('has a neck', () => {
  expect(REGIONS).toContain('neck');
});

it('knows what every drill that moves the body loads', () => {
  const unknown = EXERCISE_LIBRARY.filter(d => {
    const move = moveForExercise(d.id);
    return !(move && STILL.has(move)) && loads(d.id).size === 0;
  }).map(d => d.id);
  expect(unknown).toEqual([]);
});

it.each<[Region, string[]]>([
  // The leaks the audit found.
  [
    'shoulder',
    ['air.brick-halo', 'water.staff-halo-roll', 'water.poi-windmill'],
  ],
  [
    'wrist',
    [
      'earth.crow-progression',
      'water.down-dog-cobra',
      'fire.cartwheel',
      'water.freeze-hold',
    ],
  ],
  [
    'neck',
    [
      'water.contact-neck-roll',
      'water.dragon-staff-neck-roll',
      'air.chin-tuck',
    ],
  ],
])('keeps a hurt %s away from what loads it', (region, ids) => {
  for (const id of ids) {
    expect([id, loads(id).has(region)]).toEqual([id, true]);
    expect(canDo(drill(id), {...AUTHOR_FACTS, injured: region})).toBe(false);
  }
});

it('still leaves somebody hurt a day of things to do', () => {
  for (const region of REGIONS) {
    const left = EXERCISE_LIBRARY.filter(d =>
      canDo(d, {...AUTHOR_FACTS, injured: region}),
    );
    expect([region, left.length > 30]).toEqual([region, true]);
  }
});
