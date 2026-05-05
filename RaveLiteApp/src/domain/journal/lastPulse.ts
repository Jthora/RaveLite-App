/**
 * lastPulse — per-element record of the most recent system pulse.
 *
 * A "pulse" here is a notifee notification that RaveLite displayed for
 * an element (Test Pulse today; Phase B's scheduled pulses tomorrow).
 * NowPanel reads this to render the "Pulse fired Nm ago" strip above the
 * hero card, so the user can see the loop closing in real-time.
 *
 * Storage shape (key per element, JSON-encoded):
 *   settings.pulse.last.<elementId> → {at: number, exerciseId: string}
 *
 * "Recent" window for the strip is 30 minutes — after that the strip
 * fades. This is enforced at read-time so the cache never needs eviction.
 */
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import type {ElementId} from '../../theme/elements';

export interface LastPulse {
  at: number;
  exerciseId: string;
}

const RECENT_WINDOW_MS = 30 * 60 * 1000;

function key(element: ElementId): string {
  return KEYS.setting(`pulse.last.${element}`);
}

export function recordPulseFire(
  element: ElementId,
  exerciseId: string,
  at: number = Date.now(),
): void {
  store.set(key(element), JSON.stringify({at, exerciseId}));
}

/** Returns the last pulse for the element if it was within the recent
 *  window (30m). Older pulses return null so callers don't have to
 *  do their own freshness check. */
export function getRecentPulse(
  element: ElementId,
  now: number = Date.now(),
): LastPulse | null {
  const raw = store.getString(key(element));
  if (!raw) {return null;}
  try {
    const parsed = JSON.parse(raw) as LastPulse;
    if (
      typeof parsed?.at !== 'number' ||
      typeof parsed?.exerciseId !== 'string'
    ) {
      return null;
    }
    if (now - parsed.at > RECENT_WINDOW_MS) {return null;}
    return parsed;
  } catch {
    return null;
  }
}

/** Diagnostic / test helper. */
export function clearRecentPulse(element: ElementId): void {
  store.delete(key(element));
}

export const RECENT_PULSE_WINDOW_MS = RECENT_WINDOW_MS;
