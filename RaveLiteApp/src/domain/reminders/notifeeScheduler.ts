import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  TriggerType,
  type Event,
  type Notification,
} from '@notifee/react-native';
import {moveForExercise} from '../exercises/moves';
import {ELEMENTS, ElementId} from '../../theme/elements';
import {ReminderPayload, Plan} from './types';
import {VIBRATION_PATTERNS, type ReminderScheduler} from './scheduler';

/**
 * Notifee-backed implementation of ReminderScheduler.
 *
 * Scope:
 *   - ensureChannels()    → idempotent; two channels per element:
 *       · sounding `elem.<id>.v3`       — element cue as the channel sound
 *       · quiet    `elem.<id>.quiet.v1` — same vibration, no sound, used
 *         when the cue already played in-app on the alarm stream
 *   - requestPermission() → Android 13+ POST_NOTIFICATIONS prompt.
 *   - fireNow()           → real on-device notification. Pulses carry
 *                           Done / +5 / Skip action buttons so a set can
 *                           be answered without opening the app.
 *   - clear()             → cancels everything notifee owns.
 *   - applyPlan()         → still a no-op stub; the JS pulse runtime owns
 *                           scheduling while the ambient service is alive.
 *
 * Channel settings (importance, sound, vibration pattern) are immutable
 * after creation in Android — so any change bumps that channel set's
 * version suffix, and superseded channels are deleted so they don't
 * linger in system settings.
 */

const CHANNEL_VERSION = 'v3';
const LEGACY_CHANNEL_VERSIONS = ['v1', 'v2'];
const QUIET_CHANNEL_VERSION = 'v1';

function channelId(
  element: ElementId,
  version: string = CHANNEL_VERSION,
): string {
  return `elem.${element}.${version}`;
}

function quietChannelId(element: ElementId): string {
  return `elem.${element}.quiet.${QUIET_CHANNEL_VERSION}`;
}

/** The channel a pulse notification posts on. */
export function channelIdFor(element: ElementId, quiet: boolean): string {
  return quiet ? quietChannelId(element) : channelId(element);
}

/**
 * Element cue sounds — bare filenames of `android/app/src/main/res/raw/*.wav`.
 *
 *   Fire  — three rising staccato beeps  (ignite)
 *   Air   — one high bell ding           (lift)
 *   Earth — low bloop that drops         (root)
 *   Water — two bubbly rising bloops     (flow)
 *   Heart — lub-dub under a two-note chime (seal)
 *
 * The same files are played in-app on the alarm stream by the native
 * RaveLiteDevice module. Changing a file requires a native rebuild.
 */
const CHANNEL_SOUND: Record<ElementId, string> = {
  air: 'cue_air',
  fire: 'cue_fire',
  water: 'cue_water',
  earth: 'cue_earth',
  heart: 'cue_heart',
};

/** Action ids on pulse notifications. */
export type NotificationActionId = 'seal' | 'snooze' | 'skip';

/** What an action handler receives from a notification button press. */
export interface NotificationAction {
  actionId: NotificationActionId;
  /** The notification's `data` payload (all values are strings). */
  data: Record<string, string>;
}

export type NotificationActionHandler = (
  action: NotificationAction,
) => void | Promise<void>;

/**
 * Notifee's channel API requires `vibrationPattern` to be an even-length
 * array of strictly positive integers. Validate at runtime so a bad
 * config falls back to "vibration on, no custom pattern" rather than
 * permanently latching the channel into a failed state and silently
 * killing every fireNow().
 */
function isValidVibrationPattern(p: readonly number[]): boolean {
  return (
    p.length > 0 &&
    p.length % 2 === 0 &&
    p.every(n => Number.isFinite(n) && n > 0)
  );
}

let channelsReady = false;

async function ensureChannels(): Promise<void> {
  if (channelsReady) {
    return;
  }
  const ids = Object.keys(ELEMENTS) as ElementId[];
  // Superseded channels: best-effort delete so settings only show the
  // live set. Failure is harmless.
  await Promise.all(
    ids.flatMap(id =>
      LEGACY_CHANNEL_VERSIONS.map(v =>
        notifee.deleteChannel(channelId(id, v)).catch(() => {}),
      ),
    ),
  );
  // Notifee is no-op on iOS for channels; we only ship Android today,
  // but the call is safe regardless.
  await Promise.all(
    ids.flatMap(id => {
      const pattern = VIBRATION_PATTERNS[id];
      const valid = isValidVibrationPattern(pattern);
      if (!valid) {
        console.warn(
          `[notifeeScheduler] invalid vibrationPattern for ${id}; falling back to default vibration`,
        );
      }
      const shared = {
        importance: AndroidImportance.HIGH,
        vibration: true,
        ...(valid ? {vibrationPattern: pattern} : {}),
        lights: true,
        lightColor: ELEMENTS[id].color,
        visibility: AndroidVisibility.PUBLIC,
      };
      return [
        notifee.createChannel({
          ...shared,
          id: channelId(id),
          name: `${ELEMENTS[id].name} reminders`,
          sound: CHANNEL_SOUND[id],
        }),
        notifee.createChannel({
          ...shared,
          id: quietChannelId(id),
          name: `${ELEMENTS[id].name} reminders (in-app cue)`,
          description:
            'Used while RaveLite plays the cue itself on the alarm stream.',
        }),
      ];
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
 * Translate a raw notifee event into a `NotificationAction`, or
 * `undefined` if it isn't a pulse button press. Shared by the foreground
 * bridge and the background handler registered in `index.js`.
 */
export function toNotificationAction(
  event: Event,
): NotificationAction | undefined {
  if (event.type !== EventType.ACTION_PRESS) {
    return undefined;
  }
  const id = event.detail.pressAction?.id;
  if (id !== 'seal' && id !== 'snooze' && id !== 'skip') {
    return undefined;
  }
  const raw = event.detail.notification?.data ?? {};
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    data[k] = String(v);
  }
  return {actionId: id, data};
}

/**
 * Hook the foreground event so notifications actually buzz/light when
 * RaveLite is the active app — which is the *common* case for a training
 * companion — and so Done / +5 / Skip buttons work while it's open.
 *
 * Idempotent: safe to call once at app start.
 */
let foregroundHooked = false;
export function startNotifeeForegroundBridge(
  onAction?: NotificationActionHandler,
): void {
  if (foregroundHooked) {
    return;
  }
  foregroundHooked = true;
  notifee.onForegroundEvent(event => {
    const action = toNotificationAction(event);
    if (action && onAction) {
      Promise.resolve(onAction(action)).catch(err =>
        console.warn('[notifee] action handler failed', err),
      );
      return;
    }
    if (event.type === EventType.PRESS) {
      // Future: deep-link to the relevant element screen using
      // detail.notification.data.element.

      console.log('[notifee] press', event.detail.notification?.data);
    }
  });
}

/**
 * Dismiss a pulse's notification once it's been answered. Notifee's
 * cancelNotification also removes a pending OS trigger with the same id,
 * so this clears the pulse's backup chime too.
 */
export async function cancelPulseNotification(pulseId: string): Promise<void> {
  await notifee.cancelNotification(pulseId);
}

/** data flags on OS-scheduled chimes. Only `backup` ones are reconciled. */
const BACKUP_FLAG = 'backup';
const SNOOZE_FLAG = 'snooze';
/** An OS chime nobody answers clears itself after the answer window. */
const OS_CHIME_TIMEOUT_MS = 8 * 60_000;

/**
 * Schedule an OS-level chime for a pulse at `triggerAt`.
 *
 *  - `backup`: held for an upcoming chime in case the app is killed;
 *    listed and reconciled by the backup scheduler.
 *  - `snooze`: a +5 pressed while the app wasn't running; left alone.
 *
 * It reuses the pulse id as notification id (so cancel and Done / +5 /
 * Skip work unchanged) and posts on the sounding channel, because if it
 * fires RaveLite's own cue player isn't running. `onlyAlertOnce` keeps it
 * silent if the live notification for the same pulse is still showing.
 */
export async function scheduleBackupChime(
  payload: ReminderPayload,
  triggerAt: number,
  opts: {exact: boolean; kind: 'backup' | 'snooze'},
): Promise<void> {
  await ensureChannels();
  const base = buildPulseNotification(payload, {quiet: false});
  await notifee.createTriggerNotification(
    {
      ...base,
      data: {
        ...base.data,
        [opts.kind === 'backup' ? BACKUP_FLAG : SNOOZE_FLAG]: '1',
      },
      android: {
        ...base.android,
        onlyAlertOnce: true,
        timeoutAfter: OS_CHIME_TIMEOUT_MS,
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerAt,
      alarmManager: {
        type: opts.exact
          ? AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE
          : AlarmType.SET_AND_ALLOW_WHILE_IDLE,
      },
    },
  );
}

/** Backup chimes the OS currently holds: pulse id → trigger time. */
export async function listBackupChimes(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (const {
    notification,
    trigger,
  } of await notifee.getTriggerNotifications()) {
    if (
      notification.id &&
      notification.data?.[BACKUP_FLAG] === '1' &&
      trigger.type === TriggerType.TIMESTAMP
    ) {
      out.set(notification.id, trigger.timestamp);
    }
  }
  return out;
}

export async function cancelBackupChime(pulseId: string): Promise<void> {
  await notifee.cancelTriggerNotification(pulseId);
}

/** Exact alarms usable: granted, or not needed on this Android version. */
export async function exactAlarmsAllowed(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    // AndroidNotificationSetting: 0 = DISABLED, 1 = ENABLED, -1 = NOT_SUPPORTED.
    return settings.android?.alarm !== 0;
  } catch {
    return false;
  }
}

/**
 * Pure: the notifee notification for a pulse payload. `quiet` selects the
 * element's no-sound channel (the cue already played in-app, or is Off).
 */
export function buildPulseNotification(
  payload: ReminderPayload,
  opts: {quiet: boolean},
): Notification {
  return {
    // Pulse id doubles as the notification id so an in-app answer can
    // cancel the matching notification.
    ...(payload.pulseId ? {id: payload.pulseId} : {}),
    title: payload.title,
    body: payload.body,
    data: {
      element: payload.element,
      exerciseId: payload.exerciseId,
      ...(payload.pulseId ? {pulseId: payload.pulseId} : {}),
      ...(payload.data ?? {}),
    },
    android: {
      channelId: channelIdFor(payload.element, opts.quiet),
      color: payload.color,
      colorized: true,
      // The move's pictogram (res/drawable/ic_move_*), tinted by `color`.
      smallIcon: `ic_move_${moveForExercise(payload.exerciseId) ?? 'pulse'}`,
      pressAction: {id: 'default', launchActivity: 'default'},
      showTimestamp: true,
      ...(payload.pulseId
        ? {
            actions: [
              {title: 'Done', pressAction: {id: 'seal'}},
              {title: '+5 min', pressAction: {id: 'snooze'}},
              {title: 'Skip', pressAction: {id: 'skip'}},
            ],
          }
        : {}),
    },
  };
}

export const notifeeScheduler: ReminderScheduler = {
  async fireNow(payload: ReminderPayload) {
    await ensureChannels();
    await notifee.displayNotification(
      buildPulseNotification(payload, {quiet: payload.silent === true}),
    );
  },

  async clear() {
    await notifee.cancelAllNotifications();
  },

  async applyPlan(_plan: Plan) {
    // The JS pulse runtime + plan/sets schedulers own firing while the
    // ambient foreground service keeps the process alive. OS-level
    // TimestampTriggers (for a killed process) remain future work.
    await ensureChannels();
  },
};
