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
    purpose:
      'The move most poi flow grows from: split time and arms that cross.',
    dose: '3 × 2 min: forward, reverse, forward',
    cues: [
      'Practice props only; clear space around and above you',
      'Both poi forward and split time: one up while the other is down',
      'Each poi crosses over the other arm, then under it, then back out',
      'Hands stay close in front of the chest; shoulders loose',
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
    purpose: 'Shows how the arm circle and the poi circle add up to one shape.',
    dose: '4 × 1 min: inspin, antispin, each direction',
    cues: [
      'One poi first, wall plane, the arm tracing a big even circle',
      'Inspin: poi and arm turn the same way. Antispin: opposite ways',
      'Four-petal antispin: three poi turns to one arm circle; count them',
      'Keep the plane; if the petals smear, slow the arm down',
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
    purpose:
      'The base hoop flow returns to: a steady rhythm driven from the trunk.',
    dose: '3 × 1 min each direction',
    cues: [
      'Feet staggered, one ahead of the other, knees soft',
      'Set the hoop level against the back and throw it round',
      'Push forward and back as it passes: push-push, not hip circles',
      'A bigger, heavier hoop turns slower and is easier to keep up',
      'The off direction will feel wrong; that direction is the practice',
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
      'Trains the illusion under most hoop tricks: a hoop that hangs still.',
    dose: '3 × 1 min each hand',
    cues: [
      'A smaller hoop helps: 84 cm (33 in) across or less',
      'Hoop upright in front of you, flat to the front, hand at the top',
      'Eyes on its centre; that point stays still in the air',
      'Slowly, the hand circles the centre; the hoop does not spin in the hand',
      'When the wrist runs out of turn, open the hand and re-grip',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 360,
  },
  {
    id: 'water.hoop-flow-round',
    element: 'water',
    name: 'Hoop Flow Round',
    purpose:
      'Joins the moves into flow and teaches you to carry on through drops.',
    dose: '1 track (3–5 min)',
    cues: [
      'Practice props only; clear space around and above you',
      'Mix waist hooping, hand spins and isolations to one track',
      'Change move when the music changes, not in the middle of a phrase',
      'A drop is part of practice: pick it up into the next move',
      'Keep the feet moving; the hoop follows the body',
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
    purpose:
      'Teaches the fans to travel around the body without losing the plane.',
    dose: '4 × 1 min: hip and shoulder, each direction',
    cues: [
      'Practice props only; clear space around you',
      'Both fans flat to the front, circling the same way at the same time',
      'Carry the circles from in front of you to behind you, then back',
      'Hip height first, then shoulder height; the planes stay flat',
      'Slow enough to feel where the fans are; both directions',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
  },
  {
    id: 'water.fan-isolations',
    element: 'water',
    name: 'Fan Isolations',
    purpose: 'Trains the still point that makes a fan look like it floats.',
    dose: '3 × 1 min each hand',
    cues: [
      'One fan first, its face flat to the front',
      'The centre of the fan is the still point; keep your eyes on it',
      'The arm orbits that point while the fan turns in place',
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
    purpose: 'The first wand illusion, and a lesson in smooth, slow hands.',
    dose: '5 min',
    cues: [
      'Set up the thread as the instructions for your wand say',
      'Wand upright; the thread hand draws small, level circles',
      'The thread runs round the top of the wand and stays taut',
      'The free hand moves as if it steers the wand: that is the illusion',
      'Smooth and slow; a sudden move swings the wand and shows the thread',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 300,
  },
  {
    id: 'water.wand-orbit',
    element: 'water',
    name: 'Levitation Wand Orbits',
    purpose: 'Carries the float around you, so the wand seems to follow.',
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
    purpose:
      'Rope control from the ground up: length, plane and rhythm, each side.',
    dose: '3 × 1 min each side',
    cues: [
      'Soft end only: a tennis ball knotted in a sock, never a hard dart',
      'Clear 3 m (10 ft) all round, and keep people out of it',
      'Spin a vertical wheel beside you, the rope through a loose fist',
      'Hold the tail in the other hand; let out only what you control',
      'Right side, then left; face and head stay out of the line',
    ],
    targets: ['Flow', 'Coordination', 'Grip', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },
  {
    id: 'water.rope-dart-wraps',
    element: 'water',
    name: 'Rope Dart Wraps and Releases',
    purpose: 'Teaches the body to catch the rope and send it back out.',
    dose: '5 wraps each on arm and leg, each side',
    cues: [
      'Soft end only; clear 3 m (10 ft) all round',
      'From a slow wheel, let the rope meet the forearm and wrap',
      'Two or three turns, then unwind the way it came; no yanking',
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
    purpose: 'Wakes up the fingers and the palm, and needs no room at all.',
    dose: '1 min each direction, each hand',
    cues: [
      'Over a soft surface: a dropped acrylic ball is heavy and hard',
      'Palm flat and open, the ball resting in the middle',
      'Fingers and thumb lift in turn to roll it round the palm',
      'Eyes soft; the hand stays level and the fingers do the work',
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
      'The hand travels round the ball, not the ball round the hand',
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
    purpose: 'Teaches the ball to cross the hand: palm to back and back again.',
    dose: '2 min each hand',
    cues: [
      'Over a soft surface; the ball in an open, flat palm',
      'Turn the hand over while the ball rolls across the fingers',
      'It lands on the back of the hand; turn back to bring it home',
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
    purpose:
      'Builds the wrist and finger work that every buugeng illusion rests on.',
    dose: '2 min each hand',
    cues: [
      'One S-staff, held at its centre, flat to the front',
      'Turn it through the fingers and the wrist; the elbow stays quiet',
      'Slow enough to see each curve pass the top',
      'Both directions, then the other hand',
      'Keep the tips clear of the face; a drop is part of practice',
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
      'Makes the shape seem to slide and morph while the hand does the moving.',
    dose: '2 min each hand, then 2 min with both',
    cues: [
      'Each half of the S is an arc; find the centre of one arc',
      'Keep that point still; the hand travels round it',
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
    purpose: 'Teaches two hands to spin at once and keep time with each other.',
    dose: '3 × 2 min',
    cues: [
      'Practice props only; clear arm plus staff all round, and above',
      'A staff in each hand, held at the centre, spinning flat to the front',
      'Same way, same time first; then mirrored, opposite ways: a butterfly',
      'Split time is a quarter turn: one staff upright while one is flat',
      'Hands wide enough apart that the ends never meet',
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
      'Hands trade sides at chest height; shoulders loose',
      'Count it slowly out loud; add speed only once the count is clean',
      'A drop is part of practice: pick it up and restart the count',
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
    purpose: 'Joins everything you know on a toy into flow that does not stop.',
    dose: '3 tracks, back to back',
    cues: [
      'Practice props only; clear space around and above you',
      'Pick the tracks first — no skipping once you start',
      'Recovery shapes between hard tricks; keep moving',
      'Recover each drop straight into the next move, not a restart',
      'The music is the coach: change when it changes',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'Conditioning', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 720,
  },
];
