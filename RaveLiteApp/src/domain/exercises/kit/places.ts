import type {Exercise} from '../types';

/**
 * Drills for things a place has: a bench, a rail, a beam, a playground
 * frame, sand, grass, a hallway, a stairwell, a kerb, a hill. Added
 * 21 Sep 2026, when kit grew into places.
 *
 * Each one is gated by kit in domain/profile/kit.ts, so a drill only
 * turns up for somebody whose place really has the thing it needs.
 *
 * The library's rules hold here too (guarded by
 * __tests__/library.test.ts). And two of this file's own: anything you
 * stand on, lean on or land on gets tested first, and nothing is ever
 * jumped down from.
 *
 * Ids are stable — journal entries and custom circuits reference them.
 */
export const PLACE_DRILLS: Exercise[] = [
  // ─── Bench — a park bench, a low wall, a sturdy box ────────────────────
  {
    id: 'earth.bench-step-up',
    element: 'earth',
    name: 'Bench Step-ups',
    purpose: 'Single-leg strength from a step higher than any stair.',
    dose: '3 × 8 each leg',
    cues: [
      'Test the bench first: it must not rock, slide or tip',
      'Whole foot on the bench, knee over the middle toes',
      'Drive up through that heel; the back foot does not push off',
      'Stand fully tall at the top',
      'Lower slowly on the same leg, the back foot landing quietly',
    ],
    targets: ['Strength', 'Agility', 'NoFloor'],
    venues: ['yard', 'neighborhood', 'house'],
    approxSeconds: 240,
  },
  {
    id: 'earth.bench-hip-thrust',
    element: 'earth',
    name: 'Bench Hip Thrusts',
    purpose:
      'Strong glutes pull a tipped pelvis level; few drills build them better.',
    dose: '3 × 12',
    cues: [
      'A fixed bench, or one against a wall so it cannot slide',
      'Shoulder blades on the edge, feet flat, shins upright at the top',
      'Ribs down, chin tucked; drive the hips up through the heels',
      'Stop at a straight line from knees to shoulders — no higher',
      'Squeeze and tilt the pelvis under at the top, then lower slowly',
    ],
    targets: ['APT', 'Strength'],
    venues: ['yard', 'house'],
    approxSeconds: 210,
  },
  {
    id: 'fire.bench-jump-up',
    element: 'fire',
    name: 'Bench Jump-ups',
    purpose: 'Jump power with a high landing, so the knees take less.',
    dose: '3 × 5, full rest',
    cues: [
      'Test the bench first: it must not rock, slide or tip',
      'Swing the arms and jump up, landing soft with the whole foot',
      'Stand up tall on top before anything else',
      'Step down, one foot at a time — never jump down',
      'Start low; go higher only when every landing is quiet',
    ],
    targets: ['Agility', 'Strength', 'NoFloor'],
    venues: ['yard', 'neighborhood'],
    approxSeconds: 240,
  },

  // ─── Rail — a railing, a post or a fence, waist to hip height ──────────
  {
    id: 'fire.rail-row',
    element: 'fire',
    name: 'Rail Rows',
    purpose:
      'A pull at any waist-high railing that draws rounded shoulders back.',
    dose: '3 × 8',
    cues: [
      'Test the rail with a hard pull before you lean your weight on it',
      'Hands shoulder-width; walk the feet under until the arms are straight',
      'Body straight from heels to head; pull the chest to the rail',
      'Shoulder blades back and down at the top, then lower slowly',
      'Feet further back makes it easier; further under, harder',
    ],
    targets: ['Strength', 'UCS', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 180,
  },
  {
    id: 'earth.rail-assisted-pistol',
    element: 'earth',
    name: 'Rail-Assisted Pistol Squats',
    purpose:
      'Builds toward a full one-leg squat, with the rail as a safety net.',
    dose: '3 × 5 each leg',
    cues: [
      'Stand side-on to the rail, one hand resting on it lightly',
      'Free leg reaches forward, heel just off the ground',
      'Sit back and down, knee over the middle toes, heel flat',
      'Only as deep as you can control; stand up without a bounce',
      'Over the weeks, let the hand do less until it only touches',
    ],
    targets: ['Strength', 'Agility', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 210,
  },
  {
    id: 'water.rail-hamstring-stretch',
    element: 'water',
    name: 'Rail Hamstring Stretch',
    purpose: 'Lengthens the backs of the legs: groundwork for high kicks.',
    dose: '2 × 30 sec each leg',
    cues: [
      'Heel on a rail or post low enough to keep both knees straight',
      'Hips square to the raised leg, standing foot pointing forward',
      'Hinge from the hip with a long spine until you feel the pull',
      'Breathe out slowly into it; no bouncing',
      'Raise the heel over weeks, never in one go',
    ],
    targets: ['Mobility', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 150,
  },

  // ─── Beam — a beam, a log, a low wall, a board on the ground ───────────
  {
    id: 'earth.beam-walk',
    element: 'earth',
    name: 'Beam Walk',
    purpose:
      'Balance on a narrow edge: ankles, hips and eyes learn to work as one.',
    dose: '4 lengths: 2 forwards, 2 backwards',
    cues: [
      'Start low: a board on the ground, a log, a kerb',
      'Heel to toe, arms out wide at first, then quieter',
      'Eyes on the far end, not your feet',
      'Walk it backwards once forwards feels easy',
      'Losing it? Step off on purpose, then step back on',
    ],
    targets: ['Coordination', 'Agility', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 150,
  },
  {
    id: 'earth.cat-balance',
    element: 'earth',
    name: 'Cat Balance',
    purpose:
      'A crawl along a narrow top: trunk, shoulders and balance at once.',
    dose: '3 × 3 m (10 ft)',
    cues: [
      'Start low and wide: a log or a low wall; a rail comes later',
      'Hands and feet on top, hips no higher than the shoulders',
      'Opposite hand and foot move together, slow and deliberate',
      'Eyes a little ahead of the hands',
      'Come back the same way once forwards is steady',
    ],
    targets: ['Coordination', 'Strength', 'Core'],
    venues: ['standing'],
    approxSeconds: 150,
  },
  {
    id: 'fire.precision-jumps',
    element: 'fire',
    name: 'Precision Jumps',
    purpose: 'Teaches you to land exactly where you aim and stay there.',
    dose: '3 × 5 jumps',
    cues: [
      'Start short: a line, a kerb or a low beam about a step away',
      'Feet together, swing the arms and jump',
      'Land on the balls of the feet, knees soft; hold it for 2 sec',
      'Wobbled or stepped? Too far — come in closer',
      'Move the target out only once every landing sticks',
    ],
    targets: ['Agility', 'Coordination', 'NoFloor'],
    venues: ['yard', 'neighborhood'],
    approxSeconds: 240,
  },

  // ─── Playground frame — monkey bars, parallel bars ─────────────────────
  {
    id: 'fire.monkey-bar-traverse',
    element: 'fire',
    name: 'Monkey Bar Traverse',
    purpose: 'Grip and shoulders that carry you along, not just hold you up.',
    dose: '3 lengths, full rest',
    cues: [
      'Test the hang point first: every bar solid, none of them spinning',
      'Shoulders active, pulled down a little, not hanging off the ears',
      'Hand over hand; a small swing from the hips carries you on',
      'Drop off before the grip fails, knees bent, and land soft',
      'Skip a rung only once every rung comes easy',
    ],
    targets: ['Grip', 'Strength'],
    venues: ['porch'],
    approxSeconds: 240,
  },
  {
    id: 'fire.parallel-bar-dips',
    element: 'fire',
    name: 'Parallel Bar Dips',
    purpose: 'Presses nearly your whole weight, far more than a push-up.',
    dose: '3 × 5',
    cues: [
      'Check the bars first: solid, dry and not loose',
      'Jump to straight arms, shoulders pushed down away from the ears',
      'Lean slightly forward; lower until the upper arms are about level',
      'Press back up to straight arms; stop short if a shoulder pinches',
      'No reps yet? Jump to the top, lower slowly, then step down',
    ],
    targets: ['Strength'],
    venues: ['standing'],
    approxSeconds: 210,
  },
  {
    id: 'earth.bar-l-sit',
    element: 'earth',
    name: 'Bar L-sit',
    purpose:
      'Bars give the legs room to hang, the easiest place to build an L-sit.',
    dose: '3 × 10–15 sec',
    cues: [
      'Check the bars, then press up to straight, locked arms',
      'Shoulders pushed down away from the ears, chest up',
      'Lift the knees to the chest and hold',
      'Straighten one leg, then both, toward an L as it gets easier',
      'Lower the feet slowly; no dropping',
    ],
    targets: ['Core', 'Strength'],
    venues: ['standing'],
    approxSeconds: 150,
  },

  // ─── Sand — a beach, a sandpit, a long-jump pit ────────────────────────
  {
    id: 'fire.sand-sprints',
    element: 'fire',
    name: 'Sand Sprints',
    purpose:
      'Sand soaks up the bounce, so legs and lungs work harder per stride.',
    dose: '6 × 20 m (22 yd), walk back',
    cues: [
      'Much harder than grass: shorter sprints for the same effort',
      'High knees and quick arms; short, fast steps',
      'Stay up on the balls of the feet; do not reach with the heel',
      'Walk back to the start — the walk is the rest',
      'Barefoot? Check the sand for glass and shells first',
    ],
    targets: ['Conditioning', 'Agility', 'PFT-Run'],
    venues: ['yard'],
    approxSeconds: 360,
  },
  {
    id: 'earth.sand-walk-barefoot',
    element: 'earth',
    name: 'Barefoot Sand Walk',
    purpose: 'Soft sand makes the small muscles of the feet and ankles work.',
    dose: '5 min',
    cues: [
      'Check the sand for glass, shells and anything sharp first',
      'Barefoot, toes spread wide; let the foot sink and grip',
      'Walk tall at an easy pace; soft, deep sand is the harder work',
      'Feet that live in shoes tire fast; build the minutes slowly',
    ],
    targets: ['Agility', 'Mobility', 'NoFloor'],
    venues: ['yard'],
    approxSeconds: 300,
  },
  {
    id: 'fire.sand-broad-jumps',
    element: 'fire',
    name: 'Sand Broad Jumps',
    purpose: 'Jump as far as you can and let the sand take the landing.',
    dose: '6 jumps, full rest',
    cues: [
      'Feet hip-width; swing the arms back and hinge the hips',
      'Throw the arms forward and jump out as far as you can',
      'Land on both feet, knees bent, and stick it without a step',
      'Walk back and rest until you feel fresh again',
      'Take off from the firm edge if there is one; sand saps the spring',
    ],
    targets: ['Agility', 'Strength', 'NoFloor'],
    venues: ['yard'],
    approxSeconds: 180,
  },

  // ─── Soft ground — grass, a mat, sand ──────────────────────────────────
  {
    id: 'fire.shoulder-roll',
    element: 'fire',
    name: 'Shoulder Roll',
    purpose: 'Turns a fall into a roll that spares the head, neck and wrists.',
    dose: '5 each side',
    cues: [
      'Grass, sand or a thick mat; start kneeling, a crouch comes later',
      'Right foot forward, right arm curved in front, chin to the left',
      'Roll from the right shoulder across the back to the left hip',
      'Never over the head or neck — it stays tucked to the side',
      'Come up facing the way you rolled; then do the left side',
    ],
    targets: ['Agility', 'Coordination'],
    venues: ['yard', 'mat'],
    approxSeconds: 150,
  },
  {
    id: 'fire.breakfall',
    element: 'fire',
    name: 'Back Breakfall',
    purpose: 'Teaches the body to fall backwards with the head kept safe.',
    dose: '8 reps',
    cues: [
      'Start sitting on soft ground; from a squat once it is easy',
      'Chin tucked to the chest the whole way',
      'Round the back and roll down it; never land flat',
      'Arms straight, slap the ground at about 45° as the back lands',
      'Breathe out on the slap',
    ],
    targets: ['Agility', 'Coordination'],
    venues: ['yard', 'mat'],
    approxSeconds: 120,
  },
  {
    id: 'fire.cartwheel',
    element: 'fire',
    name: 'Cartwheel',
    purpose:
      'Straight arms, a strong trunk, and knowing where you are upside down.',
    dose: '5 each side',
    cues: [
      'Plenty of room on grass or sand; circle the wrists first',
      'Start in a lunge facing along a line, arms up',
      'Hand, hand, foot, foot, all on the line',
      'Arms straight, eyes on the ground between the hands',
      'Not there yet? Bunny-hop bent legs over beside the hands',
    ],
    targets: ['Agility', 'Coordination', 'Strength'],
    venues: ['yard'],
    approxSeconds: 180,
  },

  // ─── Hallway — a long, straight run indoors ────────────────────────────
  {
    id: 'fire.hallway-shuttles',
    element: 'fire',
    name: 'Hallway Shuttles',
    purpose: 'Short, hard efforts with sharp turns, and no need to go out.',
    dose: '6 × 20 sec, 40 sec rest',
    cues: [
      'Clear the floor and warn anyone home',
      'Shoes with grip, not socks on a hard floor',
      'Run end to end and touch the floor at each turn',
      'Turn low, knees bent, short steps into and out of it',
      'Stop the round early if the turns get sloppy',
    ],
    targets: ['Conditioning', 'Agility', 'NoFloor'],
    venues: ['house'],
    approxSeconds: 330,
  },
  {
    id: 'earth.walking-lunges',
    element: 'earth',
    name: 'Walking Lunges',
    purpose: 'Leg strength one side at a time, with balance in every step.',
    dose: '3 × 20 steps',
    cues: [
      'Long step; lower until the back knee nearly touches the ground',
      'Torso tall, hands on the hips or loose at the sides',
      'Front knee tracks over the middle toes',
      'Push through the front heel and step straight into the next',
      'Turn at the end and come back the other way',
    ],
    targets: ['Strength', 'Agility', 'NoFloor'],
    venues: ['house', 'yard'],
    approxSeconds: 240,
  },
  {
    id: 'earth.crawl-lines',
    element: 'earth',
    name: 'Crawl Lines',
    purpose: 'Three crawls, one line: the trunk holds while every limb works.',
    dose: '2 rounds: bear, crab, lizard',
    cues: [
      'Bear crawl forward: knees an inch off, hips level with the shoulders',
      'Crab walk back: belly up, hips lifted off the ground',
      'Lizard crawl forward: chest low, knee up toward the same elbow',
      'Quiet hands and feet the whole way; slow is fine',
    ],
    targets: ['Core', 'Coordination', 'Conditioning'],
    venues: ['house', 'yard'],
    approxSeconds: 240,
  },

  // ─── Stairwell — several flights, like a block of flats ────────────────
  {
    id: 'fire.stair-sprints',
    element: 'fire',
    name: 'Stair Sprints',
    purpose:
      'Short, hard climbs for the heart and legs; the walk down is rest.',
    dose: '5 × 2–3 flights, walk down',
    cues: [
      'Run up, whole foot on every step, eyes up the flight',
      'Walk down with a hand on the rail',
      'Keep to one side; other people use these stairs',
      'Rest at the bottom until the breath settles',
      'Stop before the feet get clumsy',
    ],
    targets: ['Conditioning', 'Strength', 'PFT-Run', 'NoFloor'],
    venues: ['house'],
    approxSeconds: 540,
  },
  {
    id: 'fire.stair-bounds',
    element: 'fire',
    name: 'Stair Bounds',
    purpose: 'Two steps a stride turns a climb into power work for the legs.',
    dose: '4 × 1 flight, walk down',
    cues: [
      'Two steps at a time, whole foot landing on each',
      'Drive the arms and the front knee up',
      'A steady rhythm, not a scramble, close to the rail',
      'Walk down holding the rail',
      'Stop when a foot clips an edge or lands short',
    ],
    targets: ['Agility', 'Strength', 'NoFloor'],
    venues: ['house'],
    approxSeconds: 240,
  },

  // ─── Kerb ──────────────────────────────────────────────────────────────
  {
    id: 'earth.heel-drops',
    element: 'earth',
    name: 'Heel Drops',
    purpose:
      'Slow lowering toughens calves and Achilles for running and landing.',
    dose: '3 × 10 each leg',
    cues: [
      'A step edge or a quiet kerb, away from traffic',
      'Balls of the feet on the edge, a hand on something for balance',
      'Rise up on both feet, then lift one',
      'Lower on the other for a slow 3 count, heel below the edge',
      'Back up on two feet; sharp pain means stop',
    ],
    targets: ['Strength', 'Agility', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 360,
  },
  {
    id: 'fire.kerb-lateral-hops',
    element: 'fire',
    name: 'Kerb Hops',
    purpose: 'Quick, light feet side to side: the footwork under every dodge.',
    dose: '3 × 20 sec',
    cues: [
      'A quiet street or a painted line; watch for traffic',
      'Feet together, hop side to side over the kerb',
      'Light and fast, on the balls of the feet',
      'Eyes up, arms loose',
      'Stop the set when the feet get loud or slow',
    ],
    targets: ['Agility', 'Coordination', 'NoFloor'],
    venues: ['neighborhood'],
    approxSeconds: 150,
  },

  // ─── Hill ──────────────────────────────────────────────────────────────
  {
    id: 'fire.uphill-bounds',
    element: 'fire',
    name: 'Uphill Bounds',
    purpose:
      'Big strides up a slope build leg power, and the hill softens landings.',
    dose: '6 × 20 m (22 yd), walk down',
    cues: [
      'A moderate hill, on grass or a smooth path',
      'Exaggerate every stride: drive the knee up and forward',
      'Push off the ball of the back foot and float a moment',
      'Arms drive opposite the legs, big and loose',
      'Walk all the way down to recover before the next',
    ],
    targets: ['Strength', 'Agility', 'PFT-Run', 'NoFloor'],
    venues: ['neighborhood', 'yard'],
    approxSeconds: 360,
  },
  {
    id: 'air.hill-walk',
    element: 'air',
    name: 'Nose-Breathing Hill Walk',
    purpose: 'Climbing on the nose alone teaches you to pace by breath.',
    dose: '15 min: up briskly, down easy',
    cues: [
      'Mouth closed from the bottom to the top',
      'Walk up briskly and tall: hips under you, not bent at the waist',
      'Need your mouth? Slow down until you do not',
      'Walk down easy and let the breath settle before the next climb',
    ],
    targets: ['Breath', 'Conditioning', 'NoFloor'],
    venues: ['neighborhood'],
    approxSeconds: 900,
  },
];
