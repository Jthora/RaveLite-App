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
      'Check where sitting has moved your head and hips, then correct them.',
    dose: '60 sec',
    cues: [
      'Side-on first: ear, shoulder, hip and ankle in one line',
      'If your head is forward, tuck your chin until it lines up',
      'Front-on: shoulders level, head centred, ribs down',
      'Take one slow breath in good posture; look away, then find it again',
    ],
    targets: ['UCS', 'APT', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 60,
  },
  {
    id: 'earth.mirror-squat-check',
    element: 'earth',
    name: 'Mirror Squat Check',
    purpose: 'Watch your squat to fix knee position, weight and depth.',
    dose: '2 × 8 slow, one set facing, one side-on',
    cues: [
      'Facing: knees track over the second toe, never caving in',
      'Keep your weight even left and right; do not shift to one side',
      'Side-on: heels down, chest up, only as deep as your back stays flat',
      'Lower slowly so you can watch yourself in the mirror',
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
      'Find your stiffer side by matching waves and isolations left and right.',
    dose: '3 min to one track',
    cues: [
      'Face the mirror, knees soft; warm up with one easy groove',
      'Chest, then head, then hip isolations; make each side the same size',
      'Do a body wave down and back up; watch for any joint that gets missed',
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
    purpose: 'A mirror shows tilted spin planes that you cannot feel.',
    dose: '3 min: side-on, then facing',
    cues: [
      'Practice props only; clear space around and above you',
      'Side-on to the mirror: wall-plane spins should show as a thin line',
      'Facing it: the circle should stay round, not tip toward or away',
      'Go slow until it stays flat, then speed up and check again',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 180,
  },
  {
    id: 'fire.mirror-guard-check',
    element: 'fire',
    name: 'Mirror Guard Check',
    purpose: 'Half-speed strikes and kicks to check your guard hand stays up.',
    dose: '3 × 1 min',
    cues: [
      'Stance set, chin down, hands up by the cheekbones',
      'Slow jab and cross; keep the other hand at your face',
      'Slow front kicks; keep your hands up',
      'If a hand drops on a move, do five more of that move slowly',
    ],
    targets: ['Coordination', 'Agility', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 240,
  },
  {
    id: 'heart.film-and-watch',
    element: 'heart',
    name: 'Film One Round, Watch It Once',
    purpose: 'See how your technique really looks.',
    dose: '1 round, then watch it once',
    cues: [
      'Set the phone somewhere steady; film one round of your practice',
      'Watch it once, all the way through, without judging',
      'Pick one thing to change next time',
      'Keep or delete the video; it is only for you',
    ],
    targets: ['Presence', 'Coordination', 'NoFloor'],
    venues: ['standing', 'yard'],
    approxSeconds: 300,
  },
];
