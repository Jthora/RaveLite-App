/**
 * Alive bridge — feeds app signals into the alive clock (`lib/aliveClock`):
 *
 *  - the operator's intensity (Whisper / Glow / Still), persisted
 *  - Android "Remove animations"
 *  - night mode and manual pause → forced stillness
 *  - a pulse firing → a soft wash in its element's color
 *  - a pulse active → 0.4 Hz breathing; otherwise the slow idle breath
 *  - the app leaving the foreground → breathing stops
 */
import {AccessibilityInfo, AppState} from 'react-native';

import {
  ACTIVE_BPM,
  IDLE_BPM,
  setForeground,
  setIntensity,
  setNight,
  setPaused,
  setReduceMotion,
  setTempo,
  washWith,
} from '../../lib/aliveClock';
import type {AliveIntensity} from '../../lib/aliveMath';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {ELEMENTS} from '../../theme/elements';
import {readPauseUntil} from './activeHours';
import {
  getActivePulseSummary,
  onPulseFired,
  subscribe as subscribeRuntime,
} from './pulseRuntime';
import {getScreenMode, subscribeScreenMode} from './screenPolicy';

const INTENSITY_KEY = KEYS.setting('alive.intensity');
const PAUSE_CHECK_MS = 30_000;

export function getAliveIntensity(): AliveIntensity {
  const raw = store.getString(INTENSITY_KEY);
  return raw === 'glow' || raw === 'still' ? raw : 'whisper';
}

export function setAliveIntensity(next: AliveIntensity): void {
  store.set(INTENSITY_KEY, next);
  setIntensity(next);
}

/** Re-read the manual pause now (e.g. right after the operator pauses). */
export function refreshAlivePause(now: number = Date.now()): void {
  const until = readPauseUntil();
  setPaused(until !== undefined && until > now);
}

let started = false;

/** Idempotent; call once after hydration. */
export function startAliveBridge(): void {
  if (started) {
    return;
  }
  started = true;

  setIntensity(getAliveIntensity());

  // Not every environment returns a promise here (e.g. test stubs), so
  // normalize before relying on it.
  Promise.resolve(AccessibilityInfo.isReduceMotionEnabled())
    .then(enabled => setReduceMotion(enabled === true))
    .catch(() => {});
  AccessibilityInfo.addEventListener('reduceMotionChanged', enabled =>
    setReduceMotion(enabled === true),
  );

  setNight(getScreenMode() === 'night');
  subscribeScreenMode(next => setNight(next === 'night'));

  refreshAlivePause();
  setInterval(() => refreshAlivePause(), PAUSE_CHECK_MS);

  subscribeRuntime(() =>
    setTempo(getActivePulseSummary() ? ACTIVE_BPM : IDLE_BPM),
  );
  onPulseFired(event => washWith(ELEMENTS[event.element].color, 'cue'));

  AppState.addEventListener('change', state => {
    setForeground(state === 'active');
    if (state === 'active') {
      refreshAlivePause();
    }
  });
}
