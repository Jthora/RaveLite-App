/**
 * App-wide ambient lifecycle, checked every minute and whenever My day
 * (active hours) is saved.
 *
 *  - Foreground service: keeps the JS runtime (and so every chime) alive
 *    while RaveLite is in the background or the screen is off. It runs
 *    around the clock. It used to stop outside My day, which let Android
 *    close the app overnight — and nothing started it again, so the
 *    morning's chimes came only as OS backups (seen on the author's phone,
 *    22 Sep 2026). Chimes still stay silent outside My day and during a
 *    pause; that is the paging rule's job, not the service's.
 *  - Screen policy: day inside active hours, dimmed night outside them
 *    (see `screenPolicy`).
 */
import {subscribeActiveHours} from './activeHours';
import {
  startAmbientForegroundService,
  stopAmbientForegroundService,
} from './foregroundService';
import {syncScreenPolicy} from './screenPolicy';

export const AMBIENT_CHECK_MS = 60_000;

let timer: ReturnType<typeof setInterval> | null = null;
let unsubscribe: (() => void) | null = null;
let running: boolean | null = null;

/** Make sure the service is running (retried each minute if it failed). */
export function syncAmbientService(): void {
  const allowed = true;
  if (allowed === running) {
    return;
  }
  running = allowed;
  const change = allowed
    ? startAmbientForegroundService()
    : stopAmbientForegroundService();
  change.catch(err => {
    // A failed start (e.g. notifications revoked) must not crash the app;
    // chimes still work while RaveLite is in the foreground. Forget what
    // was asked, so the next minute's check tries again instead of
    // believing the service is running.
    running = null;
    console.warn('[ambientLifecycle] service change failed', err);
  });
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
