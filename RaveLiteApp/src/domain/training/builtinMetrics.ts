import {MetricKind} from './types';
import {METERS_PER_MILE as MI} from '../../lib/constants';

/**
 * Built-in metric catalog. The operator can archive items they don't
 * use and add custom kinds on top. Ids are stable so old entries keep
 * resolving across versions — relabel freely, never re-id.
 *
 * Tied to the operator's whiteboard (B+ @ 21:00 for 3 mi) and the
 * USMC "Perfect" reference (3 mi ≤ 18 min, 100 crunches/2 min, 20
 * pullups, 3 min plank stretch goal).
 *
 * Kit-bound: bodyweight, mat, backyard, porch-edge hang, bricks. No
 * pool, no weights. Each metric sits under the same element as the
 * drill it measures (see `exercises/library.ts`).
 */

export const BUILTIN_METRICS: MetricKind[] = [
  // ─── FIRE — runs, pushing, pulling, conditioning ─────────────────
  {
    id: 'builtin.run-3mi',
    label: '3-Mile Run',
    category: 'run',
    unit: 'seconds',
    inputMode: 'mmss',
    defaultDistanceMeters: Math.round(3 * MI),
    builtIn: true,
    element: 'fire',
  },
  {
    id: 'builtin.run-2mi',
    label: '2-Mile Run',
    category: 'run',
    unit: 'seconds',
    inputMode: 'mmss',
    defaultDistanceMeters: Math.round(2 * MI),
    builtIn: true,
    element: 'fire',
  },
  {
    id: 'builtin.run-1.5mi',
    label: '1.5-Mile Run',
    category: 'run',
    unit: 'seconds',
    inputMode: 'mmss',
    defaultDistanceMeters: Math.round(1.5 * MI),
    builtIn: true,
    element: 'fire',
  },
  {
    id: 'builtin.run-custom',
    label: 'Run (custom distance)',
    category: 'run',
    unit: 'seconds',
    inputMode: 'distance-time',
    builtIn: true,
    element: 'fire',
  },
  {
    id: 'builtin.pushups-amrap',
    label: 'Pushups — max set',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'fire',
  },
  {
    id: 'builtin.pushups-2min',
    label: 'Pushups — 2 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'fire',
  },
  {
    id: 'builtin.pushups-1min',
    label: 'Pushups — 1 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'fire',
    notes: 'Air Force and Space Force test: one minute, full range.',
  },
  {
    id: 'builtin.situps-2min',
    label: 'Sit-ups — 2 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'fire',
  },
  {
    id: 'builtin.situps-1min',
    label: 'Sit-ups — 1 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'fire',
    notes: 'Air Force and Space Force test: one minute.',
  },
  {
    id: 'builtin.pullups-amrap',
    label: 'Porch pull-ups — max set',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'fire',
    notes: 'Start each rep from a dead hang. Clean reps only.',
  },
  {
    id: 'builtin.burpees-2min',
    label: 'Burpees — 2 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'fire',
    notes: 'Step-back burpees count. Do smooth reps, not fast sloppy ones.',
  },
  {
    id: 'builtin.cft-mtc',
    label: 'Movement to contact — 880 yd',
    category: 'run',
    unit: 'seconds',
    inputMode: 'mmss',
    defaultDistanceMeters: 805,
    builtIn: true,
    element: 'fire',
    notes: 'Marine combat fitness test: an 880-yard sprint.',
  },
  {
    id: 'builtin.cft-acl',
    label: 'Ammo-can lifts — 2 min (30 lb bricks)',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'fire',
    notes:
      'Marine combat fitness test: from shoulder height to arms locked overhead for 2 min. About 6 bricks in a bag makes 30 lb.',
  },
  {
    id: 'builtin.cft-manuf',
    label: 'Maneuver under fire',
    category: 'custom',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'fire',
    notes:
      'Marine combat fitness test: a 300-yard course of sprints, crawls, a drag and carries, a throw and push-ups, in the yard.',
  },

  // ─── AIR — breath, cadence, lightness ────────────────────────────
  {
    id: 'builtin.breath-hold',
    label: 'Breath hold — max',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'air',
    notes:
      'Sit and relax. Breathe normally, inhale, then hold while it stays calm. Never do this in water or while driving.',
  },
  {
    id: 'builtin.exhale-hold',
    label: 'Exhale hold — max',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'air',
    notes: 'Sit, breathe out fully, then hold. Measures CO2 tolerance.',
  },
  {
    id: 'builtin.box-breath-2min',
    label: 'Box breaths — 2 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'air',
    notes: 'Count completed 4-4-4-4 cycles in 2 min.',
  },
  {
    id: 'builtin.skipping-2min',
    label: 'Shadow-rope skips — 2 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'air',
    notes: 'No rope needed. One hop per turn of the imaginary rope.',
  },

  // ─── EARTH — core, legs, holds, hangs, brick carries ─────────────
  // Crunches, leg-ups and plank moved here from Fire so they sit with
  // the core drills. Legacy entries follow the kind, so history moves
  // with them.
  {
    id: 'builtin.crunches-2min',
    label: 'Crunches — 2 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'earth',
  },
  {
    id: 'builtin.leg-hipup',
    label: 'Lying Leg-up + Hip-up',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'earth',
    notes:
      'Safe for your back. Keep legs straight, lift them to vertical, then push your hips up. Keep your lower back on the floor.',
  },
  {
    id: 'builtin.side-ups-amrap',
    label: 'Side-ups — max set (weaker side)',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'earth',
    notes: 'Do both sides; log the lower count.',
  },
  {
    id: 'builtin.squats-amrap',
    label: 'Squats — max set',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'earth',
  },
  {
    id: 'builtin.plank',
    label: 'Plank — max hold',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'earth',
  },
  {
    id: 'builtin.side-plank',
    label: 'Side plank — max hold (weaker side)',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'earth',
  },
  {
    id: 'builtin.deadhang',
    label: 'Porch dead hang — max',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'earth',
    notes: 'Passive hang, shoulders relaxed. Test the hang point first.',
  },
  {
    id: 'builtin.wall-sit',
    label: 'Wall sit — max',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'earth',
  },
  {
    id: 'builtin.farmer-carry',
    label: 'Brick farmer walk — distance',
    category: 'custom',
    unit: 'meters',
    inputMode: 'decimal',
    builtIn: true,
    element: 'earth',
    notes: 'One or two bricks per hand. Log the meters walked before you stop.',
  },
  {
    id: 'builtin.weighted-carry-time',
    label: 'Brick carry — duration',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'earth',
  },
  {
    id: 'builtin.balance-hold',
    label: 'Single-leg balance — max',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'earth',
    notes: 'Eyes closed, arms folded, on the weaker leg.',
  },

  // ─── CORE — focus ────────────────────────────────────────────────
  {
    id: 'builtin.still-sit',
    label: 'Still sit — max',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'heart',
    notes: 'Sit still with a soft gaze on one point. Stop at the first fidget.',
  },

  // ─── WATER — flow, fascia, joint glide ───────────────────────────
  {
    id: 'builtin.flow-no-drop',
    label: 'Staff flow — no-drop time',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'water',
    notes: 'Continuous flow on the beat until the first drop.',
  },
  {
    id: 'builtin.flow-hold',
    label: 'Fascia hold — max',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'water',
    notes:
      'Hold one deep mobility position. Stop when muscles tense on their own.',
  },
  {
    id: 'builtin.deep-squat-hold',
    label: 'Deep squat hold — max',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'water',
    notes: 'Heels down, chest up. A brick under the heels is fine to start.',
  },
  {
    id: 'builtin.shoulder-cars',
    label: 'Shoulder CARs — reps',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'water',
    notes: 'Controlled articular rotations, slow, full range.',
  },
  {
    id: 'builtin.hip-cars',
    label: 'Hip CARs — reps',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    element: 'water',
  },

  // ─── SESSIONS — timed, logged by the minute (the Session timer) ─────
  {
    id: 'builtin.staff-session',
    label: 'Staff session',
    category: 'session',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'water',
    notes: 'Flow and combat on the beat. Long sessions also build stamina.',
  },
  {
    id: 'builtin.bike-ride',
    label: 'Bike ride',
    category: 'session',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'fire',
    notes: 'Time the whole ride, including any ride home with a loaded pack.',
  },
  {
    id: 'builtin.ruck',
    label: 'Ruck (bricks in a pack)',
    category: 'session',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'earth',
    notes:
      'Note the load. MARSOC standard: 45 lb plus about 10, at 15 min a mile.',
  },
  {
    id: 'builtin.walk-session',
    label: 'Walk',
    category: 'session',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'air',
    notes: 'Easy pace, breathing through the nose.',
  },
  {
    id: 'builtin.yoga-video',
    label: 'Yoga (video)',
    category: 'session',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'water',
    notes: 'Play the video on another device. RaveLite keeps the time.',
  },
  {
    id: 'builtin.tai-chi-video',
    label: 'Tai chi (video)',
    category: 'session',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'heart',
    notes: 'Play the video on another device. RaveLite keeps the time.',
  },
  {
    id: 'builtin.quiet-cardio-video',
    label: 'Quiet cardio (video)',
    category: 'session',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
    element: 'fire',
    notes: 'No-jump cardio for low ceilings. Play the video on another device.',
  },

  // ─── BODY — measurements ─────────────────────────────────────────────
  {
    id: 'builtin.waist',
    label: 'Waist (inches)',
    category: 'custom',
    unit: 'misc',
    inputMode: 'decimal',
    builtIn: true,
    element: 'earth',
    notes:
      'Measure around the navel, relaxed, after a normal breath out. Goals shows it as waist-to-height.',
  },
];

export function builtinById(id: string): MetricKind | undefined {
  return BUILTIN_METRICS.find(m => m.id === id);
}

/**
 * Kinds that only mean something in a military fitness test. They stay in
 * the log for somebody carrying that pack, and for an entry already
 * logged; for anyone else they were a list of Marine events in the way.
 */
export const TEST_ONLY_KINDS: ReadonlySet<string> = new Set([
  'builtin.cft-mtc',
  'builtin.cft-acl',
  'builtin.cft-manuf',
]);
