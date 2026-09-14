/**
 * Per-element preferences: the focus areas that filter an element's Drills
 * tab and steer its "try this now" pick.
 *
 * One JSON blob per element in the settings store. Blobs saved by earlier
 * versions may still carry retired fields (daily target, haptic level,
 * operating mode); reads ignore them.
 */

import type {ElementId} from '../../theme/elements';
import type {Target} from '../exercises/types';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';

export interface ElementPrefs {
  /** Focus areas for this element. Empty = no filter. */
  focusTargets: Target[];
  /** Whether `focusTargets` was chosen by the operator or is the default. */
  focusLocked: boolean;
}

/** First-run defaults. Air starts on the posture corrections plus breath
 *  work; the other elements start unfiltered. */
function defaultPrefs(element: ElementId): ElementPrefs {
  const airDefaults: Target[] = ['UCS', 'Hourglass', 'Breath'];
  return {
    focusTargets: element === 'air' ? airDefaults : [],
    focusLocked: false,
  };
}

const prefsKey = (element: ElementId) =>
  KEYS.setting(`element.prefs.${element}`);

export function getElementPrefs(element: ElementId): ElementPrefs {
  const defaults = defaultPrefs(element);
  const raw = store.getString(prefsKey(element));
  if (!raw) {
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ElementPrefs>;
    return {
      focusTargets: parsed.focusTargets ?? defaults.focusTargets,
      focusLocked: parsed.focusLocked ?? defaults.focusLocked,
    };
  } catch {
    return defaults;
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
