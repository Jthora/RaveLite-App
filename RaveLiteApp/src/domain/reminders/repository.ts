import {store} from '../../storage';
import {CURRENT_SCHEMA_VERSION, KEYS} from '../../storage/keys';
import {Plan} from './types';
import {DEFAULT_PLAN} from './defaultPlan';

/**
 * Plan persistence. Single active Plan at a time (multi-plan support is a
 * future feature — when added, `plan.current` becomes a pointer to one of
 * `plan.<id>` entries).
 */

export function loadPlan(): Plan {
  const raw = store.getString(KEYS.planCurrent);
  if (!raw) {
    savePlan(DEFAULT_PLAN);
    store.set(KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
    return DEFAULT_PLAN;
  }
  try {
    return JSON.parse(raw) as Plan;
  } catch {
    // Corrupt — fall back to defaults rather than crash on launch.
    savePlan(DEFAULT_PLAN);
    return DEFAULT_PLAN;
  }
}

export function savePlan(plan: Plan): void {
  store.set(KEYS.planCurrent, JSON.stringify(plan));
  for (const l of planListeners) {
    try {
      l(plan);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[repository] plan listener threw', e);
    }
  }
}

const planListeners = new Set<(plan: Plan) => void>();

/**
 * Subscribe to plan saves. Fires on every `savePlan` (including
 * `resetPlanToDefault`). Returns an unsubscribe function. Used by the
 * plan-driven scheduler to re-reconcile when the operator edits.
 */
export function subscribePlan(listener: (plan: Plan) => void): () => void {
  planListeners.add(listener);
  return () => {
    planListeners.delete(listener);
  };
}

export function resetPlanToDefault(): Plan {
  savePlan(DEFAULT_PLAN);
  return DEFAULT_PLAN;
}
