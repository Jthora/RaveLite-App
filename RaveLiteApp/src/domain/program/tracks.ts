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

const WEEKDAYS = [1, 2, 3, 4, 5, 6];
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
    why: 'The fitness-test push-up, every day, building toward 200 a day. Always paired with rows and pull-ups.',
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
    why: 'Harder push-ups on top of the standard ones: more strength for the same count. Every rep counts toward the 200.',
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
    ],
    defaultRung: 0,
    defaultMax: 12,
    intensity: 0.5,
    days: ALL_DAYS,
    baseSets: 4,
    maxSets: 10,
    enabledByDefault: true,
    why: 'A pull for every push, every day push-ups run: the desk-side fix for rounded shoulders.',
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
      {exerciseId: 'fire.scap-pull', label: 'Scap pulls', graduateAt: 10},
      {
        exerciseId: 'fire.pullup-negative',
        label: 'Pull-up negatives',
        graduateAt: 5,
      },
      {
        exerciseId: 'fire.porch-pullup',
        label: 'Porch pull-ups',
        graduateAt: 10,
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
    why: "The Marine test's pull-ups, every day from the porch edge: back, arms and grip.",
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
    why: 'Legs for all-night stepping; later rungs build one-leg control for kicks.',
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
      },
      {
        exerciseId: 'earth.hanging-leg-raise',
        label: 'Hanging leg raises',
        graduateAt: 10,
      },
    ],
    defaultRung: 1,
    defaultMax: 10,
    intensity: 0.5,
    days: [1, 2, 4, 5],
    baseSets: 3,
    maxSets: 8,
    enabledByDefault: true,
    why: 'Lower abs that pull the pelvis out of tilt and lift the legs for flips.',
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
    ],
    defaultRung: 0,
    defaultMax: 20,
    intensity: 0.5,
    days: [1, 3, 5],
    baseSets: 3,
    maxSets: 6,
    enabledByDefault: true,
    why: "The Air Force test's sit-ups. Capped on purpose: the gut goes with food and movement.",
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
    why: 'Obliques and the side line — the twist behind staff spins and kicks.',
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
    why: "The Marine test's plank, every day, toward 3:45. A rigid trunk also settles the pelvic tilt.",
    partners: [{exerciseId: 'heart.rave-vision', seconds: 30}],
  },
  {
    id: 'hang',
    name: 'Hang',
    element: 'earth',
    unit: 'seconds',
    ladder: [
      {exerciseId: 'earth.porch-dead-hang', label: 'Dead hang', graduateAt: 60},
      {exerciseId: 'earth.active-hang', label: 'Active hang', graduateAt: 45},
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
    why: 'Grip, shoulder health and a decompressed spine after desk hours.',
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
    why: 'Undoes the desk a few reps at a time: forward head and rounded shoulders.',
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
    why: 'Calm, low breathing between focus blocks; the tested max is how long the pattern stays easy.',
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
    why: 'Range and fascia for kicks and flow, a little at a time instead of one long stretch.',
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
    why: 'Focus trained like a muscle: attention held still for half a minute between the other sets.',
    partners: [
      {exerciseId: 'air.physiological-sigh', seconds: 30},
      {exerciseId: 'water.side-line-stretch', seconds: 30},
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
