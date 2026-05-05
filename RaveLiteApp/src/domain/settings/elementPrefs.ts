/**
 * Per-element operator preferences.
 *
 * Two distinct concepts coexist in the Tune panel:
 *
 *   1. **Explicit prefs** (this file)
 *      - User declared. Stored as JSON keyed per element.
 *      - haptic intensity, target focus filter, daily target, signal preset.
 *      - Snapshot in time.
 *
 *   2. **Implicit prefs** (derived in `domain/exercises/scoring.ts`)
 *      - Auto-derived from the journal's last N days.
 *      - "What targets has the operator actually been doing?"
 *      - Read-only by default; can be promoted into explicit prefs via
 *        TunePanel's "Lock these in" action.
 *
 * Settings KV is the storage substrate. One JSON blob per element keeps
 * the read/write atomic.
 */

import type {ElementId} from '../../theme/elements';
import type {Target} from '../exercises/types';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';

/** Three operating modes — taps into the cyberpunk-raver dial language.
 *  Snaps haptic + signal preferences as a unit. */
export type SignalPreset = 'stealth' | 'standard' | 'beacon';

/** Haptic intensity for pulse + seal feedback. */
export type HapticIntensity = 'off' | 'low' | 'high';

export interface ElementPrefs {
  /** Operator-active "focus areas" for this element. Empty = no filter. */
  focusTargets: Target[];
  /** Daily completion target — anchors sparkline scale. */
  dailyTarget: number;
  /** Per-element haptic intensity. */
  haptic: HapticIntensity;
  /** Operating mode — drives haptic + notification banner behavior. */
  preset: SignalPreset;
  /** Whether `focusTargets` was set manually (true) or is using defaults. */
  focusLocked: boolean;
}

/** First-run defaults. The operator's three active corrections are
 *  pre-selected for Air/Earth (posture-relevant), but Fire/Water/Heart
 *  start with empty filter — those elements are less correction-driven. */
function defaultPrefs(element: ElementId): ElementPrefs {
  const correctionDefaults: Target[] = ['UCS', 'Hourglass', 'APT'];
  return {
    focusTargets:
      element === 'air' || element === 'earth' ? correctionDefaults : [],
    dailyTarget: element === 'heart' ? 2 : 3,
    haptic: 'high',
    preset: 'standard',
    focusLocked: false,
  };
}

const prefsKey = (element: ElementId) =>
  KEYS.setting(`element.prefs.${element}`);

export function getElementPrefs(element: ElementId): ElementPrefs {
  const raw = store.getString(prefsKey(element));
  if (!raw) {return defaultPrefs(element);}
  try {
    const parsed = JSON.parse(raw) as Partial<ElementPrefs>;
    // Spread over defaults so any new field added later auto-fills.
    return {...defaultPrefs(element), ...parsed};
  } catch {
    return defaultPrefs(element);
  }
}

export function setElementPrefs(
  element: ElementId,
  patch: Partial<ElementPrefs>,
): ElementPrefs {
  const next = {...getElementPrefs(element), ...patch};
  store.set(prefsKey(element), JSON.stringify(next));
  return next;
}

export function resetElementPrefs(element: ElementId): ElementPrefs {
  const next = defaultPrefs(element);
  store.set(prefsKey(element), JSON.stringify(next));
  return next;
}

/** Snap haptic + (future) banner behavior to a named preset. */
export function applyPreset(
  element: ElementId,
  preset: SignalPreset,
): ElementPrefs {
  const haptic: HapticIntensity =
    preset === 'stealth' ? 'low' : preset === 'beacon' ? 'high' : 'high';
  return setElementPrefs(element, {preset, haptic});
}
