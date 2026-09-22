import type {Exercise} from '../types';

/**
 * More flow props — the second batch of the rave's own training kit.
 *
 * Light gloves, flow flags, dragon staff, juggling and devil sticks, next
 * to the first batch in `flow.ts`. Each drill is gated by kit in
 * `domain/profile/kit.ts`, so only people who have ticked the prop are
 * offered it. Added 21 Sep 2026.
 *
 * Practice props only: soft or LED. Nothing here teaches fire.
 *
 * Every drill is standing work, so every drill carries "NoFloor". Light
 * gloves need no room at all and are the only props offered at the desk.
 *
 * Ids are stable — journal entries and custom circuits reference them.
 */
export const MORE_FLOW_DRILLS: Exercise[] = [
  // ─── Light gloves ──────────────────────────────────────────────────────
  {
    id: 'water.gloving-finger-rolls',
    element: 'water',
    name: 'Gloving Finger Rolls and Waves',
    purpose: 'The base light-show move: fingers moving one at a time.',
    dose: '3 × 1 min: each hand, then both together',
    cues: [
      'Wear gloves or use bare hands; the finger work is the same',
      'Palm up, hand open; curl the fingers in one at a time, then open them',
      'Move each finger just after the last, so the lights ripple',
      'Both directions: little finger first, then index finger first',
      'Waves: the same roll with the palm turned down',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
  },
  {
    id: 'water.gloving-tracing',
    element: 'water',
    name: 'Gloving Tracing and Figure 8s',
    purpose:
      'Draws clean lines of light and trains both hands to work together.',
    dose: '4 × 1 min: tracing, then figure 8s, each way',
    cues: [
      'Tracing: one fingertip slowly follows the outline of the other hand',
      'Thumb tip to index tip, then each finger in turn; keep that hand still',
      'Figure 8s: draw an 8 in front of you, one hand following the other',
      'Spread the fingers evenly so each light stays separate',
      'Use a mirror or a phone camera to see what a viewer sees',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 270,
  },
  {
    id: 'water.gloving-tutting',
    element: 'water',
    name: 'Gloving Finger Tutting',
    purpose: 'Sharp finger angles and box shapes, made on the beat.',
    dose: '3 × 1 min to a steady beat',
    cues: [
      'Bend the fingers to right angles: straight lines, square corners',
      'Build a box with both hands, then change it one finger at a time',
      'One shape per beat: move, stop, hold still until the next beat',
      'Face the shapes to the viewer or a mirror so the angles look flat',
      'Slow and exact first; add speed only while the corners stay square',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
  },

  // ─── Flow flags ────────────────────────────────────────────────────────
  {
    id: 'water.flag-spins',
    element: 'water',
    name: 'Flag Spins and Figure 8s',
    purpose: 'Teaches how flag cloth moves and how even speed keeps it open.',
    dose: '4 × 1 min: each hand, then both, each direction',
    cues: [
      'Practice props only; clear an arm plus a flag all round, and above',
      'One flag first, held near the end of the stick; turn it with the wrist',
      'Circles flat to the front, forward then backward; keep the plane',
      'Keep an even speed; if the cloth wraps, stop and shake it out',
      'Figure 8s: carry the circles across to the other side and back',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
  },
  {
    id: 'water.flag-weave',
    element: 'water',
    name: 'Flag Three-Beat Weave',
    purpose: 'The poi weave on flags: split time and arms that cross.',
    dose: '3 × 2 min: forward, reverse, forward',
    cues: [
      'Practice props only; clear an arm plus a flag all round, and above',
      'Both flags spin forward beside you, split time: one up, one down',
      'Each flag turns on its own side, then crosses to the far side and back',
      'Use bigger, slower circles; keep the hands near the chest',
      'If the flags tangle, stop, free them and restart the count slowly',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },

  // ─── Dragon staff ──────────────────────────────────────────────────────
  {
    id: 'water.dragon-staff-rolls',
    element: 'water',
    name: 'Dragon Staff Forearm Rolls',
    purpose: 'The first dragon staff skill: a staff that rolls along the arm.',
    dose: '3 × 1 min each arm: toward you, then away',
    cues: [
      'Practice staff only; shoes on; clear a staff length all round',
      'One arm out, palm up; lay the staff across the forearm at its middle',
      'Tilt the arm and let the staff roll; the spoked ends turn',
      'Toward you, keep the elbow low; away, let the hand drop a little',
      'Roll on the arms only, never the neck or head; catch the middle to stop',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },
  {
    id: 'water.dragon-staff-pass',
    element: 'water',
    name: 'Dragon Staff Chi Roll (arm to arm)',
    purpose: 'Keeps the staff rolling nonstop, passed from arm to arm.',
    dose: '3 × 2 min, both directions',
    cues: [
      'Practice staff only; learn forearm rolls on each arm first',
      'Arms out in front; the staff rolls across the forearms in turn',
      'Split time: one arm tilts to keep it rolling while the other resets',
      'Move the arms slowly and evenly; keep the ends turning',
      'Toward you and away; if you drop it, restart slowly',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },

  // ─── Juggling ──────────────────────────────────────────────────────────
  {
    id: 'water.juggling-cascade',
    element: 'water',
    name: 'Three-Ball Cascade',
    purpose: 'The basic juggling pattern, learned one ball at a time.',
    dose: '6 min: one ball, then two, then three',
    cues: [
      'Beanbags are easiest; elbows by the hips, palms up',
      'One ball: hand to hand in an arc that peaks about eye height',
      'Two: throw one; as it peaks, throw the other under it; catch both',
      'Three: start with two in one hand; throw each as the last one peaks',
      'Eyes on the peaks; throw from the middle, catch out to the side',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 360,
  },
  {
    id: 'water.juggling-two-in-one',
    element: 'water',
    name: 'Two Balls in One Hand',
    purpose: 'Trains each hand to juggle alone, especially the weaker hand.',
    dose: '3 × 1 min each hand',
    cues: [
      'Two balls in one hand; each throw peaks around eye height',
      'Throw one; as it peaks, throw the second; keep the rhythm even',
      'Outside circles: throw from the inside, catch out to the side',
      'Then inside circles; then columns: straight up, side by side',
      'Weaker hand first and last',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },

  // ─── Devil sticks ──────────────────────────────────────────────────────
  {
    id: 'water.devil-stick-idle',
    element: 'water',
    name: 'Devil Stick Idle (tick-tock)',
    purpose: 'The base move every devil stick trick starts and ends with.',
    dose: '3 × 2 min',
    cues: [
      'One end of the centre stick on the ground; hand sticks level in front',
      'Toss it from hand stick to hand stick and catch it: lift, do not hit',
      'Meet it above its middle, a third to halfway out toward the tip',
      'Move the hand sticks up and down only; keep the stick’s middle in place',
      'Once it lifts clear each time, keep it up with a slow, even rhythm',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },
  {
    id: 'water.devil-stick-flip',
    element: 'water',
    name: 'Devil Stick Flips (half and full)',
    purpose: 'Adds a flip in the air, then goes back to the idle.',
    dose: '3 × 1 min each hand',
    cues: [
      'From a steady idle, push and lift a little harder with one hand stick',
      'Half flip: an extra half turn in the air, then the other hand stick',
      'Full flip: a little more push, a whole extra turn before it lands',
      'Back into the idle after each flip; the middle stays in one place',
      'Lead with each hand; do an extra set with the weaker hand',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
  },
];
