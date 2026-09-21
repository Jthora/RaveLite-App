import type {Exercise} from '../types';

/**
 * Seeing yourself move: a big mirror, or the phone's camera.
 *
 * A mirror is the oldest coach there is — dancers, fighters and spinners
 * all check their lines in one — so a big one earns a tile, and these are
 * what it opens. Any mirror will do for Mirror Presence, which is why
 * that one is not here: nearly everybody has one, like a towel.
 *
 * Filming a round and watching it once is the same idea with the camera
 * everybody already carries. It is practice, not content: nothing here
 * asks anyone to post anything, and the app never sees the video.
 *
 * Mirror drills are gated by kit in `domain/profile/kit.ts`; the filming
 * drill by the packs that have moves worth watching. Added 21 Sep 2026.
 */
export const MIRROR_DRILLS: Exercise[] = [
  {
    id: 'air.mirror-posture-check',
    element: 'air',
    name: 'Mirror Posture Check',
    purpose:
      'See where the desk has put your head and hips, then put them back.',
    dose: '60 sec',
    cues: [
      'Side-on first: ear, shoulder, hip and ankle in one line',
      'Head forward of the shoulder? Chin tuck until it stacks',
      'Front-on: shoulders level, head centred, ribs down',
      'One slow breath in the good shape, then look away and find it again',
    ],
    targets: ['UCS', 'APT', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 60,
  },
  {
    id: 'earth.mirror-squat-check',
    element: 'earth',
    name: 'Mirror Squat Check',
    purpose:
      'A squat you can see is a squat you can fix: knees, weight and depth.',
    dose: '2 × 8 slow, one set facing, one side-on',
    cues: [
      'Facing: knees track over the second toe, never caving in',
      'Weight even left and right — no shifting to the easy side',
      'Side-on: heels down, chest proud, as deep as the back stays long',
      'Slow on the way down; the mirror only helps if you can watch',
    ],
    targets: ['Strength', 'Mobility', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 150,
  },
  {
    id: 'water.mirror-groove-check',
    element: 'water',
    name: 'Mirror Groove Check',
    purpose:
      'Find the stiff side: waves and isolations matched left and right.',
    dose: '3 min to one track',
    cues: [
      'Face the mirror, soft knees, one easy groove to warm up',
      'Chest, then head, then hip isolations — each side the same size',
      'A body wave down and back up; watch for the joint that skips',
      'Spend the last minute on the side that looked worse',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['standing', 'house'],
    approxSeconds: 180,
  },
  {
    id: 'water.mirror-plane-check',
    element: 'water',
    name: 'Mirror Plane Check',
    purpose:
      'Flat planes are clean flow; a mirror shows the tilt you cannot feel.',
    dose: '3 min: side-on, then facing',
    cues: [
      'Practice props only; clear space around and above you',
      'Side-on to the mirror: wall-plane spins should show as a thin line',
      'Facing it: the circle should stay round, not tip toward or away',
      'Slow until it holds flat, then speed up and watch it again',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 180,
  },
  {
    id: 'fire.mirror-guard-check',
    element: 'fire',
    name: 'Mirror Guard Check',
    purpose:
      'Strikes and kicks at half speed, watching the guard hand stay home.',
    dose: '3 × 1 min',
    cues: [
      'Stance set, chin down, hands up by the cheekbones',
      'Slow jab and cross: the other hand never leaves the face',
      'Slow front kicks: hands stay up while the leg works',
      'Anything that drops, do five more slowly',
    ],
    targets: ['Coordination', 'Agility', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 240,
  },
  {
    id: 'heart.film-and-watch',
    element: 'heart',
    name: 'Film One Round, Watch It Once',
    purpose:
      'The camera is a mirror that remembers: see what the round really looked like.',
    dose: '1 round, then watch it once',
    cues: [
      'Prop the phone up somewhere steady and film one round of what you practise',
      'Watch it back once, all the way through, without judging yet',
      'Name one thing to change next time — just one',
      'Keep it or delete it; it is yours, and nothing here is for posting',
    ],
    targets: ['Presence', 'Coordination', 'NoFloor'],
    venues: ['standing', 'yard'],
    approxSeconds: 300,
  },
];
