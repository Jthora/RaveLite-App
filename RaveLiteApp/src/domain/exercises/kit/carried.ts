import type {Exercise} from '../types';

/**
 * Drills for things a person carries from place to place: a resistance
 * band, a skipping rope, a ball, water jugs, a sandbag.
 *
 * Each is gated by kit in `domain/profile/kit.ts`, so nobody without the
 * thing is ever offered it.
 *
 * Added 21 Sep 2026.
 */
export const CARRIED_DRILLS: Exercise[] = [
  // ─── Resistance band ───────────────────────────────────────────────────
  {
    id: 'air.band-pull-apart',
    element: 'air',
    name: 'Band Pull-Aparts',
    purpose: 'Wakes the mid back and rear shoulders that sitting switches off.',
    dose: '3 × 15',
    cues: [
      'Arms straight out at shoulder height, hands shoulder-width on the band',
      'Pull the band apart until it touches the chest',
      'Squeeze the shoulder blades together; shoulders down, not shrugged',
      'Return slowly — do not let the band snap you back',
    ],
    targets: ['UCS', 'Strength', 'NoFloor'],
    venues: ['desk', 'standing'],
    approxSeconds: 120,
  },
  {
    id: 'air.band-face-pull',
    element: 'air',
    name: 'Band Face Pulls',
    purpose:
      'Pulls the shoulders back and turns them out: the desk hunch in reverse.',
    dose: '3 × 12',
    cues: [
      'Anchor the band at face height: a post, a railing or a playground bar',
      'In a door: knot on the hinge side, door shut and opening away from you',
      'Step back until taut; pull to the face with the elbows high and wide',
      'Finish with the thumbs pointing back beside the ears; pause a second',
      'Let it back out slowly; ribs down, no leaning back',
    ],
    targets: ['UCS', 'Strength', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 150,
  },
  {
    id: 'air.band-dislocate',
    element: 'air',
    name: 'Shoulder Pass-Throughs',
    purpose:
      'Takes the shoulders through their full circle to open a tight chest.',
    dose: '2 × 10 slow reps',
    cues: [
      'A band or a staff works: hold it much wider than the shoulders',
      'Arms straight, lift it up over the head and back behind you',
      'Bring it back over the same way; ribs down, do not arch the low back',
      'Narrow the grip a little only when the pass feels easy',
      'Never force it — if an elbow bends or a shoulder pinches, go wider',
    ],
    targets: ['Mobility', 'UCS', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 90,
  },
  {
    id: 'earth.banded-glute-bridge',
    element: 'earth',
    name: 'Banded Glute Bridge',
    purpose:
      'Adds the side glutes to the bridge and teaches the knees to stay out.',
    dose: '3 × 12',
    cues: [
      'Band just above the knees, feet flat and hip-width apart',
      'Press the knees out against the band and keep them there',
      'Ribs down, tilt the pelvis under, then drive up through the heels',
      'Squeeze the glutes for a second at the top; lower slowly',
    ],
    targets: ['APT', 'Strength'],
    venues: ['mat'],
    approxSeconds: 150,
  },
  {
    id: 'earth.band-clamshell',
    element: 'earth',
    name: 'Band Clamshells',
    purpose: 'Wakes the side glute that steadies the pelvis on every step.',
    dose: '2 × 15 each side',
    cues: [
      'Lie on your side, band just above the knees, knees bent, heels together',
      'Stack the hips; a hand on the top hip keeps it honest',
      'Open the top knee without letting the pelvis roll back',
      'Pause at the top, close slowly; stop where the hip starts to turn',
    ],
    targets: ['APT', 'Strength'],
    venues: ['mat'],
    approxSeconds: 180,
  },
  {
    id: 'earth.band-lateral-walk',
    element: 'earth',
    name: 'Band Lateral Walk',
    purpose:
      'Side-hip strength that keeps the knees tracking and the pelvis level.',
    dose: '3 × 10 steps each way',
    cues: [
      'Band just above the knees; around the ankles is harder',
      'Half-squat, chest up, toes pointing forward',
      'Step sideways, then bring the other foot in without losing tension',
      'Feet never touch, knees never cave; go both directions',
    ],
    targets: ['APT', 'Strength', 'NoFloor'],
    venues: ['standing', 'house'],
    approxSeconds: 150,
  },
  {
    id: 'fire.band-row',
    element: 'fire',
    name: 'Seated Band Row',
    purpose:
      'Pulling strength for the upper back when there is nothing to hang from.',
    dose: '3 × 12',
    cues: [
      'Sit tall, legs straight, band looped around the soles of the feet',
      'Hold the ends with the arms long; shorten the band for more pull',
      'Row the hands to the lower ribs, elbows close to the body',
      'Shoulder blades back and down; pause a second',
      'Stay upright — no leaning back to finish the rep',
    ],
    targets: ['Strength', 'UCS'],
    venues: ['mat'],
    approxSeconds: 150,
  },
  {
    id: 'fire.band-pushup',
    element: 'fire',
    name: 'Banded Push-Ups',
    purpose:
      'Adds load at the top of the push-up, where plain reps stop working you.',
    dose: '3 × 8',
    cues: [
      'Band across the upper back, an end pinned under each hand',
      'Hands under the shoulders, body in one straight line',
      'Chest to a fist from the floor, then press to a hard lockout',
      'Push the floor away at the top so the shoulder blades spread',
      'Form going? Drop the band and finish with plain push-ups',
    ],
    targets: ['Strength', 'PFT-Pushups'],
    venues: ['mat'],
    approxSeconds: 150,
  },
  {
    id: 'fire.band-assisted-pullup',
    element: 'fire',
    name: 'Band-Assisted Pull-Ups',
    purpose:
      'Full pull-ups before you can do one alone; the band makes up the rest.',
    dose: '4 × 5',
    cues: [
      'Test the hang point first: load it with your feet still down',
      'Loop the band over a high bar or beam and back through itself',
      'From a stable step or chair, put a foot or a knee in the loop',
      'Start from a full hang; pull until the chin passes the bar or beam',
      'Lower slowly to a full hang; ease out of the loop so it cannot snap',
    ],
    targets: ['Strength', 'Grip'],
    venues: ['porch'],
    approxSeconds: 240,
  },

  // ─── Skipping rope ─────────────────────────────────────────────────────
  {
    id: 'fire.skip-rope',
    element: 'fire',
    name: 'Skipping Rope',
    purpose:
      'Springy ankles and a raised heart rate from a rope that fits a pocket.',
    dose: '3 × 1 min',
    cues: [
      'Check the space: clear room overhead and all around the rope',
      'Elbows in by the ribs; the wrists turn the rope, not the arms',
      'Small hops on the balls of the feet, just high enough to clear it',
      'Heels kiss the ground, never slam; stay tall and relaxed',
    ],
    targets: ['Conditioning', 'Agility', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 240,
  },
  {
    id: 'fire.skip-rope-intervals',
    element: 'fire',
    name: 'Skipping Intervals',
    purpose:
      'Hard rounds and short rests: conditioning that fits into ten minutes.',
    dose: '8 rounds: 30 sec on, 30 sec off',
    cues: [
      'Clear room overhead; warm up with a minute of easy bouncing',
      'On: skip as fast as you can while staying smooth',
      'Off: let the rope hang, walk, and breathe through the nose',
      'Trip? Reset and keep going — the clock keeps running',
      'Stop early if the last rounds fall apart; quality over count',
    ],
    targets: ['Conditioning', 'Agility', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 540,
  },
  {
    id: 'air.boxer-skip',
    element: 'air',
    name: 'Boxer Skip',
    purpose:
      'A foot-to-foot rhythm you can hold for minutes on nose breathing alone.',
    dose: '3 × 2 min',
    cues: [
      'Clear room overhead, then find the rhythm with a few basic bounces',
      'Shift your weight onto one foot, then the other: one rope pass each',
      'Keep it low and quiet; the free foot barely leaves the ground',
      'Shoulders loose and down, elbows in, wrists turning the rope',
      'Breathe through the nose; if the mouth opens, slow the rope',
    ],
    targets: ['Agility', 'Coordination', 'Conditioning', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 450,
  },
  {
    id: 'fire.double-under-progression',
    element: 'fire',
    name: 'Double-Under Progression',
    purpose:
      'Two rope passes in one jump, built up a single attempt at a time.',
    dose: '10 single attempts over 5 min',
    cues: [
      'Check the room overhead, then settle into a basic bounce',
      'Every few bounces, hop a little higher and whip the wrists faster',
      'Try for two passes under that one hop, then back to basic bounce',
      'Tall body, legs nearly straight — no piking, no tucking the knees',
      'Stop when attempts get sloppy; this is a skill, not a workout',
    ],
    targets: ['Agility', 'Conditioning', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 300,
  },

  // ─── Ball ──────────────────────────────────────────────────────────────
  {
    id: 'air.ball-pec-release',
    element: 'air',
    name: 'Ball Pec Release',
    purpose:
      'Loosens pec minor, the chest muscle that tips the shoulder forward.',
    dose: '60 sec each side',
    cues: [
      'Face a wall or doorframe, ball just under the collarbone, armpit side',
      'Lean in until it is tender but not sharp; breathe slowly',
      'Slide the arm slowly up and down the wall to work into the spot',
      'Stay off the armpit and the collarbone; tingling means move the ball',
    ],
    targets: ['UCS', 'Mobility', 'NoFloor'],
    venues: ['wall'],
    approxSeconds: 150,
  },
  {
    id: 'water.ball-glute-release',
    element: 'water',
    name: 'Ball Glute Release',
    purpose: 'Frees the deep hip muscles that a long day in a chair locks up.',
    dose: '90 sec each side',
    cues: [
      'Sit with the ball under one glute, hands behind you on the mat',
      'Cross that ankle over the other knee to open the spot',
      'Roll slowly; pause on a tender spot and breathe until it eases',
      'Stay off the sit bone and the spine; tingling down the leg means move',
    ],
    targets: ['Mobility', 'APT'],
    venues: ['mat'],
    approxSeconds: 210,
  },

  // ─── Water jugs ────────────────────────────────────────────────────────
  {
    id: 'earth.jug-farmer-carry',
    element: 'earth',
    name: 'Jug Farmer Carry',
    purpose:
      'Grip, core and posture under load, from what is already in the kitchen.',
    dose: '4 × 30 m (100 ft)',
    cues: [
      'Caps tight; a full 4 L (1 gal) jug in each hand, about 4 kg (9 lb)',
      'Stand tall, shoulders down and back, arms long at the sides',
      'Short, quick steps; ribs down, breathe normally',
      'Too easy? Walk farther, or stop and hold still for 20 sec mid-lap',
    ],
    targets: ['Grip', 'Strength', 'Core', 'NoFloor'],
    venues: ['yard', 'house', 'neighborhood'],
    approxSeconds: 240,
  },
  {
    id: 'earth.jug-goblet-squat',
    element: 'earth',
    name: 'Jug Goblet Squat',
    purpose:
      'A load at the chest pulls you upright and lets the squat go deeper.',
    dose: '3 × 12',
    cues: [
      'Caps tight; hug one full jug at the chest, hands on its sides',
      'Feet a little wider than the hips, toes turned out slightly',
      'Sit down between the heels, elbows inside the knees',
      'Chest up, heels down; stand by pushing the floor away',
    ],
    targets: ['Strength', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 150,
  },
  {
    id: 'fire.jug-row',
    element: 'fire',
    name: 'Jug Bent-Over Row',
    purpose:
      'Strengthens the upper back that holds the shoulders back all day.',
    dose: '3 × 12',
    cues: [
      'A jug in each hand; soft knees, hinge at the hips, back flat',
      'Arms hang straight down, neck long, eyes on the floor ahead',
      'Row the jugs to the hips, elbows brushing the sides',
      'Pause a second with the shoulder blades squeezed; lower slowly',
    ],
    targets: ['Strength', 'UCS', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 150,
  },

  // ─── Sandbag ───────────────────────────────────────────────────────────
  {
    id: 'earth.sandbag-bear-hug-carry',
    element: 'earth',
    name: 'Sandbag Bear Hug Carry',
    purpose:
      'An awkward load hugged to the chest: the whole trunk has to brace.',
    dose: '4 × 30 m (100 ft)',
    cues: [
      'Squat down to the bag and lift it with the legs, back flat',
      'Hug it high on the chest, arms wrapped all the way around',
      'Walk tall; brace the trunk as if someone is about to push you',
      'Breathe behind the brace: short breaths, belly stays firm',
      'Set it down the same way it came up',
    ],
    targets: ['Strength', 'Core', 'Grip', 'NoFloor'],
    venues: ['yard', 'neighborhood'],
    approxSeconds: 240,
  },
  {
    id: 'earth.sandbag-zercher-squat',
    element: 'earth',
    name: 'Sandbag Zercher Squat',
    purpose:
      'Load in the elbows keeps the torso upright and makes the trunk work.',
    dose: '3 × 8',
    cues: [
      'From a squat, roll the bag onto the thighs, then into the elbows',
      'Hands clasped, bag held tight to the body, chest up',
      'Brace, then squat as deep as the torso can stay upright',
      'Stand by driving through the whole foot',
      'Elbows sore? Wrap the bag in a towel or wear long sleeves',
    ],
    targets: ['Strength', 'Core', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 180,
  },
  {
    id: 'fire.sandbag-shouldering',
    element: 'fire',
    name: 'Sandbag Shouldering',
    purpose:
      'Floor to shoulder in one move: hip power for lifting awkward things.',
    dose: '3 × 6 (alternating shoulders)',
    cues: [
      'Straddle the bag, hinge down with a flat back, hands underneath it',
      'Pull it up onto the thighs, then drive the hips forward hard',
      'Hip drive pops it onto one shoulder; the arms guide, they do not curl',
      'Set it back down under control; never drop it on anything that matters',
      'Alternate shoulders each rep; stop when the hips stop doing the work',
    ],
    targets: ['Strength', 'Conditioning'],
    venues: ['yard'],
    approxSeconds: 240,
  },
];
