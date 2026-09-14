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

interface RaveLiteDeviceNative {
  playCue(element: string, volume: number): Promise<boolean>;
  getAlarmVolume(): Promise<{current: number; max: number}>;
  getInterruptionFilter(): Promise<number>;
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
