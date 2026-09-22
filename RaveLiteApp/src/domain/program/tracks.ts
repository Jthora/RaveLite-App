import type {Track, TrackId} from './types';

/**
 * Track catalog — the movements the Daily Sets program spreads across
 * the day. Kit-bound: bodyweight, desk edge, doorframe, mat, porch edge,
 * bricks.
 *
 * Programming rules baked in here:
 *   - Every push is balanced by a pull (Row daily at the desk, Pull on
 *     the porch) so pushing volume never deepens rounded shoulders.
 *   - Legs and trunk flexion train on alternating days; crunch volume is
 *     deliberately capped — belly fat goes with food and total movement,
 *     not crunch count.
 *   - Explosive work (jumps, sprints, kicks) is NOT a track. It needs a
 *     warm-up and fresh legs, so it lives in the backyard session.
 *   - Sets start at ~50% of max: never to failure, always crisp.
 *   - Posture and Breath (Air), Mobility (Water) and Stillness (Core) run
 *     every day in small sets, so every element gets real volume in the
 *     rounds, not just a partner drill now and then.
 *   - Each round ends with a partner from another element — a chest
 *     opener after pushing, a hip opener after squats, a breath after
 *     trunk work — so Air, Water and Heart ride along with the strength.
 */

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const TRACKS: Track[] = [
  {
    id: 'push',
    name: 'Push',
    element: 'fire',
    unit: 'reps',
    ladder: [
      {
        exerciseId: 'fire.incline-pushup',
        label: 'Incline push-ups',
        graduateAt: 20,
      },
      // The tested push-up is the last rung: sets grow in reps and number,
      // never into a different exercise. Harder push-ups have their own
      // track, Variants.
      {exerciseId: 'fire.pushup-groove', label: 'Push-ups', graduateAt: 15},
    ],
    defaultRung: 1,
    defaultMax: 10,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 4,
    maxSets: 12,
    enabledByDefault: true,
    why: 'Standard push-ups every day, building toward your daily goal. Always paired with rows and pull-ups.',
    partners: [
      {exerciseId: 'air.doorway-pec-stretch', seconds: 30},
      {exerciseId: 'air.physiological-sigh', seconds: 30},
    ],
  },
  {
    id: 'push-variants',
    name: 'Variants',
    element: 'fire',
    unit: 'reps',
    ladder: [
      {
        exerciseId: 'fire.diamond-pushup',
        label: 'Diamond push-ups',
        graduateAt: 12,
      },
      {
        exerciseId: 'fire.decline-pushup',
        label: 'Decline push-ups',
        graduateAt: 12,
      },
      {
        exerciseId: 'fire.archer-pushup',
        label: 'Archer push-ups',
        graduateAt: 8,
      },
    ],
    defaultRung: 0,
    defaultMax: 8,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 2,
    maxSets: 6,
    enabledByDefault: true,
    why: 'Harder push-ups, on top of the standard ones. More strength for the same count. Every rep counts toward your daily goal.',
    partners: [
      {exerciseId: 'air.doorway-pec-stretch', seconds: 30},
      {exerciseId: 'water.side-line-stretch', seconds: 30},
    ],
  },
  {
    id: 'row',
    name: 'Row',
    element: 'fire',
    unit: 'reps',
    ladder: [
      {
        exerciseId: 'fire.doorframe-row',
        label: 'Doorframe rows',
        graduateAt: 15,
      },
      {
        exerciseId: 'fire.one-arm-doorframe-row',
        label: 'One-arm doorframe rows',
        graduateAt: 12,
      },
      {exerciseId: 'fire.table-row', label: 'Table rows', graduateAt: 12},
      {
        exerciseId: 'fire.inverted-row',
        label: 'Inverted rows (porch edge)',
        graduateAt: 15,
        instead: {
          exerciseId: 'fire.feet-up-towel-row',
          label: 'Feet-up towel rows',
        },
      },
    ],
    defaultRung: 0,
    defaultMax: 12,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 4,
    maxSets: 10,
    enabledByDefault: true,
    why: 'One pull for every push, every day. Rows help fix rounded shoulders from sitting.',
    partners: [
      {exerciseId: 'air.chin-tuck', seconds: 30},
      {exerciseId: 'heart.pulse-check', seconds: 30},
    ],
  },
  {
    id: 'pull',
    name: 'Pull',
    element: 'fire',
    unit: 'reps',
    ladder: [
      {
        exerciseId: 'fire.scap-pull',
        label: 'Scap pulls',
        graduateAt: 10,
        instead: {
          exerciseId: 'fire.isometric-door-pull',
          label: 'Isometric door pulls',
        },
      },
      {
        exerciseId: 'fire.pullup-negative',
        label: 'Pull-up negatives',
        graduateAt: 5,
        instead: {exerciseId: 'fire.towel-door-row', label: 'Towel door rows'},
      },
      {
        exerciseId: 'fire.porch-pullup',
        label: 'Porch pull-ups',
        graduateAt: 10,
        instead: {
          exerciseId: 'fire.feet-up-towel-row',
          label: 'Feet-up towel rows',
        },
      },
      {
        exerciseId: 'fire.brick-pack-pullup',
        label: 'Brick-pack pull-ups',
        graduateAt: 8,
      },
    ],
    defaultRung: 2,
    defaultMax: 3,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 3,
    maxSets: 8,
    enabledByDefault: true,
    why: 'Pull-ups every day from a hang point. Trains back, arms and grip.',
    partners: [
      {exerciseId: 'air.standing-belly-release', seconds: 30},
      {exerciseId: 'water.side-line-stretch', seconds: 30},
    ],
  },
  {
    id: 'squat',
    name: 'Squat',
    element: 'earth',
    unit: 'reps',
    ladder: [
      {exerciseId: 'earth.squat', label: 'Squats', graduateAt: 30},
      {exerciseId: 'earth.pause-squat', label: 'Pause squats', graduateAt: 20},
      {
        exerciseId: 'earth.split-squat',
        label: 'Split squats (each leg)',
        graduateAt: 15,
      },
      {
        exerciseId: 'earth.bulgarian-split-squat',
        label: 'Bulgarian split squats (each leg)',
        graduateAt: 12,
      },
      {
        exerciseId: 'earth.shrimp-squat',
        label: 'Shrimp squats (each leg)',
        graduateAt: 6,
      },
    ],
    defaultRung: 0,
    defaultMax: 20,
    intensity: 0.5,
    days: [0, 1, 3, 5],
    baseSets: 4,
    maxSets: 8,
    enabledByDefault: true,
    why: 'Leg strength for dancing all night. Harder versions build one-leg control for kicks.',
    partners: [
      {exerciseId: 'water.deep-squat-hold', seconds: 30},
      {exerciseId: 'water.hamstring-floss', seconds: 30},
    ],
  },
  {
    id: 'legs-up',
    name: 'Leg-ups',
    element: 'earth',
    unit: 'reps',
    ladder: [
      {
        exerciseId: 'earth.deadbug',
        label: 'Dead bugs (each side)',
        graduateAt: 12,
      },
      {exerciseId: 'earth.leg-raise', label: 'Leg raises', graduateAt: 15},
      {
        exerciseId: 'earth.hanging-knee-raise',
        label: 'Hanging knee raises',
        graduateAt: 12,
        instead: {
          exerciseId: 'earth.reverse-crunch',
          label: 'Reverse crunches',
        },
      },
      {
        exerciseId: 'earth.hanging-leg-raise',
        label: 'Hanging leg raises',
        graduateAt: 10,
        instead: {
          exerciseId: 'earth.reverse-crunch',
          label: 'Reverse crunches, slow',
        },
      },
      {
        exerciseId: 'earth.windshield-wiper',
        label: 'Windshield wipers (each side)',
        graduateAt: 10,
      },
      {
        exerciseId: 'earth.dragon-flag-negative',
        label: 'Dragon flag negatives',
        graduateAt: 8,
      },
    ],
    defaultRung: 1,
    defaultMax: 10,
    intensity: 0.5,
    days: [1, 2, 4, 5],
    baseSets: 3,
    maxSets: 8,
    enabledByDefault: true,
    why: 'Trains the lower abs. They help level a tilted pelvis and lift your legs for flips.',
    partners: [
      {exerciseId: 'water.hamstring-floss', seconds: 30},
      {exerciseId: 'air.physiological-sigh', seconds: 30},
    ],
  },
  {
    id: 'crunch',
    name: 'Sit-ups',
    element: 'earth',
    unit: 'reps',
    // Crunches until sit-ups come clean; the tested sit-up is the last rung.
    ladder: [
      {exerciseId: 'earth.crunch', label: 'Crunches', graduateAt: 25},
      {exerciseId: 'earth.situp', label: 'Sit-ups', graduateAt: 25},
      {
        exerciseId: 'earth.hollow-rock',
        label: 'Hollow rocks',
        graduateAt: 25,
      },
    ],
    defaultRung: 0,
    defaultMax: 20,
    intensity: 0.5,
    days: [1, 3, 5],
    baseSets: 3,
    maxSets: 6,
    enabledByDefault: true,
    why: 'Sit-ups, with sets capped on purpose. Belly fat goes with food and movement.',
    partners: [
      {exerciseId: 'air.standing-belly-release', seconds: 30},
      {exerciseId: 'air.physiological-sigh', seconds: 30},
    ],
  },
  {
    id: 'side',
    name: 'Side',
    element: 'earth',
    unit: 'reps',
    ladder: [
      {
        exerciseId: 'earth.side-up',
        label: 'Side-ups (each side)',
        graduateAt: 20,
      },
      {
        exerciseId: 'earth.side-plank-hip-dip',
        label: 'Side-plank hip dips (each side)',
        graduateAt: 15,
      },
    ],
    defaultRung: 0,
    defaultMax: 10,
    intensity: 0.5,
    days: [2, 4, 6],
    baseSets: 3,
    maxSets: 6,
    enabledByDefault: true,
    why: 'Trains the obliques and sides. They power the twist in staff spins and kicks.',
    partners: [{exerciseId: 'water.side-line-stretch', seconds: 30}],
  },
  {
    id: 'plank',
    name: 'Plank',
    element: 'earth',
    unit: 'seconds',
    // The tested forearm plank is the only rung: holds grow toward 3:45.
    ladder: [
      {exerciseId: 'earth.plank', label: 'Forearm plank', graduateAt: 225},
    ],
    defaultRung: 0,
    defaultMax: 40,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 3,
    maxSets: 6,
    enabledByDefault: true,
    why: 'Forearm plank every day, building toward 3:45. A strong trunk also helps level a tilted pelvis.',
    partners: [{exerciseId: 'heart.rave-vision', seconds: 30}],
  },
  {
    id: 'hang',
    name: 'Hang',
    element: 'earth',
    unit: 'seconds',
    ladder: [
      {
        exerciseId: 'earth.porch-dead-hang',
        label: 'Dead hang',
        graduateAt: 60,
        instead: {
          exerciseId: 'earth.table-edge-hold',
          label: 'Table edge holds',
        },
      },
      {
        exerciseId: 'earth.active-hang',
        label: 'Active hang',
        graduateAt: 45,
        instead: {
          exerciseId: 'earth.towel-pinch-hold',
          label: 'Towel pinch holds (each hand)',
        },
      },
      {
        exerciseId: 'earth.one-arm-assisted-hang',
        label: 'One-arm assisted hang (each arm)',
        graduateAt: 30,
      },
    ],
    defaultRung: 0,
    defaultMax: 30,
    intensity: 0.5,
    days: [1, 2, 3, 4, 5],
    baseSets: 3,
    maxSets: 8,
    enabledByDefault: true,
    why: 'Builds grip and shoulder health. Hanging also decompresses your spine after sitting.',
    partners: [
      {exerciseId: 'air.physiological-sigh', seconds: 30},
      {exerciseId: 'heart.pulse-check', seconds: 30},
    ],
  },
  {
    id: 'posture',
    name: 'Posture',
    element: 'air',
    unit: 'reps',
    ladder: [
      {exerciseId: 'air.chin-tuck', label: 'Chin tucks', graduateAt: 15},
      {exerciseId: 'air.wall-angels', label: 'Wall angels', graduateAt: 12},
      {exerciseId: 'air.brick-halo', label: 'Brick halos', graduateAt: 10},
    ],
    defaultRung: 0,
    defaultMax: 20,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 4,
    maxSets: 8,
    enabledByDefault: true,
    why: 'Fixes forward head and rounded shoulders from sitting, a few reps at a time.',
    partners: [
      {exerciseId: 'water.side-line-stretch', seconds: 30},
      {exerciseId: 'heart.pulse-check', seconds: 30},
    ],
  },
  {
    id: 'breath',
    name: 'Breath',
    element: 'air',
    unit: 'seconds',
    ladder: [
      {
        exerciseId: 'air.physiological-sigh',
        label: 'Physiological sighs',
        graduateAt: 60,
      },
      {
        exerciseId: 'air.coherence-breath',
        label: 'Coherence breathing',
        graduateAt: 90,
      },
      {exerciseId: 'air.box-breath', label: 'Box breathing', graduateAt: 120},
    ],
    defaultRung: 1,
    defaultMax: 120,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 4,
    maxSets: 8,
    enabledByDefault: true,
    why: 'Calm, low breathing between focus blocks. Your max is how long the pattern stays easy.',
    partners: [
      {exerciseId: 'water.hamstring-floss', seconds: 30},
      {exerciseId: 'earth.posterior-pelvic-tilt', seconds: 30},
    ],
  },
  {
    id: 'mobility',
    name: 'Mobility',
    element: 'water',
    unit: 'seconds',
    ladder: [
      {
        exerciseId: 'water.hamstring-floss',
        label: 'Hamstring floss',
        graduateAt: 60,
      },
      {
        exerciseId: 'water.deep-squat-hold',
        label: 'Deep squat hold',
        graduateAt: 90,
      },
      {
        exerciseId: 'water.front-split-progression',
        label: 'Front split progression (each side)',
        graduateAt: 60,
      },
    ],
    defaultRung: 0,
    defaultMax: 60,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 3,
    maxSets: 6,
    enabledByDefault: true,
    why: 'Builds range and fascia for kicks and flow. Short sets instead of one long stretch.',
    partners: [
      {exerciseId: 'air.physiological-sigh', seconds: 30},
      {exerciseId: 'earth.single-leg-balance', seconds: 30},
    ],
  },
  {
    id: 'stillness',
    name: 'Stillness',
    element: 'heart',
    unit: 'seconds',
    ladder: [
      {exerciseId: 'heart.pulse-check', label: 'Pulse check', graduateAt: 45},
      {exerciseId: 'heart.still-sit', label: 'Still sit', graduateAt: 90},
      {
        exerciseId: 'heart.single-point-focus',
        label: 'Single-point focus',
        graduateAt: 120,
      },
    ],
    defaultRung: 1,
    defaultMax: 60,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 3,
    maxSets: 6,
    enabledByDefault: true,
    why: 'Trains focus. Hold your attention still for half a minute between other sets.',
    partners: [
      {exerciseId: 'air.physiological-sigh', seconds: 30},
      {exerciseId: 'water.side-line-stretch', seconds: 30},
    ],
  },
  {
    id: 'pelvis',
    name: 'Pelvis',
    element: 'earth',
    unit: 'reps',
    // Corrective work for the tilted pelvis and the desk back.
    ladder: [
      {
        exerciseId: 'earth.posterior-pelvic-tilt',
        label: 'Posterior pelvic tilts',
        graduateAt: 20,
      },
      {
        exerciseId: 'earth.glute-bridge',
        label: 'Glute bridges',
        graduateAt: 20,
      },
      {
        exerciseId: 'earth.single-leg-glute-bridge',
        label: 'Single-leg glute bridges (each leg)',
        graduateAt: 12,
      },
    ],
    defaultRung: 1,
    defaultMax: 20,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 3,
    maxSets: 6,
    enabledByDefault: true,
    why: 'For a tilted pelvis and a stiff back from sitting. Glute work levels the pelvis. Then stretch the hip flexors or upper back.',
    partners: [
      {exerciseId: 'water.hip-flexor-stretch', seconds: 60},
      {exerciseId: 'air.thread-the-needle', seconds: 60},
    ],
  },
  {
    id: 'kicks',
    name: 'Kick range',
    element: 'water',
    unit: 'seconds',
    ladder: [
      {exerciseId: 'water.pigeon', label: 'Pigeon (each side)', graduateAt: 90},
      {
        exerciseId: 'water.frog-stretch',
        label: 'Frog stretch',
        graduateAt: 120,
      },
      {
        exerciseId: 'water.side-split-progression',
        label: 'Side split progression',
        graduateAt: 120,
      },
    ],
    defaultRung: 0,
    defaultMax: 60,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 2,
    maxSets: 5,
    enabledByDefault: true,
    why: 'Hip range for high kicks, a little every day. Leg swings or a horse stance follow.',
    partners: [
      {exerciseId: 'air.leg-swings', seconds: 60},
      {exerciseId: 'earth.horse-stance', seconds: 45},
    ],
  },
  {
    id: 'flow',
    name: 'Flow',
    element: 'water',
    unit: 'seconds',
    // Tai chi, and only the dry half of it: the day rounds never sweat, so
    // the kicks, strikes and dance live in the morning block instead.
    ladder: [
      {
        exerciseId: 'water.cloud-hands',
        label: 'Cloud hands',
        graduateAt: 120,
      },
      {
        exerciseId: 'water.tai-chi-walk',
        label: 'Tai chi walking',
        graduateAt: 120,
      },
      {
        exerciseId: 'water.grasp-sparrows-tail',
        label: 'Grasp the sparrow’s tail',
        graduateAt: 180,
      },
    ],
    defaultRung: 0,
    defaultMax: 60,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 2,
    maxSets: 5,
    enabledByDefault: true,
    why: 'Slow weight shifts and waist turns. Builds balance, dexterity and calm. You won’t need a shower after.',
    partners: [
      {exerciseId: 'air.coherence-breath', seconds: 60},
      {exerciseId: 'heart.mirror-presence', seconds: 30},
    ],
  },
];

export const TRACK_IDS: TrackId[] = TRACKS.map(t => t.id);

export function trackById(id: TrackId): Track {
  const track = TRACKS.find(t => t.id === id);
  if (!track) {
    throw new Error(`Unknown track: ${id}`);
  }
  return track;
}
