import {ElementId} from '../../theme/elements';
import {Plan} from './types';
import {expandPlanToFires} from './expandPlan';

/** Result describing the next pulse coming for a given element. */
export interface NextFireInfo {
  /** Epoch ms when the next pulse fires. */
  ts: number;
  /** Cadence interval (minutes) of the slot that owns this fire. */
  everyMinutes: number;
  /** Window id for context (e.g. 'desk-hours'). */
  windowId: string;
}

/**
 * Find the next scheduled pulse for a given element under the given plan.
 *
 * Pure function — derives from `expandPlanToFires`. Used by the hero's
 * cadence ribbon to show "how close is the next call?" without having
 * to query the native scheduler.
 *
 * Returns undefined if no pulse for this element falls within the next
 * 24 hours (e.g. weekend, or this element has no slots in any active
 * window today/tomorrow).
 */
export function nextFireForElement(
  plan: Plan,
  element: ElementId,
  now: number = Date.now(),
): NextFireInfo | undefined {
  const horizon = now + 24 * 60 * 60 * 1000;
  const fires = expandPlanToFires(plan, now, horizon);
  for (const f of fires) {
    // Strictly future: a pulse "right now" is not the *next* pulse, it's
    // the current one. Avoids a 100%-full ribbon snapping to 0%.
    if (f.ts <= now) {
      continue;
    }
    if (f.element === element) {
      return {ts: f.ts, everyMinutes: f.everyMinutes, windowId: f.windowId};
    }
  }
  return undefined;
}
