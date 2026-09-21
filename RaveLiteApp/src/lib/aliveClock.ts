/**
 * Alive clock — the one shared motion source for the app's "alive" layer.
 *
 * Everything that breathes, reacts to touch, or washes on a chime reads
 * these native-driver Animated values, so the whole UI moves in phase and
 * no JS runs per frame:
 *
 *   phase   linear 0 → 1 loop, one breath per cycle (IDLE_BPM, or
 *           ACTIVE_BPM = 0.4 Hz while a pulse is active — FR-6.5)
 *   energy  touch energy; bumps on a tap, drains linearly
 *   kick    short decaying kick for beats (the future beat recognizer)
 *   wash    0 → 1 → 0 one-shot for a chime or entering an element
 *
 * The motion mode resolves from the operator's intensity, Android
 * "Remove animations", night mode and manual pause (see aliveMath). App
 * signals are fed in by `domain/ambient/aliveBridge`; this module knows
 * nothing about the app.
 *
 * Native-loop caveat: when the last view using `phase` unmounts, Animated
 * detaches the value and silently stops its animation. Consumers retain /
 * release the loop so a remount restarts it.
 */
import {Animated, Easing} from 'react-native';

import {
  bumpEnergy,
  decayEnergy,
  intensityBudget,
  resolveMotionMode,
  type AliveIntensity,
  type MotionBudget,
  type MotionMode,
} from './aliveMath';

export const IDLE_BPM = 10;
export const ACTIVE_BPM = 24;
const ENERGY_DECAY_MS = 1500;
const TOUCH_THROTTLE_MS = 120;
const RELEASE_GRACE_MS = 250;
const KICK_MS = 220;
const MIN_BPM = 4;
const MAX_BPM = 200;

const phase = new Animated.Value(0);
const energy = new Animated.Value(0);
const kick = new Animated.Value(0);
const wash = new Animated.Value(0);

export const aliveValues = {phase, energy, kick, wash} as const;

// ── Mode ─────────────────────────────────────────────────────────────

let intensity: AliveIntensity = 'whisper';
let reduceMotion = false;
let night = false;
let paused = false;
let mode: MotionMode = 'whisper';
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Fires when the mode or wash color changes. Returns an unsubscribe fn. */
export function subscribeAlive(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMotionMode(): MotionMode {
  return mode;
}

export function getMotionBudget(): MotionBudget {
  return intensityBudget(mode);
}

export function getIntensity(): AliveIntensity {
  return intensity;
}

function recompute(): void {
  const next = resolveMotionMode({
    reduceMotion,
    night,
    paused,
    setting: intensity,
  });
  if (next === mode) {
    return;
  }
  mode = next;
  syncLoop();
  if (intensityBudget(mode).energyMax === 0) {
    energyLevel = 0;
    energy.setValue(0);
  }
  notify();
}

export function setIntensity(next: AliveIntensity): void {
  intensity = next;
  recompute();
}

export function setReduceMotion(on: boolean): void {
  reduceMotion = on;
  recompute();
}

export function setNight(on: boolean): void {
  night = on;
  recompute();
}

export function setPaused(on: boolean): void {
  paused = on;
  recompute();
}

// ── Breathing loop ───────────────────────────────────────────────────

let bpm = IDLE_BPM;
let loop: Animated.CompositeAnimation | null = null;
let consumers = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
let foreground = true;
let loopStarts = 0;

function breathing(): boolean {
  return foreground && consumers > 0 && intensityBudget(mode).breathMax > 0;
}

function breathTiming(durationMs: number): Animated.CompositeAnimation {
  return Animated.timing(phase, {
    toValue: 1,
    duration: durationMs,
    easing: Easing.linear,
    useNativeDriver: true,
  });
}

function runCycle(): void {
  const cycle = Animated.loop(breathTiming(60_000 / bpm));
  loop = cycle;
  loopStarts++;
  cycle.start();
}

/** Start breathing; `fromPhase` finishes the current breath first (tempo change). */
function startLoop(fromPhase?: number): void {
  if (loop || !breathing()) {
    return;
  }
  if (fromPhase === undefined || fromPhase <= 0 || fromPhase >= 1) {
    phase.setValue(0);
    runCycle();
    return;
  }
  const finish = breathTiming((1 - fromPhase) * (60_000 / bpm));
  loop = finish;
  finish.start(({finished}) => {
    if (loop !== finish) {
      return; // stopped or replaced meanwhile
    }
    loop = null;
    if (finished && breathing()) {
      phase.setValue(0);
      runCycle();
    }
  });
}

function stopLoop(): void {
  const current = loop;
  loop = null;
  current?.stop();
}

function syncLoop(): void {
  if (breathing()) {
    startLoop();
  } else {
    stopLoop();
  }
}

/** A component that renders `phase` mounted. */
export function retainBreath(): void {
  consumers++;
  if (releaseTimer !== null) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (consumers === 1) {
    // The previous consumer's unmount may have detached `phase`, which
    // stops a native loop without telling us. Restart cleanly.
    stopLoop();
  }
  syncLoop();
}

/** A component that renders `phase` unmounted. */
export function releaseBreath(): void {
  consumers = Math.max(0, consumers - 1);
  if (consumers > 0 || releaseTimer !== null) {
    return;
  }
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    if (consumers === 0) {
      stopLoop();
    }
  }, RELEASE_GRACE_MS);
}

/** Change breathing tempo without a visible jump: finish the current breath at the new tempo. */
export function setTempo(nextBpm: number): void {
  const clamped = Math.max(MIN_BPM, Math.min(MAX_BPM, nextBpm));
  if (clamped === bpm) {
    return;
  }
  bpm = clamped;
  if (!loop) {
    return;
  }
  stopLoop();
  phase.stopAnimation(value => {
    if (loop === null) {
      startLoop(value);
    }
  });
}

/** App foreground state. Nothing breathes in the background. */
export function setForeground(on: boolean): void {
  foreground = on;
  syncLoop();
}

// ── Touch energy + beat kick ─────────────────────────────────────────

let energyLevel = 0;
let energyAt = 0;
let lastTouchAt = -Infinity;

/** A touch anywhere in the app: a small swell that drains over ~1.5 s. */
export function touch(now: number = Date.now()): void {
  if (intensityBudget(mode).energyMax <= 0) {
    return;
  }
  if (now - lastTouchAt < TOUCH_THROTTLE_MS) {
    return;
  }
  lastTouchAt = now;
  energyLevel = bumpEnergy(
    decayEnergy(energyLevel, now - energyAt, ENERGY_DECAY_MS),
  );
  energyAt = now;
  energy.setValue(energyLevel);
  Animated.timing(energy, {
    toValue: 0,
    duration: energyLevel * ENERGY_DECAY_MS,
    easing: Easing.linear,
    useNativeDriver: true,
  }).start();
}

/** A beat onset (0–1). Fed by the beat recognizer through `aliveDriver`. */
export function beat(strength = 1): void {
  if (intensityBudget(mode).energyMax <= 0) {
    return;
  }
  kick.setValue(Math.max(0, Math.min(1, strength)));
  Animated.timing(kick, {
    toValue: 0,
    duration: KICK_MS,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start();
}

// ── Wash ─────────────────────────────────────────────────────────────

export type WashKind = 'cue' | 'enter';

let washColor = '#000000';
let washPeak = 0;

export function getWash(): {color: string; peak: number} {
  return {color: washColor, peak: washPeak};
}

/** Flash a soft full-screen wash in `color`: a chime firing, or entering an element. */
export function washWith(color: string, kind: WashKind): void {
  const budget = intensityBudget(mode);
  const peak = kind === 'cue' ? budget.cuePeak : budget.enterPeak;
  if (peak <= 0) {
    return;
  }
  if (color !== washColor || peak !== washPeak) {
    washColor = color;
    washPeak = peak;
    notify();
  }
  wash.stopAnimation();
  wash.setValue(0);
  Animated.sequence([
    Animated.timing(wash, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(wash, {
      toValue: 0,
      duration: kind === 'cue' ? 900 : 480,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start();
}

// ── Beat recognizer seam ─────────────────────────────────────────────

export interface AliveDriver {
  /** A detected onset, 0–1. */
  onBeat(strength: number): void;
  /** Detected tempo, beats per minute. */
  onTempo(bpm: number): void;
}

/**
 * Plug-in point for the separately built beat recognizer: feed onsets and
 * tempo, and the aura kicks on the beat and breathes at the music's pace.
 * Event-driven only — never call these per frame.
 */
export const aliveDriver: AliveDriver = {
  onBeat: beat,
  onTempo: setTempo,
};

/** Test-only inspection and reset. */
export const __test = {
  reset: () => {
    stopLoop();
    if (releaseTimer !== null) {
      clearTimeout(releaseTimer);
    }
    releaseTimer = null;
    consumers = 0;
    foreground = true;
    bpm = IDLE_BPM;
    intensity = 'whisper';
    reduceMotion = false;
    night = false;
    paused = false;
    mode = 'whisper';
    energyLevel = 0;
    energyAt = 0;
    lastTouchAt = -Infinity;
    loopStarts = 0;
    washColor = '#000000';
    washPeak = 0;
    listeners.clear();
  },
  isLooping: () => loop !== null,
  loopStarts: () => loopStarts,
  energyLevel: () => energyLevel,
  bpm: () => bpm,
};
