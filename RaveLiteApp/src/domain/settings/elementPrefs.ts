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
import {baseFacts} from '../profile/repository';

export interface ElementPrefs {
  /** Focus areas for this element. Empty = no filter. */
  focusTargets: Target[];
  /** Whether `focusTargets` was chosen by the operator or is the default. */
  focusLocked: boolean;
}

/**
 * First-run defaults. Air starts on the posture corrections this person
 * marked that Air works on, plus breath work — and unfiltered for anyone
 * who marked none. It used to start on the author's own corrections for
 * everybody. The other elements start unfiltered.
 */
function defaultPrefs(element: ElementId): ElementPrefs {
  const own =
    element === 'air'
      ? baseFacts().corrections.filter(c => c === 'UCS' || c === 'Hourglass')
      : [];
  return {
    focusTargets: own.length > 0 ? [...own, 'Breath'] : [],
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
