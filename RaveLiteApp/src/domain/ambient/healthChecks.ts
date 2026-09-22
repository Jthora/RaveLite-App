import notifee from '@notifee/react-native';

import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {getAlarmVolume, hasDeviceModule} from '../../native/raveLiteDevice';
import {getActiveHours, withinActiveHours} from './activeHours';
import {gapsBetween} from './heartbeat';

/**
 * Stay-alive health checks — what keeps chimes firing on this phone.
 *
 * `gatherHealthInputs` probes the OS (notifee + the RaveLiteDevice module)
 * and reads the operator's manual confirmations; `summarizeHealth` turns
 * that into an ordered checklist (problems first). A probe that fails
 * reports "unknown", never "ok".
 *
 * Some things Android won't tell an app (HyperOS Autostart, "locked in
 * recents", being on the charger), so the operator ticks those off.
 */

export type HealthStatus = 'ok' | 'warn' | 'unknown';

export type HealthFix =
  | 'notification-settings'
  | 'alarm-permission'
  | 'battery-optimization'
  | 'power-manager';

export type ConfirmId = 'autostart' | 'lockedInRecents' | 'onCharger';

export interface HealthInputs {
  /** null = couldn't read. */
  notificationsAuthorized: boolean | null;
  exactAlarms: 'enabled' | 'disabled' | 'not-supported' | null;
  /** true = the OS may restrict RaveLite in the background. */
  batteryOptimized: boolean | null;
  /** The phone has an OEM power / autostart screen (e.g. HyperOS). */
  powerManagerAvailable: boolean;
  alarmVolume: {current: number; max: number} | null;
  cuePlayerAvailable: boolean;
  confirmed: Record<ConfirmId, boolean>;
  /** The latest time in the last day the app was not running during My day. */
  lastGap?: {from: number; to: number};
}

export interface HealthCheck {
  id: string;
  title: string;
  detail: string;
  status: HealthStatus;
  /** System screen that fixes it, when there is one. */
  fix?: HealthFix;
  /** Manual check the operator ticks off. */
  confirm?: ConfirmId;
}

// Numeric values of notifee's AuthorizationStatus / AndroidNotificationSetting.
const AUTHORIZED = 1;
const ALARM_NOT_SUPPORTED = -1;
const ALARM_DISABLED = 0;
const ALARM_ENABLED = 1;

const STATUS_RANK: Record<HealthStatus, number> = {warn: 0, unknown: 1, ok: 2};

export function summarizeHealth(input: HealthInputs): {
  checks: HealthCheck[];
  warnings: number;
} {
  const checks: HealthCheck[] = [];

  const notifications = input.notificationsAuthorized;
  checks.push({
    id: 'notifications',
    title: 'Notifications allowed',
    status: notifications === null ? 'unknown' : notifications ? 'ok' : 'warn',
    detail:
      notifications === false
        ? "Chimes can't show or vibrate until you allow notifications."
        : 'Chimes show, vibrate and have Done / +5 / Skip buttons.',
    fix: notifications === false ? 'notification-settings' : undefined,
  });

  const alarms = input.exactAlarms;
  checks.push({
    id: 'exact-alarms',
    title: 'Exact alarms allowed',
    status: alarms === null ? 'unknown' : alarms === 'disabled' ? 'warn' : 'ok',
    detail:
      alarms === 'disabled'
        ? "Without this, backup chimes can't fire if Android closes RaveLite."
        : 'Backup chimes can fire on time even if Android closes RaveLite.',
    fix: alarms === 'disabled' ? 'alarm-permission' : undefined,
  });

  const battery = input.batteryOptimized;
  checks.push({
    id: 'battery',
    title: 'Battery: no restrictions',
    status: battery === null ? 'unknown' : battery ? 'warn' : 'ok',
    detail: battery
      ? 'Android may pause RaveLite in the background. Set its battery use to "No restrictions".'
      : "Android won't pause RaveLite to save battery.",
    fix: battery ? 'battery-optimization' : undefined,
  });

  if (input.powerManagerAvailable) {
    checks.push({
      id: 'autostart',
      title: 'Autostart on',
      status: input.confirmed.autostart ? 'ok' : 'warn',
      detail:
        'On HyperOS, RaveLite needs Autostart to restart and keep its alarms. Turn it on, then tap Mark done.',
      fix: 'power-manager',
      confirm: 'autostart',
    });
  }

  // The one check that reads what happened rather than a setting: every
  // other row could say "all set" while Android was closing the app.
  const gap = input.lastGap;
  checks.push({
    id: 'kept-running',
    title: 'Chimes kept running',
    status: gap ? 'warn' : 'ok',
    detail: gap
      ? `Android closed RaveLite from ${when(gap.from, gap.to)} to ${hm(
          gap.to,
        )}. Chimes did not sound then.`
      : 'No gaps in My day in the last 24 hours.',
    fix: gap
      ? input.powerManagerAvailable
        ? 'power-manager'
        : 'battery-optimization'
      : undefined,
  });

  const volume = input.alarmVolume;
  checks.push({
    id: 'alarm-volume',
    title: 'Alarm volume up',
    status:
      !input.cuePlayerAvailable || volume === null
        ? 'unknown'
        : volume.current > 0
        ? 'ok'
        : 'warn',
    detail: !input.cuePlayerAvailable
      ? "This build can't check it. Chimes play at alarm volume."
      : volume === null
      ? "Couldn't read alarm volume."
      : volume.current > 0
      ? `Alarm volume ${volume.current}/${volume.max}. Chimes play at this level.`
      : 'Alarm volume is 0, so chimes are silent. Turn it up.',
  });

  checks.push({
    id: 'locked-in-recents',
    title: 'Locked in recent apps',
    status: input.confirmed.lockedInRecents ? 'ok' : 'warn',
    detail:
      'Open recent apps, long-press RaveLite and lock it. Then clearing recent apps won’t close it.',
    confirm: 'lockedInRecents',
  });

  checks.push({
    id: 'on-charger',
    title: 'On the charger',
    status: input.confirmed.onCharger ? 'ok' : 'warn',
    detail: 'The screen stays on all day, so keep the phone plugged in.',
    confirm: 'onCharger',
  });

  const ordered = checks
    .map((check, index) => ({check, index}))
    .sort(
      (a, b) =>
        STATUS_RANK[a.check.status] - STATUS_RANK[b.check.status] ||
        a.index - b.index,
    )
    .map(({check}) => check);

  return {
    checks: ordered,
    warnings: ordered.filter(c => c.status === 'warn').length,
  };
}

const hm = (at: number): string => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
};

/** "13:10", or "yesterday 22:40" when it was not the same day as `to`. */
const when = (at: number, to: number): string =>
  new Date(at).toDateString() === new Date(to).toDateString()
    ? hm(at)
    : `yesterday ${hm(at)}`;

const DAY_MS = 86_400_000;
const STEP_MS = 5 * 60_000;

/** The latest gap in the last day that cost chimes: one inside My day. */
export function lastGapInMyDay(
  now: number = Date.now(),
): {from: number; to: number} | undefined {
  const hours = getActiveHours();
  return (
    gapsBetween(now - DAY_MS, now)
      // Only the part in the last day: a phone left off for a week is not
      // news about today.
      .map(g => ({from: Math.max(g.from, now - DAY_MS), to: g.to}))
      .filter(g => {
        for (let t = g.from; t <= g.to; t += STEP_MS) {
          if (withinActiveHours(new Date(t), hours)) {
            return true;
          }
        }
        return false;
      })
      .pop()
  );
}

// ── OS probes ────────────────────────────────────────────────────────

function mapAlarmSetting(
  value: number | undefined,
): HealthInputs['exactAlarms'] {
  if (value === ALARM_ENABLED) {
    return 'enabled';
  }
  if (value === ALARM_DISABLED) {
    return 'disabled';
  }
  if (value === ALARM_NOT_SUPPORTED) {
    return 'not-supported';
  }
  return null;
}

export async function gatherHealthInputs(): Promise<HealthInputs> {
  const [settings, batteryOptimized, power, alarmVolume] = await Promise.all([
    notifee.getNotificationSettings().catch(() => null),
    notifee.isBatteryOptimizationEnabled().catch(() => null),
    notifee.getPowerManagerInfo().catch(() => null),
    getAlarmVolume(),
  ]);
  return {
    notificationsAuthorized: settings
      ? settings.authorizationStatus >= AUTHORIZED
      : null,
    exactAlarms: settings ? mapAlarmSetting(settings.android?.alarm) : null,
    batteryOptimized,
    powerManagerAvailable: !!power?.activity,
    alarmVolume,
    cuePlayerAvailable: hasDeviceModule(),
    confirmed: readConfirmations(),
    lastGap: lastGapInMyDay(),
  };
}

/** Open the system screen that fixes a check. */
export async function openHealthFix(fix: HealthFix): Promise<void> {
  switch (fix) {
    case 'notification-settings':
      return notifee.openNotificationSettings();
    case 'alarm-permission':
      return notifee.openAlarmPermissionSettings();
    case 'battery-optimization':
      return notifee.openBatteryOptimizationSettings();
    case 'power-manager':
      return notifee.openPowerManagerSettings();
  }
}

// ── Manual confirmations ─────────────────────────────────────────────

const CONFIRM_IDS: ConfirmId[] = ['autostart', 'lockedInRecents', 'onCharger'];
const confirmKey = (id: ConfirmId) => KEYS.setting(`stayAlive.${id}`);

export function readConfirmations(): Record<ConfirmId, boolean> {
  const out = {} as Record<ConfirmId, boolean>;
  for (const id of CONFIRM_IDS) {
    out[id] = store.getBoolean(confirmKey(id)) === true;
  }
  return out;
}

export function setConfirmed(id: ConfirmId, confirmed: boolean): void {
  store.set(confirmKey(id), confirmed);
}
