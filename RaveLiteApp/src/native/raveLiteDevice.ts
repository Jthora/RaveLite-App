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
  setWindowBrightness(level: number): Promise<boolean>;
  /** Missing on APKs built before location support. */
  getCoarseLocation?(): Promise<CoarseLocation | null>;
}

const native: RaveLiteDeviceNative | undefined =
  Platform.OS === 'android' ? NativeModules.RaveLiteDevice : undefined;

/** Android `INTERRUPTION_FILTER_ALL` — Do Not Disturb is off. */
export const INTERRUPTION_FILTER_ALL = 1;

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

/**
 * The phone's rough location, once (the permission must already be
 * granted). Null when location is off, unavailable or not permitted.
 */
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
