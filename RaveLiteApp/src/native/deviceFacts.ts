/**
 * What phone this is.
 *
 * A beta is spread across phones that behave differently — one maker
 * stops foreground services, another demotes the notification channel, a
 * third never delivers the boot broadcast — so a report that does not
 * name the phone is a guess. None of this identifies a person: the make,
 * the model, the Android version, the maker's own skin, and how tight the
 * device is.
 *
 * React Native knows the first few without asking the native module, so
 * the line is there even on a build that has no module. The rest arrives
 * a moment later, and is worth waiting for: the standby bucket and the
 * background restriction are the two settings that decide whether chimes
 * happen at all.
 */
import {Dimensions, PixelRatio, Platform} from 'react-native';

import {getDeviceInfo, type DeviceInfo} from './raveLiteDevice';

export interface DeviceFacts {
  /** Which build of RaveLite this is: "1.0 (1)". */
  app?: string;
  manufacturer: string;
  model: string;
  /** Android version as people say it: "16". */
  release: string;
  /** API level. */
  sdk: number;
  /** "360 × 825 dp @2.0, text 1.0×" */
  screen: string;
  /** The maker's own skin, where the maker publishes one. */
  skin?: string;
  abi?: string;
  /** The ROM build, shown beside the skin because it names the actual ROM. */
  build?: string;
  lowRam?: boolean;
  /** UsageStatsManager buckets: 10 active … 45 restricted. */
  standbyBucket?: number;
  backgroundRestricted?: boolean;
}

/** What the OS tells any app, with no native module and no permission. */
function fromPlatform(): DeviceFacts {
  const c = Platform.constants as {
    Manufacturer?: string;
    Model?: string;
    Release?: string;
  };
  const {width, height} = Dimensions.get('window');
  const scale = PixelRatio.get();
  const font = PixelRatio.getFontScale();
  return {
    manufacturer: c.Manufacturer ?? 'unknown',
    model: c.Model ?? 'unknown',
    release: c.Release ?? String(Platform.Version),
    sdk: typeof Platform.Version === 'number' ? Platform.Version : 0,
    screen: `${Math.round(width)} × ${Math.round(height)} dp @${scale}${
      font === 1 ? '' : `, text ${font.toFixed(2)}×`
    }`,
  };
}

let facts: DeviceFacts = fromPlatform();
let asked = false;

/** The phone, as far as anything knows right now. Never throws. */
export function deviceFacts(): DeviceFacts {
  return facts;
}

/**
 * Ask the native module for what React Native cannot say. Safe to call
 * more than once; it asks once. Screen and text size are re-read, since
 * both change while the app is open.
 */
export async function loadDeviceFacts(): Promise<DeviceFacts> {
  const base = fromPlatform();
  facts = {...facts, ...base};
  if (asked) {
    return facts;
  }
  asked = true;
  const more: DeviceInfo | null = await getDeviceInfo();
  if (more) {
    facts = {
      ...facts,
      app: more.appVersion
        ? `${more.appVersion} (${more.appBuild ?? '?'})`
        : undefined,
      manufacturer: more.manufacturer || facts.manufacturer,
      model: more.model || facts.model,
      release: more.release || facts.release,
      sdk: more.sdk || facts.sdk,
      skin: more.skin || undefined,
      build: more.build || undefined,
      abi: more.abi,
      lowRam: more.lowRam,
      standbyBucket: more.standbyBucket || undefined,
      backgroundRestricted: more.backgroundRestricted,
    };
  }
  return facts;
}

/** Buckets, in the words the Android docs use. */
const BUCKET: Readonly<Record<number, string>> = {
  5: 'exempted',
  10: 'active',
  20: 'working set',
  30: 'frequent',
  40: 'rare',
  45: 'restricted',
};

/** The phone in one line, for the report and for a bug report. */
export function deviceLine(from: DeviceFacts = facts): string {
  const parts = [
    `${from.manufacturer} ${from.model}`,
    `Android ${from.release} (API ${from.sdk})`,
  ];
  if (from.skin) {
    parts.push(from.build ? `${from.skin} (${from.build})` : from.skin);
  }
  if (from.abi) {
    parts.push(from.abi);
  }
  if (from.lowRam) {
    parts.push('low-RAM device');
  }
  return parts.join(' · ');
}

/**
 * The two settings that decide whether chimes happen, when either is
 * anything other than fine. "Restricted" means no alarms and nothing
 * after a reboot, and neither is visible anywhere else in the app.
 */
export function standbyLine(
  from: DeviceFacts = facts,
): {value: string; concern: boolean} | undefined {
  if (from.backgroundRestricted) {
    return {
      value: 'background restricted — chimes will not fire',
      concern: true,
    };
  }
  const bucket = from.standbyBucket;
  if (bucket === undefined) {
    return undefined;
  }
  const name = BUCKET[bucket] ?? String(bucket);
  return {value: name, concern: bucket >= 40};
}

/** Only for tests. */
export function __resetDeviceFacts(): void {
  facts = fromPlatform();
  asked = false;
}
