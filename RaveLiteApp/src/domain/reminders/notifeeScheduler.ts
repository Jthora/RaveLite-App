import notifee, {
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import {ELEMENTS, ElementId} from '../../theme/elements';
import {ReminderPayload, ReminderScheduler, Plan} from './types';
import {VIBRATION_PATTERNS} from './scheduler';
import {recordPulseFire} from '../journal/lastPulse';

/**
 * Notifee-backed implementation of ReminderScheduler.
 *
 * Phase A scope (this file, today):
 *   - createChannels()   → idempotent; creates one channel per element.
 *   - requestPermission() → Android 13+ POST_NOTIFICATIONS prompt.
 *   - fireNow()          → real on-device notification (used by Test Pulse).
 *   - clear()            → cancels everything notifee owns.
 *   - applyPlan()        → still a no-op stub. Phase B will replace it
 *                          with a 24h rolling pre-schedule built from
 *                          expandPlanToFires().
 *
 * Channels are versioned (`elem.<id>.v1`). Channel settings (importance,
 * vibration pattern) are immutable after creation in Android — so when we
 * change a vibration pattern in the future, bump the suffix to v2 and
 * existing users will receive the updated channel without OS conflict.
 */

const CHANNEL_VERSION = 'v2';

function channelId(element: ElementId): string {
  return `elem.${element}.${CHANNEL_VERSION}`;
}

/**
 * Slice 5 — element cue sound resolution.
 *
 * Each element channel can carry its own cue tone. Today every channel
 * uses Android's system default notification sound (`'default'`), which
 * gives us audible pulses with zero bundled assets.
 *
 * Upgrade path (no code changes required other than this map):
 *   1. Drop `<element>.wav` into `android/app/src/main/res/raw/`
 *      (lowercase ASCII, no extension referenced from JS).
 *   2. Replace the entry below with the bare filename, e.g.
 *      `fire: 'cue_fire'` for `res/raw/cue_fire.wav`.
 *   3. Bump CHANNEL_VERSION to v3 so existing devices receive the new
 *      channel config (Android channels are immutable post-creation).
 */
const CHANNEL_SOUND: Record<ElementId, string> = {
  air: 'default',
  fire: 'default',
  water: 'default',
  earth: 'default',
  heart: 'default',
};

/**
 * Notifee's channel API requires `vibrationPattern` to be an even-length
 * array of strictly positive integers. Validate at runtime so a bad
 * config falls back to "vibration on, no custom pattern" rather than
 * permanently latching the channel into a failed state and silently
 * killing every fireNow().
 */
function isValidVibrationPattern(p: readonly number[]): boolean {
  return (
    p.length > 0 && p.length % 2 === 0 && p.every(n => Number.isFinite(n) && n > 0)
  );
}

let channelsReady = false;

async function ensureChannels(): Promise<void> {
  if (channelsReady) {
    return;
  }
  // Notifee is no-op on iOS for channels; we only ship Android today,
  // but the call is safe regardless.
  await Promise.all(
    (Object.keys(ELEMENTS) as ElementId[]).map(id => {
      const pattern = VIBRATION_PATTERNS[id];
      const valid = isValidVibrationPattern(pattern);
      if (!valid) {
        // eslint-disable-next-line no-console
        console.warn(
          `[notifeeScheduler] invalid vibrationPattern for ${id}; falling back to default vibration`,
        );
      }
      return notifee.createChannel({
        id: channelId(id),
        name: `${ELEMENTS[id].name} reminders`,
        importance: AndroidImportance.HIGH,
        sound: CHANNEL_SOUND[id],
        vibration: true,
        ...(valid ? {vibrationPattern: pattern} : {}),
        lights: true,
        lightColor: ELEMENTS[id].color,
        visibility: AndroidVisibility.PUBLIC,
      });
    }),
  );
  channelsReady = true;
}

/**
 * Ask the user for POST_NOTIFICATIONS (Android 13+) and report the result.
 * Safe to call multiple times — the OS only prompts once.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  // AuthorizationStatus: 0=denied, 1=authorized, 2=provisional. Treat
  // anything > 0 as good enough to display foreground notifications.
  return settings.authorizationStatus > 0;
}

/**
 * Hook the foreground event so notifications actually buzz/light when
 * RaveLite is the active app — which is the *common* case for a training
 * companion. Without this, Notifee on Android suppresses presentation
 * while the host app is foregrounded.
 *
 * Idempotent: safe to call once at app start.
 */
let foregroundHooked = false;
export function startNotifeeForegroundBridge(): void {
  if (foregroundHooked) {
    return;
  }
  foregroundHooked = true;
  notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.PRESS) {
      // Future: deep-link to the relevant element screen using
      // detail.notification.data.element.
      // eslint-disable-next-line no-console
      console.log('[notifee] press', detail.notification?.data);
    }
  });
}

export const notifeeScheduler: ReminderScheduler = {
  async fireNow(payload: ReminderPayload) {
    await ensureChannels();
    await notifee.displayNotification({
      title: payload.title,
      body: payload.body,
      data: {
        element: payload.element,
        exerciseId: payload.exerciseId,
      },
      android: {
        channelId: channelId(payload.element),
        color: payload.color,
        colorized: true,
        smallIcon: 'ic_launcher', // TODO: ship a monochrome status-bar icon
        pressAction: {id: 'default'},
        showTimestamp: true,
      },
    });
    // Record so NowPanel can show "Pulse fired Nm ago" within the
    // 30-minute recent window. Intentionally fire-and-forget; the
    // notification has already displayed regardless.
    recordPulseFire(payload.element, payload.exerciseId);
  },

  async clear() {
    await notifee.cancelAllNotifications();
  },

  async applyPlan(_plan: Plan) {
    // Phase B: cancelAll → expandPlanToFires(plan, now, now+24h) →
    // schedule each as a TimestampTrigger on the matching element channel.
    // Plus a daily refresh hook + BOOT_COMPLETED re-expansion.
    await ensureChannels();
    // eslint-disable-next-line no-console
    console.log(
      '[notifeeScheduler] applyPlan stub — Phase B will schedule rolling 24h.',
    );
  },
};
