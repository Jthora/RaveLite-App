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
 *   - Each round ends with a partner from another element — a chest
 *     opener after pushing, a hip opener after squats, a breath after
 *     trunk work — so Air, Water and Heart ride along with the strength.
 */

const WEEKDAYS = [1, 2, 3, 4, 5, 6];

export const TRACKS: Track[] = [
  {
    id: 'push',
    name: 'Push',
    element: 'fire',
    unit: 'reps',
    ladder: [
      {exerciseId: 'fire.incline-pushup', label: 'Incline push-ups', graduateAt: 20},
      {exerciseId: 'fire.pushup-groove', label: 'Push-ups', graduateAt: 15},
      {exerciseId: 'fire.diamond-pushup', label: 'Diamond push-ups', graduateAt: 12},
      {exerciseId: 'fire.decline-pushup', label: 'Decline push-ups', graduateAt: 12},
      {exerciseId: 'fire.archer-pushup', label: 'Archer push-ups', graduateAt: 8},
    ],
    defaultRung: 1,
    defaultMax: 10,
    intensity: 0.5,
    days: WEEKDAYS,
    baseSets: 4,
    maxSets: 10,
    enabledByDefault: true,
    why: 'Pushing strength and upper-body density. Always paired with Row.',
    partners: [
      {exerciseId: 'air.doorway-pec-stretch', seconds: 30},
      {exerciseId: 'air.physiological-sigh', seconds: 30},
    ],
  },
  {
    id: 'row',
    name: 'Row',
    element: 'fire',
    unit: 'reps',
    ladder: [
      {exerciseId: 'fire.doorframe-row', label: 'Doorframe rows', graduateAt: 15},
      {exerciseId: 'fire.one-arm-doorframe-row', label: 'One-arm doorframe rows', graduateAt: 12},
      {exerciseId: 'fire.table-row', label: 'Table rows', graduateAt: 12},
    ],
    defaultRung: 0,
    defaultMax: 12,
    intensity: 0.5,
    days: WEEKDAYS,
    baseSets: 4,
    maxSets: 10,
    enabledByDefault: true,
    why: 'A pull for every push — the desk-side fix for rounded shoulders.',
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
      {exerciseId: 'fire.pullup-negative', label: 'Pull-up negatives', graduateAt: 5},
      {exerciseId: 'fire.porch-pullup', label: 'Porch pull-ups', graduateAt: 10},
      {exerciseId: 'fire.brick-pack-pullup', label: 'Brick-pack pull-ups', graduateAt: 8},
    ],
    defaultRung: 2,
    defaultMax: 3,
    intensity: 0.5,
    days: [1, 2, 4, 5, 6],
    baseSets: 3,
    maxSets: 8,
    enabledByDefault: true,
    why: 'Back, arms and grip from the porch edge — the strength to hang, climb and spin.',
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
      {exerciseId: 'earth.split-squat', label: 'Split squats (each leg)', graduateAt: 15},
      {exerciseId: 'earth.bulgarian-split-squat', label: 'Bulgarian split squats (each leg)', graduateAt: 12},
      {exerciseId: 'earth.shrimp-squat', label: 'Shrimp squats (each leg)', graduateAt: 6},
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
      {exerciseId: 'earth.deadbug', label: 'Dead bugs (each side)', graduateAt: 12},
      {exerciseId: 'earth.leg-raise', label: 'Leg raises', graduateAt: 15},
      {exerciseId: 'earth.hanging-knee-raise', label: 'Hanging knee raises', graduateAt: 12},
      {exerciseId: 'earth.hanging-leg-raise', label: 'Hanging leg raises', graduateAt: 10},
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
    name: 'Crunch',
    element: 'earth',
    unit: 'reps',
    ladder: [
      {exerciseId: 'earth.crunch', label: 'Crunches', graduateAt: 25},
      {exerciseId: 'earth.situp', label: 'Sit-ups', graduateAt: 25},
      {exerciseId: 'earth.v-up', label: 'V-ups', graduateAt: 15},
    ],
    defaultRung: 0,
    defaultMax: 20,
    intensity: 0.5,
    days: [1, 3, 5],
    baseSets: 3,
    maxSets: 6,
    enabledByDefault: true,
    why: 'Trunk flexion strength, capped on purpose: the gut goes with food and movement.',
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
      {exerciseId: 'earth.side-up', label: 'Side-ups (each side)', graduateAt: 20},
      {exerciseId: 'earth.side-plank-hip-dip', label: 'Side-plank hip dips (each side)', graduateAt: 15},
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
    ladder: [
      {exerciseId: 'earth.plank', label: 'Forearm plank', graduateAt: 60},
      {exerciseId: 'earth.hollow-hold', label: 'Hollow hold', graduateAt: 45},
      {exerciseId: 'earth.long-lever-plank', label: 'Long-lever plank', graduateAt: 45},
    ],
    defaultRung: 0,
    defaultMax: 40,
    intensity: 0.5,
    days: [0, 2, 4, 6],
    baseSets: 3,
    maxSets: 6,
    enabledByDefault: true,
    why: 'A rigid trunk while the arms, legs and staff move fast.',
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
      {exerciseId: 'earth.one-arm-assisted-hang', label: 'One-arm assisted hang (each arm)', graduateAt: 30},
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
];

export const TRACK_IDS: TrackId[] = TRACKS.map(t => t.id);

export function trackById(id: TrackId): Track {
  const track = TRACKS.find(t => t.id === id);
  if (!track) {
    throw new Error(`Unknown track: ${id}`);
  }
  return track;
}
