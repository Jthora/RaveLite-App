/**
 * App-wide ambient lifecycle, checked every minute and whenever My day
 * (active hours) is saved.
 *
 *  - Foreground service: keeps the JS runtime (and so every chime) alive
 *    while RaveLite is in the background or the screen is off. Running
 *    whenever paging is allowed (inside active hours and not manually
 *    paused), stopped otherwise.
 *  - Screen policy: day inside active hours, dimmed night outside them
 *    (see `screenPolicy`).
 */
import {pagingAllowedAt, subscribeActiveHours} from './activeHours';
import {
  startAmbientForegroundService,
  stopAmbientForegroundService,
} from './foregroundService';
import {syncScreenPolicy} from './screenPolicy';

export const AMBIENT_CHECK_MS = 60_000;

let timer: ReturnType<typeof setInterval> | null = null;
let unsubscribe: (() => void) | null = null;
let running: boolean | null = null;

/** Start or stop the service to match the paging rule right now. */
export function syncAmbientService(now: Date = new Date()): void {
  const allowed = pagingAllowedAt(now) === null;
  if (allowed === running) {
    return;
  }
  running = allowed;
  const change = allowed
    ? startAmbientForegroundService()
    : stopAmbientForegroundService();
  change.catch(err =>
    // A failed start (e.g. notifications revoked) must not crash the app;
    // chimes still work while RaveLite is in the foreground.
    // eslint-disable-next-line no-console
    console.warn('[ambientLifecycle] service change failed', err),
  );
}

function tick(): void {
  syncAmbientService();
  syncScreenPolicy();
}

/** Idempotent; call once after hydration. */
export function startAmbientLifecycle(): void {
  if (timer !== null) {
    return;
  }
  tick();
  timer = setInterval(tick, AMBIENT_CHECK_MS);
  unsubscribe = subscribeActiveHours(() => tick());
}

export function stopAmbientLifecycle(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  unsubscribe?.();
  unsubscribe = null;
  running = null;
}
