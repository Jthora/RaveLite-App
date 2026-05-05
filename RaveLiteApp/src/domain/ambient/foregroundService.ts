/**
 * Slice 5 — ambient Foreground Service.
 *
 * Wraps Notifee's built-in FGS so RaveLite stays alive in the background
 * during active hours. When started:
 *
 *   - A persistent low-importance notification is posted on the
 *     dedicated `ambient.fgs.v1` channel ("RaveLite is awake").
 *   - The OS marks our process as a foreground-service host, which
 *     blocks Doze + bypasses background-execution limits.
 *   - The `task` callback runs as the FGS lifecycle. We keep it pending
 *     until the app calls `stopAmbientForegroundService()`, at which
 *     point Notifee tears down the notification + the service.
 *
 * Idempotent: register() is safe to call once at boot; start/stop guard
 * against double-fires via a module-local `started` flag.
 *
 * Manifest pre-reqs (already present):
 *   - `<uses-permission FOREGROUND_SERVICE_SPECIAL_USE />` in app manifest
 *   - `<service android:foregroundServiceType="specialUse" ... />` override
 *   - Notifee's own manifest contributes the FGS class + the base
 *     FOREGROUND_SERVICE permission.
 */
import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from '@notifee/react-native';

const CHANNEL_ID = 'ambient.fgs.v1';
const NOTIFICATION_ID = 'ambient.fgs';

let registered = false;
let started = false;
let stopResolver: (() => void) | null = null;

/**
 * Register the FGS task runner. Must be called once at app boot, BEFORE
 * any call to start/stop. Idempotent.
 *
 * The task body just parks on a Promise; we control teardown via
 * `notifee.stopForegroundService()`, not by resolving the task. This is
 * the pattern Notifee documents for "long-lived service".
 */
export function registerAmbientForegroundService(): void {
  if (registered) {
    return;
  }
  registered = true;
  notifee.registerForegroundService(() => {
    return new Promise<void>(resolve => {
      stopResolver = resolve;
    });
  });
}

async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'RaveLite ambient',
    description: 'Keeps RaveLite awake during active hours.',
    importance: AndroidImportance.LOW, // no sound / vibration
    visibility: AndroidVisibility.SECRET,
    vibration: false,
    sound: undefined,
  });
}

/**
 * Start the ambient FGS. Posts the persistent notification + spins up
 * the service. No-op if already started.
 */
export async function startAmbientForegroundService(): Promise<void> {
  if (started) {
    return;
  }
  if (!registered) {
    // Defensive: caller forgot to register. Register on the fly so
    // start still works in dev hot-reload scenarios.
    registerAmbientForegroundService();
  }
  await ensureChannel();
  await notifee.displayNotification({
    id: NOTIFICATION_ID,
    title: 'RaveLite',
    body: 'Ambient pulses active',
    android: {
      channelId: CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      smallIcon: 'ic_launcher',
      pressAction: {id: 'default', launchActivity: 'default'},
    },
  });
  started = true;
}

/**
 * Stop the ambient FGS. Cancels the notification + lets the task
 * promise resolve so the OS reaps the service. No-op if not started.
 */
export async function stopAmbientForegroundService(): Promise<void> {
  if (!started) {
    return;
  }
  started = false;
  // Resolve the task so the FGS can shut down cleanly. Notifee will
  // also cancel the foreground notification as part of stop().
  if (stopResolver) {
    stopResolver();
    stopResolver = null;
  }
  await notifee.stopForegroundService();
}

/** Test-only state inspector. */
export const __test = {
  isStarted: () => started,
  isRegistered: () => registered,
  reset: () => {
    registered = false;
    started = false;
    stopResolver = null;
  },
};
