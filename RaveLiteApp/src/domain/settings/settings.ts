import {store} from '../../storage';
import {KEYS} from '../../storage/keys';

/**
 * Lightweight typed accessor for app-wide settings.
 *
 * Add new settings by adding a key to `SettingDefs` — the helper functions
 * stay generic and type-safe without needing per-setting boilerplate.
 */

interface SettingDefs {
  // First-run flow
  onboardingCompleted: boolean;
  // Battery-optimization-exemption granted (Android, esp. MIUI)
  batteryExemptionGranted: boolean;
  // Notification permission granted at runtime
  notificationsGranted: boolean;
  // Most recent app version that ran — for migrations
  lastAppVersion: string;
  // Operator-chosen leading element for today (Heart's morning intent)
  todaysLeadingElement: string;
}

type Key = keyof SettingDefs;

export function getSetting<K extends Key>(key: K): SettingDefs[K] | undefined {
  const k = KEYS.setting(key as string);
  // We rely on the caller knowing the type; the store is typed by primitive.
  // For booleans we use getBoolean; for strings, getString.
  // Add explicit type-aware paths only as new types are introduced.
  const asBool = store.getBoolean(k);
  if (typeof asBool === 'boolean') {
    return asBool as SettingDefs[K];
  }
  const asStr = store.getString(k);
  if (typeof asStr === 'string') {
    return asStr as SettingDefs[K];
  }
  const asNum = store.getNumber(k);
  if (typeof asNum === 'number') {
    // No SettingDefs value is a number today, so TS can narrow the target
    // to `never` here and refuse the cast. The branch still has to exist:
    // a numeric setting added later must read back, not silently vanish.
    return asNum as unknown as SettingDefs[K];
  }
  return undefined;
}

export function setSetting<K extends Key>(key: K, value: SettingDefs[K]): void {
  store.set(KEYS.setting(key as string), value as string | number | boolean);
}

export function clearSetting<K extends Key>(key: K): void {
  store.delete(KEYS.setting(key as string));
}
