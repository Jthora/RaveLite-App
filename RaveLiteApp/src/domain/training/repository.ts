import {store} from '../../storage';
import {quarantine} from '../diagnostics/quarantine';
import {KEYS} from '../../storage/keys';
import {logError} from '../diagnostics/errorLog';
import {BUILTIN_METRICS, builtinById} from './builtinMetrics';
import {MetricKind, TrainingLogEntry} from './types';
import type {ElementId} from '../../theme/elements';

/**
 * Persistence + CRUD for the Training Log.
 *
 *   - Metrics (the catalog): built-ins are *not* stored — they're
 *     generated from `builtinMetrics.ts` and overlaid with
 *     operator-side data (archived flag, label override). Operator
 *     additions are stored in full as `MetricKind` blobs.
 *   - Entries: stored newest-first as a single JSON array under
 *     `training.entries`. At one entry/day the array stays small
 *     even after a year (~365 items × ~100 bytes = 35 KB).
 *
 * All reads are synchronous (the store is a memory-fronted KV); writes
 * are write-through so a kill mid-edit doesn't lose data.
 */

// ─── Listeners ───────────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  for (const l of listeners) {
    try {
      l();
    } catch (e) {
      console.warn('[trainingRepository] listener threw', e);
    }
  }
}
export function subscribeTrainingLog(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ─── Metric catalog ──────────────────────────────────────────────────

interface CustomMetricsBlob {
  /** Operator-added kinds (always have id `custom.*`). */
  custom: MetricKind[];
  /** Built-in ids the operator hid from the picker. */
  archivedBuiltins: string[];
  /** Built-in id → operator-overridden label. */
  builtinOverrides: Record<string, {label?: string; notes?: string}>;
}

const EMPTY_BLOB: CustomMetricsBlob = {
  custom: [],
  archivedBuiltins: [],
  builtinOverrides: {},
};

function loadBlob(): CustomMetricsBlob {
  const raw = store.getString(KEYS.trainingMetrics);
  if (!raw) {
    return EMPTY_BLOB;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CustomMetricsBlob>;
    return {
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
      archivedBuiltins: Array.isArray(parsed.archivedBuiltins)
        ? parsed.archivedBuiltins
        : [],
      builtinOverrides:
        parsed.builtinOverrides && typeof parsed.builtinOverrides === 'object'
          ? parsed.builtinOverrides
          : {},
    };
  } catch (e) {
    // The whole Train log unreadable is the worst silent failure in the
    // app: every metric, every test, every logged run. It still falls
    // back so the app opens, but it stops being a secret.
    logError('training.load', e);
    return EMPTY_BLOB;
  }
}

function saveBlob(blob: CustomMetricsBlob): void {
  store.set(KEYS.trainingMetrics, JSON.stringify(blob));
  notify();
}

/**
 * All metric kinds visible to the operator — built-ins (with overrides
 * applied, archived hidden) followed by custom (newest-last).
 */
export function loadMetrics(): MetricKind[] {
  const blob = loadBlob();
  const archived = new Set(blob.archivedBuiltins);
  const overlaid: MetricKind[] = BUILTIN_METRICS.filter(
    m => !archived.has(m.id),
  ).map(m => {
    const ov = blob.builtinOverrides[m.id];
    return ov
      ? {...m, label: ov.label ?? m.label, notes: ov.notes ?? m.notes}
      : m;
  });
  // Legacy custom entries written before the element field existed
  // default to 'any' so they appear on every Train surface.
  const custom = blob.custom
    .filter(m => !m.archived)
    .map(m => (m.element ? m : {...m, element: 'any' as const}));
  return [...overlaid, ...custom];
}

/** Element-scoped catalog — built-ins / customs whose element matches
 *  `el` or is `'any'`. Used by per-element Train surfaces. */
export function loadMetricsForElement(el: ElementId): MetricKind[] {
  return loadMetrics().filter(m => m.element === el || m.element === 'any');
}

/**
 * All archived metrics — built-ins that were hidden plus custom kinds
 * that were archived (because entries still reference them). Used by
 * the manage-metrics UI to surface restore actions.
 */
export function loadArchivedMetrics(): MetricKind[] {
  const blob = loadBlob();
  const archivedBuiltins = blob.archivedBuiltins
    .map(id => BUILTIN_METRICS.find(m => m.id === id))
    .filter((m): m is MetricKind => !!m);
  const archivedCustom = blob.custom.filter(m => !!m.archived);
  return [...archivedBuiltins, ...archivedCustom];
}

/** Resolve a kind by id even if archived (so old entries still render). */
export function getMetric(id: string): MetricKind | undefined {
  const blob = loadBlob();
  const ov = blob.builtinOverrides[id];
  const seed = builtinById(id);
  if (seed) {
    return ov
      ? {...seed, label: ov.label ?? seed.label, notes: ov.notes ?? seed.notes}
      : seed;
  }
  return blob.custom.find(m => m.id === id);
}

export function addCustomMetric(
  input: Omit<MetricKind, 'id' | 'builtIn'>,
): MetricKind {
  const blob = loadBlob();
  const kind: MetricKind = {
    ...input,
    id: `custom.${randomId()}`,
    builtIn: false,
  };
  blob.custom.push(kind);
  saveBlob(blob);
  return kind;
}

/**
 * Edit any metric. Built-ins keep their structure (only label/notes
 * are overridable); custom metrics are mutated in place.
 */
export function updateMetric(
  id: string,
  patch: Partial<Omit<MetricKind, 'id' | 'builtIn'>>,
): void {
  const blob = loadBlob();
  if (id.startsWith('builtin.')) {
    blob.builtinOverrides[id] = {
      label: patch.label,
      notes: patch.notes,
    };
  } else {
    const idx = blob.custom.findIndex(m => m.id === id);
    if (idx === -1) {
      return;
    }
    blob.custom[idx] = {...blob.custom[idx], ...patch, id, builtIn: false};
  }
  saveBlob(blob);
}

/**
 * Delete a metric. Built-ins are *archived* (hidden), not deleted, so
 * historical entries that reference them still resolve. Custom kinds
 * are archived too if any entries reference them; otherwise removed.
 */
export function deleteMetric(id: string): void {
  const blob = loadBlob();
  if (id.startsWith('builtin.')) {
    if (!blob.archivedBuiltins.includes(id)) {
      blob.archivedBuiltins.push(id);
    }
    saveBlob(blob);
    return;
  }
  const referenced = loadEntries().some(e => e.kindId === id);
  if (referenced) {
    const idx = blob.custom.findIndex(m => m.id === id);
    if (idx !== -1) {
      blob.custom[idx] = {...blob.custom[idx], archived: true};
    }
  } else {
    blob.custom = blob.custom.filter(m => m.id !== id);
  }
  saveBlob(blob);
}

/** Restore an archived metric to the picker. */
export function unarchiveMetric(id: string): void {
  const blob = loadBlob();
  if (id.startsWith('builtin.')) {
    blob.archivedBuiltins = blob.archivedBuiltins.filter(x => x !== id);
  } else {
    const idx = blob.custom.findIndex(m => m.id === id);
    if (idx !== -1) {
      blob.custom[idx] = {...blob.custom[idx], archived: false};
    }
  }
  saveBlob(blob);
}

// ─── Entries ─────────────────────────────────────────────────────────

export function loadEntries(): TrainingLogEntry[] {
  const raw = store.getString(KEYS.trainingEntries);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      quarantine(KEYS.trainingEntries, raw, 'not a list');
      return [];
    }
    return parsed as TrainingLogEntry[];
  } catch (e) {
    quarantine(KEYS.trainingEntries, raw, e);
    return [];
  }
}

/** Entries scoped to one element. Legacy entries without an `element`
 *  field are resolved via their kind's element ('any' kinds match
 *  every element). */
export function loadEntriesForElement(el: ElementId): TrainingLogEntry[] {
  const entries = loadEntries();
  return entries.filter(e => {
    if (e.element) {
      return e.element === el;
    }
    const kind = getMetric(e.kindId);
    if (!kind) {
      return false;
    }
    return kind.element === el || kind.element === 'any';
  });
}

function saveEntries(entries: TrainingLogEntry[]): void {
  // Always persist newest-first so screens can render directly.
  const sorted = [...entries].sort((a, b) => b.at - a.at);
  store.set(KEYS.trainingEntries, JSON.stringify(sorted));
  notify();
}

export function addEntry(
  input: Omit<TrainingLogEntry, 'id'>,
): TrainingLogEntry {
  const entry: TrainingLogEntry = {...input, id: randomId()};
  const all = loadEntries();
  all.push(entry);
  saveEntries(all);
  return entry;
}

export function updateEntry(
  id: string,
  patch: Partial<Omit<TrainingLogEntry, 'id'>>,
): void {
  const all = loadEntries();
  const idx = all.findIndex(e => e.id === id);
  if (idx === -1) {
    return;
  }
  all[idx] = {...all[idx], ...patch, id};
  saveEntries(all);
}

export function deleteEntry(id: string): void {
  const all = loadEntries().filter(e => e.id !== id);
  saveEntries(all);
}

// ─── Helpers ─────────────────────────────────────────────────────────

function randomId(): string {
  // Compact, URL-safe, sortable enough for our scale.
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}
