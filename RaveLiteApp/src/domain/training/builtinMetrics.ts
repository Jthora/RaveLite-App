import {MetricKind} from './types';

/**
 * Built-in metric catalog. The operator can archive items they don't
 * use and add custom kinds on top. Ids are stable so old entries keep
 * resolving across versions.
 *
 * Tied to the operator's whiteboard (B+ @ 21:00 for 3 mi) and the
 * USMC "Perfect" reference (3 mi ≤ 18 min, 100 crunches/2 min, 20
 * pullups, 3 min plank stretch goal).
 */
const MI = 1609.344;

export const BUILTIN_METRICS: MetricKind[] = [
  // ─── Cardio ──────────────────────────────────────────────────────
  {
    id: 'builtin.run-3mi',
    label: '3-Mile Run',
    category: 'run',
    unit: 'seconds',
    inputMode: 'mmss',
    defaultDistanceMeters: Math.round(3 * MI),
    builtIn: true,
  },
  {
    id: 'builtin.run-2mi',
    label: '2-Mile Run',
    category: 'run',
    unit: 'seconds',
    inputMode: 'mmss',
    defaultDistanceMeters: Math.round(2 * MI),
    builtIn: true,
  },
  {
    id: 'builtin.run-1.5mi',
    label: '1.5-Mile Run',
    category: 'run',
    unit: 'seconds',
    inputMode: 'mmss',
    defaultDistanceMeters: Math.round(1.5 * MI),
    builtIn: true,
  },
  {
    id: 'builtin.run-custom',
    label: 'Run (custom distance)',
    category: 'run',
    unit: 'seconds',
    inputMode: 'distance-time',
    builtIn: true,
  },

  // ─── Holds ───────────────────────────────────────────────────────
  {
    id: 'builtin.plank',
    label: 'Plank — max hold',
    category: 'hold',
    unit: 'seconds',
    inputMode: 'mmss',
    builtIn: true,
  },

  // ─── Reps ────────────────────────────────────────────────────────
  {
    id: 'builtin.pushups-amrap',
    label: 'Pushups — max set',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
  },
  {
    id: 'builtin.pushups-2min',
    label: 'Pushups — 2 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
  },
  {
    id: 'builtin.pullups-amrap',
    label: 'Pullups — max set',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
  },
  {
    id: 'builtin.crunches-2min',
    label: 'Crunches — 2 min',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
  },
  {
    id: 'builtin.leg-hipup',
    label: 'Lying Leg-up + Hip-up',
    category: 'reps',
    unit: 'reps',
    inputMode: 'integer',
    builtIn: true,
    notes:
      'Back-safe core: legs straight, lift to vertical, then push hips up. Lower back stays glued to floor.',
  },
];

export function builtinById(id: string): MetricKind | undefined {
  return BUILTIN_METRICS.find(m => m.id === id);
}
