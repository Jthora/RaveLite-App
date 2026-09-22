import {store} from '../../storage';
import {quarantine} from '../diagnostics/quarantine';
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
    seedDefault();
    store.set(KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
    return DEFAULT_PLAN;
  }
  try {
    return JSON.parse(raw) as Plan;
  } catch (e) {
    // Corrupt — fall back to defaults rather than crash on launch, but
    // keep the plan somebody built before the default replaces it.
    quarantine(KEYS.planCurrent, raw, e);
    seedDefault();
    return DEFAULT_PLAN;
  }
}

/**
 * Write the default without telling anyone.
 *
 * Seeding is not an edit: every reader of an empty store gets the default
 * either way. And a read is what seeds — during render, often, Today's
 * model being the first reader after a fresh install — so notifying from
 * here runs every listener's setState inside another component's render,
 * which React rejects. Code that empties the store on purpose and needs
 * the schedulers to hear calls `resetPlanToDefault()`.
 */
function seedDefault(): void {
  store.set(KEYS.planCurrent, JSON.stringify(DEFAULT_PLAN));
}

export function savePlan(plan: Plan): void {
  store.set(KEYS.planCurrent, JSON.stringify(plan));
  notifyPlan(plan);
}

function notifyPlan(plan: Plan): void {
  for (const l of planListeners) {
    try {
      l(plan);
    } catch (e) {
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
