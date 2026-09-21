/**
 * Screen policy — what the screen does around the clock.
 *
 * The operator's choice: the screen never sleeps (MainActivity keeps
 * FLAG_KEEP_SCREEN_ON), but outside active hours it goes to "night" —
 * backlight dropped to near-minimum, a dark veil over the UI, motion
 * still. A tap wakes it for WAKE_MS, then it settles back.
 *
 * This module is the single owner of the window brightness override.
 * It is driven by ambientLifecycle's minute tick, an exact timer at the
 * end of a wake window, and a forced re-apply when the app returns to
 * the foreground (the window drops its override when recreated).
 */
import {getActiveHours, withinActiveHours} from './activeHours';
import type {ActiveHours} from './types';
import {setWindowBrightness} from '../../native/raveLiteDevice';

export type ScreenMode = 'day' | 'night';

/** Backlight override at night (0–1). Readable in a dark room, no glare. */
export const NIGHT_BRIGHTNESS = 0.02;
/** How long a tap at night keeps the screen awake. */
export const WAKE_MS = 2 * 60_000;
/** Hand brightness back to the system. */
const SYSTEM_BRIGHTNESS = -1;

/** Pure: day inside active hours or inside a wake window, night otherwise. */
export function screenModeAt(input: {
  now: number;
  activeHours: ActiveHours;
  wakeUntil?: number;
}): ScreenMode {
  if (withinActiveHours(new Date(input.now), input.activeHours)) {
    return 'day';
  }
  if (input.wakeUntil !== undefined && input.now < input.wakeUntil) {
    return 'day';
  }
  return 'night';
}

let mode: ScreenMode = 'day';
let wakeUntil: number | undefined;
let wakeTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(mode: ScreenMode) => void>();

export function getScreenMode(): ScreenMode {
  return mode;
}

/** Fires when the mode changes. Returns an unsubscribe function. */
export function subscribeScreenMode(
  listener: (mode: ScreenMode) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Re-evaluate the mode and apply it. Brightness is only pushed when the
 * mode changes, or when `force` re-applies it (e.g. after the activity
 * came back and dropped its override).
 */
export function syncScreenPolicy(
  now: number = Date.now(),
  opts: {force?: boolean} = {},
): ScreenMode {
  const next = screenModeAt({now, activeHours: getActiveHours(), wakeUntil});
  const changed = next !== mode;
  mode = next;
  if (changed || opts.force) {
    setWindowBrightness(
      next === 'night' ? NIGHT_BRIGHTNESS : SYSTEM_BRIGHTNESS,
    );
  }
  if (changed) {
    for (const listener of listeners) {
      try {
        listener(mode);
      } catch (e) {
        console.warn('[screenPolicy] listener threw', e);
      }
    }
  }
  return mode;
}

/** A tap at night: bright and awake for WAKE_MS, then back to night. */
export function wakeScreen(now: number = Date.now()): void {
  wakeUntil = now + WAKE_MS;
  if (wakeTimer !== null) {
    clearTimeout(wakeTimer);
  }
  wakeTimer = setTimeout(() => {
    wakeTimer = null;
    syncScreenPolicy();
  }, WAKE_MS + 50);
  syncScreenPolicy(now);
}

/** Test-only reset. */
export const __test = {
  reset: () => {
    mode = 'day';
    wakeUntil = undefined;
    if (wakeTimer !== null) {
      clearTimeout(wakeTimer);
    }
    wakeTimer = null;
    listeners.clear();
  },
};
