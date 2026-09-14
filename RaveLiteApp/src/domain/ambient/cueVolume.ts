import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {ELEMENT_ORDER, type ElementId} from '../../theme/elements';
import {INTERRUPTION_FILTER_ALL} from '../../native/raveLiteDevice';

/**
 * Cue volume + routing.
 *
 * Volumes are 0–100 per device: a master level multiplied by a
 * per-element level (docs: always-on-strategy "multiplicative on
 * master"). Stored in the long-reserved `KEYS.ambientToneVolume*` keys.
 *
 * Routing decides how a chime makes sound:
 *   - 'alarm'   — play the cue in-app on the alarm stream (cuts through
 *                 silent / DND), then post the notification on the quiet
 *                 channel. If playback fails, post on the sounding channel.
 *   - 'channel' — "Respect Do Not Disturb" is on and DND is active: post on
 *                 the sounding channel and let the OS decide (it mutes).
 *   - 'silent'  — the cue is set to Off: quiet channel, vibration only.
 */

/** 75 so the default lands on one of the panel's volume pills. */
export const DEFAULT_MASTER_VOLUME = 75;
export const DEFAULT_ELEMENT_VOLUME = 100;
export const VOLUME_STEPS = [0, 25, 50, 75, 100] as const;

const RESPECT_DND_KEY = KEYS.setting('chimes.respectDnd');

function clampPercent(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
}

/** Effective 0–1 cue volume from master and element levels (each 0–100). */
export function effectiveCueVolume(master: number, element: number): number {
  return (clampPercent(master) / 100) * (clampPercent(element) / 100);
}

export type CueRoute = 'alarm' | 'channel' | 'silent';

export function chooseCueRoute(input: {
  volume: number;
  respectDnd: boolean;
  /** Current interruption filter, or null when unknown. */
  interruptionFilter: number | null;
}): CueRoute {
  if (input.volume <= 0) {
    return 'silent';
  }
  if (
    input.respectDnd &&
    input.interruptionFilter !== null &&
    input.interruptionFilter !== INTERRUPTION_FILTER_ALL
  ) {
    return 'channel';
  }
  return 'alarm';
}

// ── Storage accessors ────────────────────────────────────────────────

function readPercent(key: string, fallback: number): number {
  const v = store.getNumber(key);
  return typeof v === 'number' ? clampPercent(v) : fallback;
}

export function getMasterVolume(): number {
  return readPercent(KEYS.ambientToneVolumeMaster, DEFAULT_MASTER_VOLUME);
}

export function setMasterVolume(percent: number): void {
  store.set(KEYS.ambientToneVolumeMaster, clampPercent(percent));
}

export function getElementVolume(element: ElementId): number {
  return readPercent(
    KEYS.ambientToneVolumeForElement(element),
    DEFAULT_ELEMENT_VOLUME,
  );
}

export function setElementVolume(element: ElementId, percent: number): void {
  store.set(KEYS.ambientToneVolumeForElement(element), clampPercent(percent));
}

export function getRespectDnd(): boolean {
  return store.getBoolean(RESPECT_DND_KEY) === true;
}

export function setRespectDnd(on: boolean): void {
  store.set(RESPECT_DND_KEY, on);
}

/** Everything a chime needs to decide how to sound, for one element. */
export function cueSettingsFor(element: ElementId): {
  volume: number;
  respectDnd: boolean;
} {
  return {
    volume: effectiveCueVolume(getMasterVolume(), getElementVolume(element)),
    respectDnd: getRespectDnd(),
  };
}

/** All element levels, in rail order — for the Chimes panel. */
export function elementVolumes(): Array<{element: ElementId; percent: number}> {
  return ELEMENT_ORDER.map(element => ({
    element,
    percent: getElementVolume(element),
  }));
}
