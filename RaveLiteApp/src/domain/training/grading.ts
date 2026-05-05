import {MetricKind, TrainingLogEntry} from './types';

/** Operator's whiteboard 3-mile grade table. See docs/02-fitness-standards/grading-table-3mi.md. */
export type Grade =
  | 'A+'
  | 'A'
  | 'A−'
  | 'B+'
  | 'B'
  | 'B−'
  | 'C+'
  | 'C'
  | 'C−'
  | 'D+'
  | 'D'
  | 'D−'
  | 'F+'
  | 'F';

const GRADE_TABLE_3MI: Array<{maxSeconds: number; grade: Grade}> = [
  {maxSeconds: 18 * 60, grade: 'A+'},
  {maxSeconds: 19 * 60, grade: 'A'},
  {maxSeconds: 20 * 60, grade: 'A−'},
  {maxSeconds: 21 * 60, grade: 'B+'},
  {maxSeconds: 22 * 60, grade: 'B'},
  {maxSeconds: 23 * 60, grade: 'B−'},
  {maxSeconds: 24 * 60, grade: 'C+'},
  {maxSeconds: 25 * 60, grade: 'C'},
  {maxSeconds: 26 * 60, grade: 'C−'},
  {maxSeconds: 27 * 60, grade: 'D+'},
  {maxSeconds: 28 * 60, grade: 'D'},
  {maxSeconds: 29 * 60, grade: 'D−'},
  {maxSeconds: 30 * 60, grade: 'F+'},
];

/**
 * Grade for a 3-mile time. ≤ 18 min caps at A+; > 30 min returns 'F'.
 * Brackets are inclusive on the better end (exactly 21:00 → B+).
 */
export function gradeFor3Mi(seconds: number): Grade {
  for (const row of GRADE_TABLE_3MI) {
    if (seconds <= row.maxSeconds) return row.grade;
  }
  return 'F';
}

const MI = 1609.344;

/**
 * Equivalent 3-mile grade for a run of any distance ≥ 1 mile.
 * Extrapolates by holding pace constant. Below 1 mi → undefined
 * (too short to grade against the 3-mi table meaningfully).
 */
export function gradeForRun(
  distanceMeters: number,
  seconds: number,
): {grade: Grade; equivalent3MiSeconds: number} | undefined {
  if (distanceMeters < MI || seconds <= 0) return undefined;
  const equivalent3MiSeconds = (seconds / distanceMeters) * (3 * MI);
  return {grade: gradeFor3Mi(equivalent3MiSeconds), equivalent3MiSeconds};
}

/** Pace string `M:SS / mi`. */
export function formatPace(distanceMeters: number, seconds: number): string {
  if (distanceMeters <= 0 || seconds <= 0) return '—';
  const sPerMi = (seconds / distanceMeters) * MI;
  const m = Math.floor(sPerMi / 60);
  const s = Math.round(sPerMi - m * 60);
  if (s === 60) return `${m + 1}:00 /mi`;
  return `${m}:${String(s).padStart(2, '0')} /mi`;
}

/** Duration `MM:SS` for displays — collapses to `H:MM:SS` past an hour. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total - h * 3600) / 60);
  const s = total - h * 3600 - m * 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Distance in miles, 2-dp when fractional, integer when round. */
export function formatMiles(distanceMeters: number): string {
  const mi = distanceMeters / MI;
  if (Math.abs(mi - Math.round(mi)) < 0.005) return `${Math.round(mi)} mi`;
  return `${mi.toFixed(2)} mi`;
}

/**
 * Render an entry's primary value the way its kind expects.
 *   mmss          → "MM:SS"
 *   integer       → "<n> reps"
 *   distance-time → "<dist> · MM:SS"
 *   decimal       → bare number
 */
export function formatEntryValue(
  entry: TrainingLogEntry,
  kind: MetricKind,
): string {
  switch (kind.inputMode) {
    case 'mmss':
      return formatDuration(entry.value);
    case 'integer':
      return `${entry.value} ${kind.unit === 'reps' ? 'reps' : ''}`.trim();
    case 'distance-time': {
      const d = entry.distanceMeters ?? kind.defaultDistanceMeters;
      const dStr = d ? formatMiles(d) : '—';
      return `${dStr} · ${formatDuration(entry.value)}`;
    }
    case 'decimal':
      return `${entry.value}`;
  }
}

/** Compute YYYY-MM-DD in the local timezone for grouping. */
export function localDayKey(at: number): string {
  const d = new Date(at);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Best (lowest time / highest reps) entry for a given kind in a window.
 * Higher is better for `integer`, lower is better for `mmss` /
 * `distance-time`. `decimal` falls back to highest.
 */
export function bestEntry(
  entries: TrainingLogEntry[],
  kindId: string,
  kind: MetricKind,
  windowMs: number,
  now: number = Date.now(),
): TrainingLogEntry | undefined {
  const cutoff = now - windowMs;
  const candidates = entries.filter(
    e => e.kindId === kindId && e.at >= cutoff,
  );
  if (candidates.length === 0) return undefined;
  const lowerIsBetter =
    kind.inputMode === 'mmss' || kind.inputMode === 'distance-time';
  return candidates.reduce((best, e) => {
    if (!best) return e;
    if (lowerIsBetter) return e.value < best.value ? e : best;
    return e.value > best.value ? e : best;
  });
}
