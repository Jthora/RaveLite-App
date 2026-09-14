/**
 * The Train log's headline result over the last 30 days: the best run as a
 * 3-mile equivalent grade, or else the best of the most-logged kind.
 */
import {MS_PER_DAY} from '../../lib/constants';
import {bestEntry, formatEntryValue, gradeForRun} from './grading';
import {getMetric} from './repository';
import type {MetricKind, TrainingLogEntry} from './types';

const WINDOW_MS = 30 * MS_PER_DAY;

export interface Headline {
  /** Eyebrow, e.g. "BEST 3 MI EQUIV (30 D)". */
  kicker: string;
  /** The same in sentence case, e.g. "Best 3-mi equiv". */
  label: string;
  /** The result, e.g. "B+ · 20:41". */
  main: string;
  detail?: string;
}

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function buildHeadline(
  entries: TrainingLogEntry[],
  metrics: MetricKind[],
  now: number = Date.now(),
): Headline | undefined {
  // The best run grade in the window across all distance-bearing kinds.
  const cutoff = now - WINDOW_MS;
  let bestGrade: ReturnType<typeof gradeForRun> | undefined;
  let bestKind: MetricKind | undefined;
  let bestEntryRef: TrainingLogEntry | undefined;
  for (const e of entries) {
    if (e.at < cutoff) {
      continue;
    }
    const k = metrics.find(m => m.id === e.kindId) ?? getMetric(e.kindId);
    if (!k) {
      continue;
    }
    const dist =
      k.inputMode === 'mmss' && k.defaultDistanceMeters
        ? k.defaultDistanceMeters
        : k.inputMode === 'distance-time'
        ? e.distanceMeters
        : undefined;
    if (!dist) {
      continue;
    }
    const g = gradeForRun(dist, e.value);
    if (!g) {
      continue;
    }
    if (!bestGrade || g.equivalent3MiSeconds < bestGrade.equivalent3MiSeconds) {
      bestGrade = g;
      bestKind = k;
      bestEntryRef = e;
    }
  }
  if (bestGrade && bestKind && bestEntryRef) {
    return {
      kicker: 'BEST 3 MI EQUIV (30 D)',
      label: 'Best 3-mi equiv',
      main: `${bestGrade.grade} · ${mmss(bestGrade.equivalent3MiSeconds)}`,
      detail: `from ${bestKind.label} · ${formatEntryValue(
        bestEntryRef,
        bestKind,
      )}`,
    };
  }
  // Otherwise: the most-logged kind's best in the window.
  const counts = new Map<string, number>();
  for (const e of entries) {
    counts.set(e.kindId, (counts.get(e.kindId) ?? 0) + 1);
  }
  let topKindId: string | undefined;
  let topCount = 0;
  for (const [id, c] of counts) {
    if (c > topCount) {
      topCount = c;
      topKindId = id;
    }
  }
  if (!topKindId) {
    return undefined;
  }
  const kind = metrics.find(m => m.id === topKindId) ?? getMetric(topKindId);
  if (!kind) {
    return undefined;
  }
  const best = bestEntry(entries, topKindId, kind, WINDOW_MS, now);
  if (!best) {
    return undefined;
  }
  return {
    kicker: `BEST ${kind.label.toUpperCase()} (30 D)`,
    label: `Best ${kind.label}`,
    main: formatEntryValue(best, kind),
    detail: `${topCount} entr${topCount === 1 ? 'y' : 'ies'} logged`,
  };
}

/** One line for an element page, e.g. "Best 3-mi equiv (30 d) · B+ · 20:41". */
export function bestResultLine(
  entries: TrainingLogEntry[],
  metrics: MetricKind[],
  now: number = Date.now(),
): string | undefined {
  const headline = buildHeadline(entries, metrics, now);
  return headline ? `${headline.label} (30 d) · ${headline.main}` : undefined;
}
