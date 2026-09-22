import type {Exercise} from '../types';

/**
 * Flow-toy drills — the rave's own training kit.
 *
 * Poi, hoop, fans, levitation wand, rope dart, contact ball, buugeng and
 * double staff, plus one freestyle round for whichever toy is to hand.
 * Each drill is gated by kit in `domain/profile/kit.ts`, so only people
 * who have ticked the toy are offered it. Added 21 Sep 2026.
 *
 * Practice props only: soft or LED. Nothing here teaches fire.
 *
 * Every drill is standing work, so every drill carries "NoFloor". Contact
 * ball needs no room at all and is the only toy offered at the desk.
 *
 * Ids are stable — journal entries and custom circuits reference them.
 */
export const FLOW_DRILLS: Exercise[] = [
  // ─── Poi ───────────────────────────────────────────────────────────────
  {
    id: 'water.poi-weave',
    element: 'water',
    name: 'Poi Three-Beat Weave',
    purpose: 'The base poi move: split time with crossing arms.',
    dose: '3 × 2 min: forward, reverse, forward',
    cues: [
      'Practice props only; clear space around and above you',
      'Both poi forward and split time: one up while the other is down',
      'Each poi crosses over the other arm, then under it, then back out',
      'Keep the hands close in front of the chest; shoulders loose',
      'Reverse: the same count with both poi spinning backward',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 420,
  },
  {
    id: 'water.poi-butterfly',
    element: 'water',
    name: 'Poi Butterfly',
    purpose: 'Builds the wall plane and mirror timing, driven from the wrists.',
    dose: '4 × 1 min, alternating direction',
    cues: [
      'Hands close together at chest height, poi flat to the front',
      'Opposite directions, together time: each poi mirrors the other',
      'They pass at the top and bottom on slightly different planes',
      'The wrists drive it; the hands barely move',
      'Both ways: down the middle, then up the middle',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
  },
  {
    id: 'water.poi-flowers',
    element: 'water',
    name: 'Poi Flowers (inspin and antispin)',
    purpose: 'Shows how the arm and poi circles combine into one shape.',
    dose: '4 × 1 min: inspin, antispin, each direction',
    cues: [
      'One poi first, wall plane, the arm tracing a big even circle',
      'Inspin: poi and arm turn the same way. Antispin: opposite ways',
      'Four-petal antispin: three poi turns to one arm circle; count them',
      'Keep the plane; if the petals lose shape, slow the arm down',
      'Both directions and both hands, then both poi together',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
  },

  // ─── Hoop ──────────────────────────────────────────────────────────────
  {
    id: 'water.hoop-waist',
    element: 'water',
    name: 'Waist Hooping (both directions)',
    purpose: 'The base hoop move: a steady rhythm driven by your trunk.',
    dose: '3 × 1 min each direction',
    cues: [
      'Feet staggered, one ahead of the other, knees soft',
      'Hold the hoop level against your back and spin it round',
      'Push forward and back as it passes; do not circle the hips',
      'A bigger, heavier hoop turns slower and is easier to keep up',
      'Your weaker direction will feel awkward; keep practising it',
    ],
    targets: ['Flow', 'Coordination', 'Conditioning', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },
  {
    id: 'water.hoop-isolation',
    element: 'water',
    name: 'Hoop Isolation',
    purpose:
      'Trains the illusion behind most hoop tricks: a hoop that stays still.',
    dose: '3 × 1 min each hand',
    cues: [
      'A smaller hoop is easier: 84 cm (33 in) across or less',
      'Hoop upright in front of you, flat to the front, hand at the top',
      'Watch its centre; keep that point still in the air',
      'Slowly circle the hand round the centre; do not let the hoop spin in it',
      'When your wrist cannot turn further, open the hand and re-grip',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 360,
  },
  {
    id: 'water.hoop-flow-round',
    element: 'water',
    name: 'Hoop Flow Round',
    purpose: 'Links moves into flow and trains you to keep going after drops.',
    dose: '1 track (3–5 min)',
    cues: [
      'Practice props only; clear space around and above you',
      'Mix waist hooping, hand spins and isolations to one track',
      'Change move when the music changes, not in the middle of a phrase',
      'If you drop it, pick it up and go into the next move',
      'Keep your feet moving; move the hoop with your body',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'Conditioning', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 300,
  },

  // ─── Fans ──────────────────────────────────────────────────────────────
  {
    id: 'water.fan-reels',
    element: 'water',
    name: 'Fan Reels (hip and shoulder)',
    purpose: 'Trains moving the fans around your body while keeping the plane.',
    dose: '4 × 1 min: hip and shoulder, each direction',
    cues: [
      'Practice props only; clear space around you',
      'Both fans flat to the front, circling the same way at the same time',
      'Carry the circles from in front of you to behind you, then back',
      'Hip height first, then shoulder height; keep the planes flat',
      'Go slow enough to feel where the fans are; both directions',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
  },
  {
    id: 'water.fan-isolations',
    element: 'water',
    name: 'Fan Isolations',
    purpose: 'Trains the still point that makes a fan appear to float.',
    dose: '3 × 1 min each hand',
    cues: [
      'One fan first, its face flat to the front',
      'The centre of the fan is the still point; keep your eyes on it',
      'Move your arm round that point while the fan turns in place',
      'A half circle and back first, then the full turn',
      'Both directions, the other hand, then both fans mirrored',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 360,
  },

  // ─── Levitation wand ───────────────────────────────────────────────────
  {
    id: 'water.wand-float',
    element: 'water',
    name: 'Levitation Wand Float',
    purpose: 'The first wand illusion; trains smooth, slow hand control.',
    dose: '5 min',
    cues: [
      'Set up the thread as your wand’s instructions say',
      'Hold the wand upright; move the thread hand in small, level circles',
      'The thread runs round the top of the wand; keep it taut',
      'Move the free hand as if it steers the wand; this makes the illusion',
      'Go slow and smooth; a sudden move swings the wand and shows the thread',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 300,
  },
  {
    id: 'water.wand-orbit',
    element: 'water',
    name: 'Levitation Wand Orbits',
    purpose: 'Moves the float around your body so the wand appears to follow.',
    dose: '5 min, both directions',
    cues: [
      'Start in a steady float before moving anywhere',
      'Take the wand slowly round the free hand, then round the body',
      'Turn the body with it so the thread does not catch on you',
      'Slow first; add speed only while the wand stays upright',
      'Both directions; if the wand tips or tangles, go back to the float',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 300,
  },

  // ─── Rope dart ─────────────────────────────────────────────────────────
  {
    id: 'water.rope-dart-wheel',
    element: 'water',
    name: 'Rope Dart Wheel Spins',
    purpose: 'Basic rope control: length, plane and rhythm on each side.',
    dose: '3 × 1 min each side',
    cues: [
      'Soft end only: a tennis ball knotted in a sock, never a hard dart',
      'Clear 3 m (10 ft) all round, and keep people out of it',
      'Spin a vertical wheel beside you, the rope through a loose fist',
      'Hold the tail in the other hand; let out only what you can control',
      'Right side, then left; keep your face and head out of its path',
    ],
    targets: ['Flow', 'Coordination', 'Grip', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },
  {
    id: 'water.rope-dart-wraps',
    element: 'water',
    name: 'Rope Dart Wraps and Releases',
    purpose: 'Teaches you to wrap the rope on your body and release it.',
    dose: '5 wraps each on arm and leg, each side',
    cues: [
      'Soft end only; clear 3 m (10 ft) all round',
      'From a slow wheel, let the rope wrap round your forearm',
      'After two or three turns, unwind it the same way; do not yank',
      'Arm, then leg; one side, then the other',
      'Never around the neck or head',
    ],
    targets: ['Flow', 'Coordination', 'Agility', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 300,
  },

  // ─── Contact ball ──────────────────────────────────────────────────────
  {
    id: 'water.contact-palm-spin',
    element: 'water',
    name: 'Contact Ball Palm Circle',
    purpose: 'Works the fingers and palm, and needs no space.',
    dose: '1 min each direction, each hand',
    cues: [
      'Practise over a soft surface; an acrylic ball is heavy and hard',
      'Palm flat and open, the ball resting in the middle',
      'Lift the fingers and thumb in turn to roll it round the palm',
      'Relax your eyes; keep the hand level and move only the fingers',
      'Both directions, then the weaker hand',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 240,
  },
  {
    id: 'water.contact-isolation',
    element: 'water',
    name: 'Contact Ball Isolation',
    purpose: 'The core contact illusion: a ball that seems fixed in the air.',
    dose: '2 × 1 min each hand',
    cues: [
      'Over a soft surface; fingertips only, the ball out in front',
      'Pick a spot on the wall behind the ball; keep the ball on it',
      'Move your hand round the ball; keep the ball in place',
      'Small, slow circles first; the grip shifts as the hand goes round',
      'Both directions, then the other hand',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 240,
  },
  {
    id: 'water.contact-butterfly',
    element: 'water',
    name: 'Contact Ball Butterfly',
    purpose: 'Moves the ball from palm to back of hand, then returns it.',
    dose: '2 min each hand',
    cues: [
      'Over a soft surface; the ball in an open, flat palm',
      'Turn the hand over while the ball rolls across the fingers',
      'It lands on the back of the hand; turn back to return it to the palm',
      'The hand turns under the ball, so the ball moves less than the hand',
      'Slow first, then the weaker hand',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 240,
  },

  // ─── Buugeng (S-staffs) ────────────────────────────────────────────────
  {
    id: 'water.buugeng-flips',
    element: 'water',
    name: 'Buugeng Turns (one staff)',
    purpose: 'Builds the wrist and finger skills all buugeng illusions need.',
    dose: '2 min each hand',
    cues: [
      'One S-staff, held at its centre, flat to the front',
      'Turn it with the fingers and the wrist; keep the elbow still',
      'Go slow enough to see each curve pass the top',
      'Both directions, then the other hand',
      'Keep the tips away from your face; drops are normal',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 240,
  },
  {
    id: 'water.buugeng-isolations',
    element: 'water',
    name: 'Buugeng Isolations',
    purpose:
      'Makes the shape appear to slide and change while your hand moves.',
    dose: '2 min each hand, then 2 min with both',
    cues: [
      'Each half of the S is an arc; find the centre of one arc',
      'Keep that point still; move your hand round it',
      'The curve seems to slide along a circle that stays in place',
      'Slow, flat to the front, both directions',
      'Then a staff in each hand, mirroring each other',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 360,
  },

  // ─── Double staff ──────────────────────────────────────────────────────
  {
    id: 'water.double-staff-windmill',
    element: 'water',
    name: 'Double Staff Windmills',
    purpose: 'Teaches you to spin two staffs at once, in time.',
    dose: '3 × 2 min',
    cues: [
      'Practice props only; clear an arm plus a staff all round, and above',
      'A staff in each hand, held at the centre, spinning flat to the front',
      'Same way, same time first; then mirrored, opposite ways: a butterfly',
      'Split time is a quarter turn: one staff upright while one is flat',
      'Keep the hands far enough apart that the ends never hit',
    ],
    targets: ['Flow', 'Coordination', 'Grip', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },
  {
    id: 'water.double-staff-weave',
    element: 'water',
    name: 'Double Staff Weave',
    purpose: 'The poi weave on two staffs: crossing arms and a steady count.',
    dose: '3 × 2 min',
    cues: [
      'Both staffs spinning forward beside you, out of step with each other',
      'Each staff turns on its own side, then crosses in front of the body',
      'Hands swap sides at chest height; keep the shoulders loose',
      'Count slowly out loud; add speed only once the count is even',
      'If you drop one, pick it up and restart the count',
    ],
    targets: ['Flow', 'Coordination', 'Grip', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },

  // ─── Any toy ───────────────────────────────────────────────────────────
  {
    id: 'water.flow-toy-round',
    element: 'water',
    name: 'Flow Round (any toy)',
    purpose: 'Links all your moves on one toy into nonstop flow.',
    dose: '3 tracks, back to back',
    cues: [
      'Practice props only; clear space around and above you',
      'Pick the tracks first; do not skip once you start',
      'Use easy recovery moves between hard tricks; keep moving',
      'After a drop, go straight into the next move; do not restart',
      'Change moves when the music changes',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'Conditioning', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 720,
  },
];
