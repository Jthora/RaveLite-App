import {Exercise} from './types';

/**
 * Seed library. Curated for the operator's specific corrections:
 *   - UCS (Upper Crossed Syndrome): forward head, rounded shoulders
 *   - Hourglass Syndrome (chronic abdominal gripping)
 *   - APT (Anterior Pelvic Tilt) with hyperlordosis
 *   - USSF PFT prep (target: B+)
 *   - Staff/sword flow arts at beat
 *
 * "NoFloor" tag flags drills that work without a clean mat — many of the
 * dirty-property workarounds rely on standing or wall variants.
 *
 * Keep entries terse. Volume comes later — seed quality > seed quantity.
 */
export const EXERCISE_LIBRARY: Exercise[] = [
  // ─── AIR — Breath & Posture ────────────────────────────────────────────
  {
    id: 'air.chin-tuck',
    element: 'air',
    name: 'Chin Tuck',
    purpose: 'Wakes deep neck flexors. The single most efficient UCS counter.',
    dose: '3 × 10 (5 sec hold)',
    cues: [
      'Imagine a string pulling the crown of your head straight up',
      'Slide the head back, not down — keep eyes level',
      'Feel a stretch at the base of the skull',
    ],
    targets: ['UCS', 'Mobility', 'NoFloor'],
    venues: ['desk', 'standing'],
    approxSeconds: 60,
  },
  {
    id: 'air.wall-angels',
    element: 'air',
    name: 'Wall Angels',
    purpose: 'Reverses rounded shoulders. Wakes lower & mid trapezius.',
    dose: '2 × 10 slow reps',
    cues: [
      'Heels, butt, upper back, head all touching wall',
      'Backs of hands on the wall — keep them there',
      'Slide arms overhead without losing wall contact',
    ],
    targets: ['UCS', 'Mobility', 'NoFloor'],
    venues: ['wall'],
    approxSeconds: 90,
  },
  {
    id: 'air.crocodile-breathing',
    element: 'air',
    name: 'Crocodile Breathing',
    purpose:
      'Re-teaches diaphragmatic breath. Direct antidote to abdominal gripping.',
    dose: '3 min',
    cues: [
      'Lie face down — forehead on stacked hands (or use a clean towel)',
      'Breathe into the lower back and sides, not the chest',
      'The belly should press into the floor on the inhale',
    ],
    targets: ['Hourglass', 'Breath'],
    venues: ['mat'],
    approxSeconds: 180,
  },
  {
    id: 'air.standing-belly-release',
    element: 'air',
    name: 'Standing Belly Release',
    purpose:
      'Floor-free version of crocodile breathing for desk + outdoor use.',
    dose: '60 sec',
    cues: [
      'Stand tall, hands on lower belly and lower back',
      'Let the belly soft-protrude on inhale — do not suck in',
      'Inhale 4 / Exhale 6 through the nose',
    ],
    targets: ['Hourglass', 'Breath', 'NoFloor'],
    venues: ['desk', 'standing'],
    approxSeconds: 60,
  },
  {
    id: 'air.doorway-pec-stretch',
    element: 'air',
    name: 'Doorway Pec Stretch',
    purpose: 'Releases tight pec major/minor — the front half of UCS.',
    dose: '2 × 30 sec each side',
    cues: [
      'Forearm on doorframe, elbow at shoulder height',
      'Step through, rotate chest away',
      'Soft front ribs — do not flare',
    ],
    targets: ['UCS', 'Mobility', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 120,
  },
  {
    id: 'air.coherence-breath',
    element: 'air',
    name: 'Coherence Breath',
    purpose: 'Vagal tone + presence. 5.5 sec in, 5.5 sec out.',
    dose: '3-5 min',
    cues: [
      'Soft belly. Soft jaw. Soft shoulders.',
      'Through the nose if possible',
      'Anchor: count 1-2-3-4-5-6 in, 1-2-3-4-5-6 out',
    ],
    targets: ['Breath', 'Presence', 'NoFloor'],
    venues: ['desk', 'standing'],
    approxSeconds: 240,
  },

  // ─── EARTH — Foundation & Alignment ────────────────────────────────────
  {
    id: 'earth.posterior-pelvic-tilt',
    element: 'earth',
    name: 'Standing Posterior Pelvic Tilt',
    purpose: 'Direct anti-APT pattern. Teaches the pelvis to neutral.',
    dose: '3 × 10 (3 sec hold)',
    cues: [
      'Stand with butt, upper back, head against wall',
      'Flatten lower back into the wall by tilting pelvis up',
      'Squeeze glutes lightly — do not hold breath',
    ],
    targets: ['APT', 'Strength', 'NoFloor'],
    venues: ['wall'],
    approxSeconds: 90,
  },
  {
    id: 'earth.glute-bridge',
    element: 'earth',
    name: 'Glute Bridge',
    purpose:
      'Wakes glutes (the prime mover that goes silent under APT/desk work).',
    dose: '3 × 12',
    cues: [
      'Posterior tilt before lift — drive through heels',
      'Ribs down, do not flare into hyperextension at top',
      'Squeeze glutes hard, hold 2 sec at top',
    ],
    targets: ['APT', 'Strength'],
    venues: ['mat'],
    approxSeconds: 120,
  },
  {
    id: 'earth.couch-stretch',
    element: 'earth',
    name: 'Couch Stretch',
    purpose: 'Opens hip flexors — the tight-side of the APT cross.',
    dose: '90 sec each leg',
    cues: [
      'Rear shin against wall/couch, front foot planted',
      'Squeeze rear glute, posterior tilt — feel the front of the hip',
      'Tall torso, no leaning forward to fake range',
    ],
    targets: ['APT', 'Mobility'],
    venues: ['wall', 'mat'],
    approxSeconds: 180,
  },
  {
    id: 'earth.standing-hip-airplane',
    element: 'earth',
    name: 'Standing Hip Airplane',
    purpose: 'Single-leg hip control. Carries straight into staff stance work.',
    dose: '2 × 8 each side',
    cues: [
      'Hinge from one hip, free leg extended back',
      'Rotate the pelvis open and closed slowly',
      'Stance leg knee soft, foot tripod',
    ],
    targets: ['APT', 'Coordination', 'NoFloor'],
    venues: ['standing', 'yard'],
    approxSeconds: 120,
  },
  {
    id: 'earth.deadbug',
    element: 'earth',
    name: 'Dead Bug',
    purpose: 'Trains anti-extension core without sucking the belly in.',
    dose: '3 × 8 each side',
    cues: [
      'Lower back glued to floor — if it rises, shrink the range',
      'Exhale on the reach',
      'Belly soft and engaged, never gripped',
    ],
    targets: ['APT', 'Hourglass', 'Strength'],
    venues: ['mat'],
    approxSeconds: 120,
  },

  // ─── FIRE — Power & Conditioning (USSF PFT focus) ──────────────────────
  {
    id: 'fire.pushups',
    element: 'fire',
    name: 'Pushups (PFT pace)',
    purpose: 'USSF PFT — 1 minute max. Build to B+ band for your age class.',
    dose: '1 min AMRAP',
    cues: [
      'Hands shoulder-width, body one line, ribs down',
      'Chest to fist height, full lockout',
      'Cadence: smooth, no rushed reps that lose form',
    ],
    targets: ['PFT-Pushups', 'Strength'],
    venues: ['standing', 'yard'],
    approxSeconds: 60,
  },
  {
    id: 'fire.situps',
    element: 'fire',
    name: 'Situps (PFT pace)',
    purpose: 'USSF PFT — 1 minute max. Watch for abdominal-gripping pattern.',
    dose: '1 min AMRAP',
    cues: [
      'Exhale on the way up, do not brace by sucking in',
      'Hands cross chest, elbows touch thighs',
      'Heels stay planted',
    ],
    targets: ['PFT-Situps', 'Strength'],
    venues: ['mat'],
    approxSeconds: 60,
  },
  {
    id: 'fire.run-1.5',
    element: 'fire',
    name: '1.5 Mile Run',
    purpose: 'USSF PFT cardio. Build aerobic base before pushing pace.',
    dose: '1.5 mi for time',
    cues: [
      'Warm up 5 min easy + 4 strides first',
      'Even splits — first half should feel comfortable',
      'Nasal breathing if zone 2, mouth + nose for tempo',
    ],
    targets: ['PFT-Run'],
    venues: ['yard'],
    approxSeconds: 900,
  },
  {
    id: 'fire.wall-pushups',
    element: 'fire',
    name: 'Wall Pushup Burst',
    purpose: 'Desk-friendly Fire micro for mid-workday capacity.',
    dose: '20 reps',
    cues: [
      'Hands at shoulder height, feet stepped back',
      'One line head to heels — same plank as floor pushups',
      'Slow eccentric, fast concentric',
    ],
    targets: ['PFT-Pushups', 'Strength', 'NoFloor'],
    venues: ['wall', 'desk'],
    approxSeconds: 60,
  },
  {
    id: 'fire.kick-flow',
    element: 'fire',
    name: 'Kick Flow (front/round/side)',
    purpose: 'Hip power + balance. Connects PFT capacity to flow performance.',
    dose: '3 × 30 sec',
    cues: [
      'Plant foot screws into the ground',
      'Knee leads — chamber, extend, re-chamber',
      'Stay tall, do not collapse the pelvis on the kick side',
    ],
    targets: ['Strength', 'Coordination'],
    venues: ['yard'],
    approxSeconds: 180,
  },

  // ─── WATER — Flow & Music ──────────────────────────────────────────────
  {
    id: 'water.figure-8',
    element: 'water',
    name: 'Staff Figure-8 (each hand)',
    purpose: 'Foundation flow shape. Builds wrist + grip endurance.',
    dose: '60 sec each hand',
    cues: [
      'Lead with the wrist, not the elbow',
      'Loose grip, fingers like a cradle',
      'Match cadence to a slow 4/4 — every loop on the beat',
    ],
    targets: ['Flow', 'Coordination'],
    venues: ['yard', 'standing'],
    approxSeconds: 120,
  },
  {
    id: 'water.beat-locks',
    element: 'water',
    name: 'Beat Locks',
    purpose:
      'Match a flow shape exactly to the kick drum. Trains music attunement.',
    dose: '1 song',
    cues: [
      'Pick a song with a clear 4-on-the-floor pattern',
      'One chosen shape per kick — no improvisation yet',
      'Eyes soft, do not watch the staff',
    ],
    targets: ['Flow', 'Coordination', 'Presence'],
    venues: ['yard'],
    approxSeconds: 240,
  },
  {
    id: 'water.sword-form-slow',
    element: 'water',
    name: 'One-Handed Sword Form (slow)',
    purpose:
      'Free-hand independence. Keep the off-hand alive — mudra, posture, balance.',
    dose: '3 passes',
    cues: [
      'Sword hand and free hand never both still — counterbalance always',
      'Wrist circles between cuts — no dead transitions',
      'Half-tempo first, double next, then to beat',
    ],
    targets: ['Flow', 'Coordination'],
    venues: ['yard'],
    approxSeconds: 300,
  },
  {
    id: 'water.album-no-drop',
    element: 'water',
    name: 'No-Drop Album',
    purpose:
      'Endurance benchmark. Continuous flow for an entire album, no drops.',
    dose: '1 album',
    cues: [
      'Pick the album in advance — no shuffling mid-flow',
      'Recovery shapes between heavy combos — keep moving',
      'If the staff drops, log it. Do not stop.',
    ],
    targets: ['Flow', 'Coordination', 'Presence'],
    venues: ['yard'],
    approxSeconds: 2400,
  },

  // ─── HEART — Integration & Cadence ─────────────────────────────────────
  {
    id: 'heart.morning-intent',
    element: 'heart',
    name: 'Morning Intent',
    purpose: 'Set the day. Name one element to lean into and one to honor.',
    dose: '2 min',
    cues: [
      'Stand. Breathe coherence pace 6 cycles.',
      'Name today\'s leading element out loud',
      'Name one specific thing you will not skip',
    ],
    targets: ['Presence', 'NoFloor'],
    venues: ['standing', 'desk'],
    approxSeconds: 120,
  },
  {
    id: 'heart.mirror-presence',
    element: 'heart',
    name: 'Mirror Presence',
    purpose: 'Performance presence — being watched without flinching.',
    dose: '90 sec',
    cues: [
      'Stand in front of a mirror, eye contact with self',
      'Soft jaw, soft belly, tall crown',
      'No phone, no music — just witnessing',
    ],
    targets: ['Presence', 'NoFloor'],
    venues: ['standing'],
    approxSeconds: 90,
  },
  {
    id: 'heart.evening-review',
    element: 'heart',
    name: 'Evening Review',
    purpose: 'Close the loop. What landed, what was skipped, what tomorrow.',
    dose: '3 min',
    cues: [
      'Three sentences, spoken or written',
      'No self-flagellation — observation only',
      'Choose tomorrow\'s leading element before sleep',
    ],
    targets: ['Presence'],
    venues: ['desk', 'standing'],
    approxSeconds: 180,
  },
  {
    id: 'heart.pulse-check',
    element: 'heart',
    name: 'Pulse Check',
    purpose:
      'Mid-day reset. The reminder engine\'s default Heart micro-drill.',
    dose: '30 sec',
    cues: [
      'Where is the breath right now? Move it lower.',
      'Where is the belly? If gripped — release.',
      'Where is the crown? Lift it.',
    ],
    targets: ['Presence', 'Hourglass', 'UCS', 'NoFloor'],
    venues: ['desk', 'standing'],
    approxSeconds: 30,
  },
];

export const exercisesFor = (element: Exercise['element']): Exercise[] =>
  EXERCISE_LIBRARY.filter(e => e.element === element);
