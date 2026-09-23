import {NativeModules, Platform} from 'react-native';

import type {ElementId} from '../theme/elements';

/**
 * JS face of the native `RaveLiteDevice` module (see
 * `android/app/src/main/java/com/raveliteapp/device/`).
 *
 * Every call degrades to a safe no-op when the module is missing (Jest,
 * iOS, or a JS bundle running on an APK built before the module existed):
 * `playCue` resolves false so callers fall back to notification-channel
 * sound, and the readers resolve null ("unknown").
 */

export interface CoarseLocation {
  latitude: number;
  longitude: number;
  /** The town, when Android's geocoder knows it. */
  place?: string;
}

interface RaveLiteDeviceNative {
  playCue(element: string, volume: number): Promise<boolean>;
  getAlarmVolume(): Promise<{current: number; max: number}>;
  getInterruptionFilter(): Promise<number>;
  /** Missing on APKs built before chimes could follow silent mode. */
  getRingerMode?(): Promise<number>;
  setWindowBrightness(level: number): Promise<boolean>;
  /** Missing on APKs built before location support. */
  getCoarseLocation?(): Promise<CoarseLocation | null>;
  /** Missing on APKs built before the location switch check. */
  isLocationEnabled?(): Promise<boolean>;
  /** Missing on APKs built before export/restore. */
  saveExport?(filename: string, text: string): Promise<string | null>;
  readExport?(): Promise<string | null>;
  restartApp?(): Promise<boolean>;
  /** Missing on APKs built before sharing. */
  shareExport?(filename: string, text: string): Promise<boolean>;
  /** Missing on APKs built before units. */
  getLocale?(): Promise<{language: string; country: string}>;
  /** Missing on APKs built before the device line in the report. */
  getDeviceInfo?(): Promise<DeviceInfo>;
  /** Missing on APKs built before the status report could be copied. */
  copyText?(text: string): Promise<boolean>;
}

const native: RaveLiteDeviceNative | undefined =
  Platform.OS === 'android' ? NativeModules.RaveLiteDevice : undefined;

/** Android `INTERRUPTION_FILTER_ALL` — Do Not Disturb is off. */
export const INTERRUPTION_FILTER_ALL = 1;

/** Android `RINGER_MODE_NORMAL` — the phone is not on silent or vibrate. */
export const RINGER_MODE_NORMAL = 2;

export function hasDeviceModule(): boolean {
  return native != null;
}

/** Play an element cue on the alarm stream. Resolves true only if it played. */
export async function playCue(
  element: ElementId,
  volume01: number,
): Promise<boolean> {
  if (!native) {
    return false;
  }
  try {
    return await native.playCue(element, volume01);
  } catch {
    return false;
  }
}

export async function getAlarmVolume(): Promise<{
  current: number;
  max: number;
} | null> {
  if (!native) {
    return null;
  }
  try {
    return await native.getAlarmVolume();
  } catch {
    return null;
  }
}

/**
 * Override the window backlight (0–1), or pass a negative value to hand
 * brightness back to the system. Resolves true only if it was applied.
 */
export async function setWindowBrightness(level: number): Promise<boolean> {
  if (!native) {
    return false;
  }
  try {
    return await native.setWindowBrightness(level);
  } catch {
    return false;
  }
}

export async function getInterruptionFilter(): Promise<number | null> {
  if (!native) {
    return null;
  }
  try {
    return await native.getInterruptionFilter();
  } catch {
    return null;
  }
}

/** The ringer mode (0 silent, 1 vibrate, 2 normal), or null when unknown. */
export async function getRingerMode(): Promise<number | null> {
  if (!native?.getRingerMode) {
    return null;
  }
  try {
    return await native.getRingerMode();
  } catch {
    return null;
  }
}

/**
 * The phone's rough location, once (the permission must already be
 * granted). Null when location is off, unavailable or not permitted.
 */
/**
 * Whether the phone's location switch is on. True when the build cannot
 * tell, so a missing answer never becomes wrong advice.
 */
export async function isLocationEnabled(): Promise<boolean> {
  if (!native?.isLocationEnabled) {
    return true;
  }
  try {
    return await native.isLocationEnabled();
  } catch {
    return true;
  }
}

export type PickerResult =
  | {ok: true; value: string}
  | {ok: false; why: 'cancelled' | 'unsupported' | string};

/**
 * Write `text` out through the system file picker. Resolves the name it
 * was saved as. A dismissed picker is `cancelled`, not an error — the
 * caller says nothing rather than showing a failure the user caused.
 */
export async function saveExport(
  filename: string,
  text: string,
): Promise<PickerResult> {
  if (!native?.saveExport) {
    return {ok: false, why: 'unsupported'};
  }
  try {
    const saved = await native.saveExport(filename, text);
    return saved ? {ok: true, value: saved} : {ok: false, why: 'cancelled'};
  } catch (e) {
    return {ok: false, why: (e as Error)?.message ?? 'unsupported'};
  }
}

/**
 * Offer an export to another app through the system share sheet. Returns
 * false when the build cannot do it, so the caller can say so in words
 * rather than appearing to do nothing.
 */
export async function shareExport(
  filename: string,
  text: string,
): Promise<boolean> {
  if (!native?.shareExport) {
    return false;
  }
  try {
    return await native.shareExport(filename, text);
  } catch {
    return false;
  }
}

/** Read a chosen file back as text, through the same picker. */
export async function readExport(): Promise<PickerResult> {
  if (!native?.readExport) {
    return {ok: false, why: 'unsupported'};
  }
  try {
    const text = await native.readExport();
    return text != null
      ? {ok: true, value: text}
      : {ok: false, why: 'cancelled'};
  } catch (e) {
    return {ok: false, why: (e as Error)?.message ?? 'unsupported'};
  }
}

/**
 * Start the app over. Used after a restore, where every screen and cache
 * in the running app was built from data that no longer exists. Resolves
 * false when the build can't do it, so the caller can ask in words.
 */
export async function restartApp(): Promise<boolean> {
  if (!native?.restartApp) {
    return false;
  }
  try {
    return await native.restartApp();
  } catch {
    return false;
  }
}

/**
 * The phone's language and country, or null when the build cannot say.
 * Used once, to guess units rather than ask about them.
 */
export async function getLocale(): Promise<{
  language: string;
  country: string;
} | null> {
  if (!native?.getLocale) {
    return null;
  }
  try {
    return await native.getLocale();
  } catch {
    return null;
  }
}

export interface DeviceInfo {
  manufacturer: string;
  brand: string;
  model: string;
  release: string;
  sdk: number;
  abi: string;
  is64Bit: boolean;
  /** The maker's own skin version, or "" where the maker publishes none. */
  skin: string;
  lowRam: boolean;
  /** UsageStatsManager bucket, or 0 when the OS cannot say. */
  standbyBucket: number;
  backgroundRestricted: boolean;
}

/**
 * What phone this is, for a bug report. Null on a build without the
 * module — React Native knows the make and model on its own, so the
 * report still says something (see `deviceFacts.ts`).
 */
export async function getDeviceInfo(): Promise<DeviceInfo | null> {
  if (!native?.getDeviceInfo) {
    return null;
  }
  try {
    return await native.getDeviceInfo();
  } catch {
    return null;
  }
}

/** Put text on the clipboard. False when the build cannot. */
export async function copyText(text: string): Promise<boolean> {
  if (!native?.copyText) {
    return false;
  }
  try {
    return await native.copyText(text);
  } catch {
    return false;
  }
}

export async function getCoarseLocation(): Promise<CoarseLocation | null> {
  if (!native?.getCoarseLocation) {
    return null;
  }
  try {
    return await native.getCoarseLocation();
  } catch {
    return null;
  }
}
