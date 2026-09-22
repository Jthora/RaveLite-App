import type {Exercise} from '../types';
import type {MoveId} from '../moves';

/**
 * Light gloves, flow flags and dragon staff curricula — the path from
 * first shapes and rolls to full shows and body rolls, ordered basic →
 * intermediate → advanced within each prop.
 *
 * These sit beside the first drills in `kit/flowMore.ts` (gloving finger
 * rolls, tracing and tutting; flag spins and the three-beat weave; dragon
 * staff forearm rolls and the chi roll), which are slotted into the same
 * path. Moves carry the names practitioners use in tutorials, and each
 * `dose` is the Standard chart. Added 21 Sep 2026.
 *
 * Practice props only: soft or LED.
 *
 * Gloving needs no room at all: it is hand-scale, offered at the desk,
 * and works the same with bare hands. Flags and dragon staff swing and
 * roll a long prop around the body, so they map to the staff move and a
 * low ceiling or an office rules them out. Every drill is standing work
 * and carries "NoFloor".
 *
 * Ids are stable — journal entries and custom circuits reference them.
 */
export const GLOVING_DRILLS: Exercise[] = [
  // ─── Basic ─────────────────────────────────────────────────────────────
  {
    id: 'water.gloving-stacking',
    element: 'water',
    name: 'Gloving Stacks',
    purpose: 'Layers the hands in rungs of light, the simplest shape to build.',
    dose: '3 × 1 min: climb up, climb down, then to a beat',
    cues: [
      'One hand flat in front of you, palm down, fingers together',
      'Lay the other hand on top of it in exactly the same shape',
      'The lower hand comes out and lays on top; keep layering to climb',
      'Then climb down the same way; the layers stay level and even',
      'Slow first, then one layer to each beat',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'basic',
  },
  {
    id: 'water.gloving-liquid',
    element: 'water',
    name: 'Gloving Liquid (hand waves)',
    purpose: 'Teaches the hands to flow round each other with no hard edges.',
    dose: '3 × 1 min to a slow track',
    cues: [
      'Fingertips of both hands loosely together; wrists soft',
      'Roll the wrists and fingers so a wave passes through both hands',
      'One hand flows over, under and round the other, never stopping',
      'Then send the wave from one hand, along the arms, to the other',
      'No corners: every shape melts into the next',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'basic',
  },
  {
    id: 'water.gloving-digits',
    element: 'water',
    name: 'Gloving Digits',
    purpose: 'Small, exact finger shapes: the control a viewer sees up close.',
    dose: '3 × 1 min: each hand, then both together',
    cues: [
      'Start simple: bend the fingers at the middle knuckle, tips level',
      'Digit roll: line the two hands up together, fingers matching',
      'Bend each finger in turn at that knuckle, then back the other way',
      'Only the working finger moves; the rest of the hand stays still',
      'Slow and exact first; add speed only while each shape stays clean',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'basic',
  },
  {
    id: 'water.gloving-whips',
    element: 'water',
    name: 'Gloving Underhand Whips',
    purpose: 'Throws light out toward the viewer in wide, trailing circles.',
    dose: '3 × 1 min: each hand leads, both directions',
    cues: [
      'A finger roll from little finger to index as the wrist turns over',
      'The other hand repeats it, passing underneath the first',
      'Big circles: the bigger the circle, the longer the trail',
      'Out toward the viewer and back; wrists loose, elbows easy',
      'Place the whips high, low and to each side, so they never look alike',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'basic',
  },
  {
    id: 'water.gloving-light-show',
    element: 'water',
    name: 'Gloving Light Show for a Viewer',
    purpose:
      'Puts the moves in front of a person, the way a light show is given.',
    dose: '3 × 1 min shows, to a mirror or a friend',
    cues: [
      'Ask first; a light show is offered, never forced',
      'About an arm’s length away, and never touch the viewer',
      'Keep bright lights from pointing straight into their eyes',
      'Start slow and simple, follow the beat, finish with a clear end',
      'No viewer? A mirror or phone camera in a dim room shows their view',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 240,
    tier: 'basic',
  },

  // ─── Intermediate ──────────────────────────────────────────────────────
  {
    id: 'water.gloving-flails',
    element: 'water',
    name: 'Gloving Flails',
    purpose: 'Draws rings of light from the wrists, open-handed and wide.',
    dose: '3 × 1 min, both directions',
    cues: [
      'Fingers open and extended, spread evenly',
      'Circle the hands from the wrists; the lights draw rings',
      'Both wrists travel outward, then back to the front, and repeat',
      'Then from the elbows: bigger rings at the same even speed',
      'Both directions; the fingers stay open the whole time',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'intermediate',
  },
  {
    id: 'water.gloving-dials',
    element: 'water',
    name: 'Gloving Dials',
    purpose: 'Shows finger independence: one finger turning onto the next.',
    dose: '3 × 1 min: each hand, then both',
    cues: [
      'Start from a finger stack: fingertips of both hands lined up',
      'One finger swings over in a half circle and lands on another',
      'Land it exactly, pause, then dial the next one',
      'Slow and precise; the rest of the hand stays quiet',
      'Then drop dials in between digits and tuts, as a link',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'intermediate',
  },
  {
    id: 'water.gloving-king-tuts',
    element: 'water',
    name: 'Gloving King Tuts',
    purpose: 'Takes tutting from the fingers to the arms, to fill the space.',
    dose: '3 × 1 min to a steady beat',
    cues: [
      'Forearms and upper arms at right angles: big, square boxes',
      'One shape per beat: move, land it, hold still until the next',
      'Use the space round you: above, beside and out in front',
      'Then set finger tuts inside the arm shapes',
      'Square corners first; speed only while they stay square',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'intermediate',
  },
  {
    id: 'water.gloving-contours',
    element: 'water',
    name: 'Gloving Contours',
    purpose: 'One hand flows over the other, like water over a rock.',
    dose: '3 × 1 min: each hand leads',
    cues: [
      'One hand holds still, a solid shape in front of you',
      'The other flows over its surface, close but never gripping',
      'Swap: the flowing hand sets solid and the still one flows',
      'Trace along the arms and round the body as well as the hands',
      'Slow and smooth, so the viewer sees the shape you trace',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'intermediate',
  },
  {
    id: 'water.gloving-wave-tuts',
    element: 'water',
    name: 'Gloving Wave Tuts',
    purpose: 'Joins liquid to tutting, with finger rolls between the boxes.',
    dose: '3 × 1 min to one track',
    cues: [
      'Build a tut shape and hold it square',
      'Leave it through a finger roll, a wave across the hand',
      'Land the next shape at the end of the roll, square again',
      'Smooth waves, sharp shapes: the contrast is the move',
      'The motion never breaks between one box and the next',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'intermediate',
  },

  // ─── Advanced ──────────────────────────────────────────────────────────
  {
    id: 'water.gloving-infinite-roll',
    element: 'water',
    name: 'Gloving Infinite Finger Roll',
    purpose: 'A finger roll that seems never to end, passed between the hands.',
    dose: '3 × 1 min, both directions',
    cues: [
      'Clean finger rolls on each hand first',
      'As one hand ends its roll, the other comes round to meet it',
      'The index fingers join and the roll carries on in the new hand',
      'The point where the index fingers meet stays fixed in the air',
      'Slow until the join cannot be seen; then the other direction',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'advanced',
  },
  {
    id: 'water.gloving-spacing-depth',
    element: 'water',
    name: 'Gloving Tech: Spacing and Depth',
    purpose: 'Takes a flat show into 3D: near, far, high, low and wide.',
    dose: '3 × 1 min: one move, carried everywhere',
    cues: [
      'Spacing: fingers evenly spread, so each light reads as its own point',
      'Depth: bring the hands toward the viewer, then draw them away',
      'Levels: take the same move from low down to above the head',
      'Width: use the whole reach of the arms, left and right',
      'At chest height in one spot, even clean moves read flat',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 210,
    tier: 'advanced',
  },
  {
    id: 'water.gloving-phrasing',
    element: 'water',
    name: 'Gloving to the Phrase',
    purpose: 'Shapes a sequence to the music’s phrase, not only to its beat.',
    dose: '3 min to one track',
    cues: [
      'Listen first: where does the music change? A phrase ends there',
      'Build a sequence that fills one phrase and lands on its end',
      'Sharp shapes on the accents; liquid through the smooth parts',
      'Change concept when the music changes, not in mid-phrase',
      'Keep the biggest moment for the drop',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 180,
    tier: 'advanced',
  },
  {
    id: 'water.gloving-blending',
    element: 'water',
    name: 'Gloving Blending Concepts',
    purpose: 'Runs the concepts together, so the show never stops to change.',
    dose: '3 × 2 min',
    cues: [
      'Pick three concepts, such as liquid, tuts and whips',
      'Find a way from each one into each of the others',
      'Finger rolls and waves are the usual bridges',
      'Then one in each hand at once: tuts in one, liquid in the other',
      'No resets: if a move breaks, flow out of it into another',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 390,
    tier: 'advanced',
  },
  {
    id: 'water.gloving-full-show',
    element: 'water',
    name: 'Gloving Full Light Show',
    purpose: 'A whole show for one viewer: open, build, peak and wind down.',
    dose: '1 track (3–5 min)',
    cues: [
      'Ask first; an arm’s length away, no touching, no light in the eyes',
      'Open slow and simple to set the tone; look up at them now and then',
      'Build: more concepts, more speed, more depth and levels',
      'Peak on the biggest moment in the music',
      'Wind down slow and smooth, and finish clean',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 300,
    tier: 'advanced',
  },
];

/**
 * Flow flags: spin flags on short sticks, not colour-guard. Written
 * material on spin flags is thin; most of what it teaches is poi and club
 * swinging on a flag, so this path keeps to those shared moves and leaves
 * out tosses, stalls and wraps, which a cloth makes unreliable.
 */
export const FLAGS_DRILLS: Exercise[] = [
  // ─── Basic ─────────────────────────────────────────────────────────────
  {
    id: 'water.flag-split-time',
    element: 'water',
    name: 'Flag Same Time and Split Time',
    purpose: 'Teaches two flags to keep time: together, then one up, one down.',
    dose: '4 × 1 min: same time, split time, forward and backward',
    cues: [
      'Practice props only; clear an arm plus a flag all round, and above',
      'A flag in each hand, both spinning forward beside you',
      'Same time: both flags at the top together, then both at the bottom',
      'Split time: one at the top while the other is at the bottom',
      'Then backward; an even speed keeps both cloths open',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
    tier: 'basic',
  },
  {
    id: 'water.flag-overhead',
    element: 'water',
    name: 'Flag Overhead Circles',
    purpose: 'Takes the flag flat above the head, into the overhead plane.',
    dose: '4 × 1 min: each hand, each direction',
    cues: [
      'Practice props only; check the space above you is clear',
      'One flag above the head, circling flat like a ceiling fan',
      'The wrist turns it; the arm stays up and relaxed',
      'Even speed keeps it open; if it wraps, stop and shake it out',
      'Each hand, both directions; lower the arm if the shoulder tires',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
    tier: 'basic',
  },
  {
    id: 'water.flag-butterfly',
    element: 'water',
    name: 'Flag Butterfly',
    purpose: 'Mirrors the two flags in front of you, driven from the wrists.',
    dose: '4 × 1 min, alternating direction',
    cues: [
      'Practice props only; clear an arm plus a flag all round',
      'Hands in front of the chest, a little apart; flags flat to the front',
      'Opposite directions, together time: each flag mirrors the other',
      'They pass at the top and bottom on slightly different planes',
      'The wrists drive it; down the middle, then up the middle',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
    tier: 'basic',
  },

  // ─── Intermediate ──────────────────────────────────────────────────────
  {
    id: 'water.flag-two-beat-weave',
    element: 'water',
    name: 'Flag Two-Beat Weave',
    purpose: 'The weave with a crossing on every beat: arms cross and uncross.',
    dose: '3 × 2 min: forward, backward, forward',
    cues: [
      'Practice props only; clear an arm plus a flag all round, and above',
      'Both flags forward beside you, split time',
      'Each flag turns once on its own side, then once on the far side',
      'The arms cross and uncross with every turn; hands near the chest',
      'Lead with either arm on top; slow and even keeps the cloths apart',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
    tier: 'intermediate',
  },
  {
    id: 'water.flag-reels',
    element: 'water',
    name: 'Flag Reels (hip and shoulder)',
    purpose: 'Teaches the flags to travel round you, in front and behind.',
    dose: '4 × 1 min: hip and shoulder, each direction',
    cues: [
      'Practice props only; clear an arm plus a flag all round',
      'Both flags flat to the front, same way, same time',
      'Carry the circles from in front of you to behind you, then back',
      'Hip height first, then shoulder height; the planes stay flat',
      'Slow enough to feel where the cloths are; both directions',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
    tier: 'intermediate',
  },
  {
    id: 'water.flag-inspin-flowers',
    element: 'water',
    name: 'Flag Inspin Flowers',
    purpose: 'Joins the arm circle and the flag circle, turning the same way.',
    dose: '4 × 1 min: each hand, each direction',
    cues: [
      'Practice props only; clear an arm plus a flag all round',
      'One flag flat to the front; the arm traces a big, even circle',
      'Flag and arm turn the same way: it spins as the arm goes round',
      'Count the flag turns to each arm circle and keep the count even',
      'Both hands, both directions, then both flags together',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
    tier: 'intermediate',
  },

  // ─── Advanced ──────────────────────────────────────────────────────────
  {
    id: 'water.flag-antispin-flowers',
    element: 'water',
    name: 'Flag Antispin Flowers',
    purpose: 'Arm and flag turn opposite ways, and the cloth draws petals.',
    dose: '4 × 1 min: each hand, each direction',
    cues: [
      'Practice props only; learn inspin flowers first',
      'One flag flat to the front; the arm circles one way, the flag the other',
      'Four petals: three flag turns to one arm circle; count them',
      'If the petals smear or the cloth wraps, slow the arm down',
      'Both hands and both directions, then both flags',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
    tier: 'advanced',
  },
  {
    id: 'water.flag-weave-turns',
    element: 'water',
    name: 'Flag Weave Turns',
    purpose:
      'Turns the body while the flags keep spinning: forward becomes reverse.',
    dose: '3 × 2 min, turning both ways',
    cues: [
      'Practice props only; clear an arm plus a flag all round, and above',
      'Both flags forward beside you, split time',
      'Step round to face the other way; the flags keep turning in place',
      'Now they spin backward to you; turn back and they are forward again',
      'Turn left and right; slow turns first, then out of a weave',
    ],
    targets: ['Flow', 'Coordination', 'Agility', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
    tier: 'advanced',
  },
  {
    id: 'water.flag-flow-round',
    element: 'water',
    name: 'Flag Flow Round',
    purpose: 'Joins the flag moves into flow and carries on through tangles.',
    dose: '1 track (3–5 min)',
    cues: [
      'Practice props only; clear an arm plus a flag all round, and above',
      'Mix spins, weaves, butterflies, reels and flowers to one track',
      'Change move when the music changes, not in the middle of a phrase',
      'A tangle is part of practice: free it and step straight back in',
      'Keep the feet moving; the flags follow the body',
    ],
    targets: ['Flow', 'Coordination', 'Presence', 'Conditioning', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 300,
    tier: 'advanced',
  },
];

/**
 * Dragon staff: a contact staff with spoked ends that rolls over the body
 * and is not held. Heavy, so shoes on and soft ground under you. The neck
 * roll sits at the very end of the path, reached through full-arm rolls,
 * with a stop cue.
 */
export const DRAGON_STAFF_DRILLS: Exercise[] = [
  // ─── Basic ─────────────────────────────────────────────────────────────
  {
    id: 'water.dragon-staff-two-arm',
    element: 'water',
    name: 'Dragon Staff Two-Arm Rolls',
    purpose: 'Rolls the staff on both forearms, the arms moving as one.',
    dose: '3 × 1 min: toward you, then away',
    cues: [
      'Practice staff only; shoes on; clear a staff length all round',
      'Arms out in front, shoulder-width apart, palms up',
      'The staff lies across both forearms, its middle between them',
      'Tilt both arms together; it rolls and the spoked ends turn',
      'Toward you, then away; catch it at the middle to stop',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 210,
    tier: 'basic',
  },
  {
    id: 'water.dragon-staff-palms-down',
    element: 'water',
    name: 'Dragon Staff Palms-Down Rolls',
    purpose:
      'Rolls the staff along the back of the arm: the other side of arm work.',
    dose: '3 × 1 min each arm: toward you, then away',
    cues: [
      'Practice staff only; shoes on; grass or soft ground under you',
      'One arm out, palm down; the staff across the back of the forearm',
      'Raise or lower the hand to slope the arm; the staff rolls along it',
      'Small, early tilts; the spoked ends turn like wheels',
      'Each arm, both ways; catch it at the middle to stop',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
    tier: 'basic',
  },
  {
    id: 'water.dragon-staff-hand-rolls',
    element: 'water',
    name: 'Dragon Staff Hand Rolls',
    purpose: 'Carries a forearm roll onto the open hand and back again.',
    dose: '3 × 1 min each hand',
    cues: [
      'Practice staff only; start from a steady forearm roll',
      'Hand open and flat, fingers together, palm up',
      'Let the staff roll off the wrist onto the palm, toward the fingers',
      'Tilt the hand back before the fingertips; it rolls home to the arm',
      'Less room than on the arm, so smaller, earlier tilts; each hand',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
    tier: 'basic',
  },

  // ─── Intermediate ──────────────────────────────────────────────────────
  {
    id: 'water.dragon-staff-full-arm',
    element: 'water',
    name: 'Dragon Staff Full-Arm Rolls',
    purpose: 'Rolls the staff the whole length of the arm, hand to shoulder.',
    dose: '3 × 1 min each arm, both directions',
    cues: [
      'Practice staff only; shoes on; clear a staff length all round',
      'Arm straight out, palm up; the staff starts at the hand',
      'Raise the hand; it rolls past the elbow and up the upper arm',
      'Keep the arm straight and the shoulder low, so the path stays smooth',
      'Stop at the shoulder and bring it back; the neck comes much later',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 390,
    tier: 'intermediate',
  },
  {
    id: 'water.dragon-staff-palm-spin',
    element: 'water',
    name: 'Dragon Staff Palm Spins',
    purpose: 'Spins the staff flat on an open palm: the first level spin.',
    dose: '4 × 1 min: each hand, each direction',
    cues: [
      'Practice staff only; nobody within a staff length of you',
      'Staff flat, its middle on your upturned palm, fingers spread',
      'Push one end round to start it turning on the palm',
      'The palm stays under the middle; small hand circles keep it going',
      'Each hand, both directions; slow down if the staff tips',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 270,
    tier: 'intermediate',
  },

  // ─── Advanced ──────────────────────────────────────────────────────────
  {
    id: 'water.dragon-staff-rewinds',
    element: 'water',
    name: 'Dragon Staff Rewinds',
    purpose: 'Reverses a roll without stopping it, so the flow can turn back.',
    dose: '3 × 1 min: each arm, then arm to arm',
    cues: [
      'Practice staff only; steady rolls in both directions first',
      'On one arm, let it roll, then tilt the other way before the end',
      'It slows, pauses for an instant and rolls back; no grabbing',
      'Then in an arm-to-arm roll: reverse it and keep it going',
      'Small, early tilts; a late one throws the staff off the arm',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 210,
    tier: 'advanced',
  },
  {
    id: 'water.dragon-staff-turns',
    element: 'water',
    name: 'Dragon Staff Turns With Rolls',
    purpose: 'Keeps the staff rolling while the body turns underneath it.',
    dose: '3 × 1 min, turning each way',
    cues: [
      'Practice staff only; a staff length clear all round; grass underfoot',
      'Start a steady arm-to-arm roll in front of the chest',
      'Step round slowly; the arms and the roll turn with you',
      'Quarter turns first, then half turns, then a full turn',
      'Both ways; stop and reset if you get dizzy or the roll wobbles',
    ],
    targets: ['Flow', 'Coordination', 'Agility', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 210,
    tier: 'advanced',
  },
  {
    id: 'water.dragon-staff-neck-roll',
    element: 'water',
    name: 'Dragon Staff Neck Roll',
    purpose: 'Rolls the staff up one arm, behind the neck and down the other.',
    dose: '3 × 5 passes, each way',
    cues: [
      'Practice staff only; full-arm rolls to each shoulder come first',
      'Start bent forward, arms wide: it crosses the upper back, not the neck',
      'Guide it by hand at first; then let it roll from arm to arm',
      'Chin tucked, head down; stand a little taller only as it smooths out',
      'Stop if it touches the head, or anything in the neck hurts',
    ],
    targets: ['Flow', 'Coordination', 'NoFloor'],
    venues: ['yard', 'standing'],
    approxSeconds: 300,
    tier: 'advanced',
  },
];

/** Pictogram and limit class for each gloving move: hand-scale. */
export const GLOVING_MOVES: Readonly<Record<string, MoveId>> = {
  'water.gloving-stacking': 'activity',
  'water.gloving-liquid': 'activity',
  'water.gloving-digits': 'activity',
  'water.gloving-whips': 'activity',
  'water.gloving-light-show': 'activity',
  'water.gloving-flails': 'activity',
  'water.gloving-dials': 'activity',
  'water.gloving-king-tuts': 'activity',
  'water.gloving-contours': 'activity',
  'water.gloving-wave-tuts': 'activity',
  'water.gloving-infinite-roll': 'activity',
  'water.gloving-spacing-depth': 'activity',
  'water.gloving-phrasing': 'activity',
  'water.gloving-blending': 'activity',
  'water.gloving-full-show': 'activity',
};

/** Pictogram and limit class for each flag move: needs room. */
export const FLAGS_MOVES: Readonly<Record<string, MoveId>> = {
  'water.flag-split-time': 'staff',
  'water.flag-overhead': 'staff',
  'water.flag-butterfly': 'staff',
  'water.flag-two-beat-weave': 'staff',
  'water.flag-reels': 'staff',
  'water.flag-inspin-flowers': 'staff',
  'water.flag-antispin-flowers': 'staff',
  'water.flag-weave-turns': 'staff',
  'water.flag-flow-round': 'staff',
};

/** Pictogram and limit class for each dragon staff move: needs room. */
export const DRAGON_STAFF_MOVES: Readonly<Record<string, MoveId>> = {
  'water.dragon-staff-two-arm': 'staff',
  'water.dragon-staff-palms-down': 'staff',
  'water.dragon-staff-hand-rolls': 'staff',
  'water.dragon-staff-full-arm': 'staff',
  'water.dragon-staff-palm-spin': 'staff',
  'water.dragon-staff-rewinds': 'staff',
  'water.dragon-staff-turns': 'staff',
  'water.dragon-staff-neck-roll': 'staff',
};
