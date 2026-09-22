import {ELEMENTS, ElementId} from '../../theme/elements';
import {EXERCISE_LIBRARY, isCurriculum} from '../exercises/library';
import {canDo} from '../profile/kit';
import {loadFacts} from '../profile/repository';
import {Exercise} from '../exercises/types';
import {CadenceSlot, Plan, ReminderPayload} from './types';

/**
 * Element-themed vibration patterns.
 *
 * Format: `[waitMs, vibrateMs, waitMs, vibrateMs, …]`
 *   - Even length (pairs).
 *   - **All values must be positive** (no leading 0). Notifee's
 *     `channel.vibrationPattern` rejects zeros and odd lengths; RN's
 *     `Vibration.vibrate(pattern)` happily accepts the same shape.
 *
 * The body learns the element by feel before reading the screen.
 */
export const VIBRATION_PATTERNS: Record<ElementId, number[]> = {
  fire: [50, 80, 60, 80, 60, 80], // 3 staccato stabs
  air: [50, 40], // single light tap
  earth: [50, 300], // one slow grounded thud
  water: [50, 110, 60, 110], // rolling double
  heart: [50, 90, 60, 90, 100, 90], // triple heartbeat
};

/** Pick a drill from the library that fits a slot's constraints. */
export function pickDrillForSlot(slot: CadenceSlot): Exercise | undefined {
  const candidates = candidatesForSlot(slot);
  if (candidates.length === 0) {
    return undefined;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Deterministic variant: same slot + same `seed` string → same drill.
 * Used wherever we render or enqueue a future fire: ribbon previews and
 * planScheduler's enqueue both call this with seed
 * `${windowId}:${slotIndex}:${ts}` so the upcoming roster stays stable
 * across re-renders and matches what the scheduler actually queued.
 */
export function pickDrillForSlotSeeded(
  slot: CadenceSlot,
  seed: string,
): Exercise | undefined {
  return seededPick(candidatesForSlot(slot), seed);
}

/** Same `seed`, same item: a stable pick without randomness. */
export function seededPick<T>(
  items: readonly T[],
  seed: string,
): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  // FNV-1a 32-bit — cheap, stable, non-cryptographic.
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return items[(h >>> 0) % items.length];
}

function candidatesForSlot(slot: CadenceSlot): Exercise[] {
  if (slot.exerciseId) {
    const drill = EXERCISE_LIBRARY.find(ex => ex.id === slot.exerciseId);
    return drill ? [drill] : [];
  }
  const facts = loadFacts();
  return EXERCISE_LIBRARY.filter(ex => {
    if (ex.element !== slot.element) {
      return false;
    }
    // Nothing this room, this kit or this noise limit rules out.
    if (!canDo(ex, facts)) {
      return false;
    }
    // A test belongs to its Saturday, never a random pick; a curriculum
    // move belongs to Practice.
    if (ex.targets.includes('Test') || isCurriculum(ex)) {
      return false;
    }
    if (slot.maxSeconds && ex.approxSeconds > slot.maxSeconds) {
      return false;
    }
    if (slot.requiredTags && slot.requiredTags.length > 0) {
      const hasAll = slot.requiredTags.every(t => ex.targets.includes(t));
      if (!hasAll) {
        return false;
      }
    }
    return true;
  });
}

/** Convert a chosen exercise into a notification payload. */
export function buildPayload(exercise: Exercise): ReminderPayload {
  const el = ELEMENTS[exercise.element];
  return {
    exerciseId: exercise.id,
    element: exercise.element,
    title: `${el.glyph}  ${el.name} · ${exercise.name}`,
    body: `${exercise.dose} — ${exercise.purpose}`,
    color: el.color,
    vibration: VIBRATION_PATTERNS[exercise.element],
  };
}

/**
 * Native scheduler interface. The implementation will live in a separate
 * module that depends on @notifee/react-native. Keeping the interface here
 * means UI code can import and call against it without knowing about native
 * deps yet.
 *
 * NEXT STEP (separate turn — requires native install):
 *   1. yarn add @notifee/react-native
 *   2. cd ios && pod install
 *   3. Implement NotifeeScheduler conforming to this interface
 *   4. Heart screen imports and starts the scheduler with DEFAULT_PLAN
 */
export interface ReminderScheduler {
  /** Replace all currently-scheduled notifications with this plan's set. */
  applyPlan(plan: Plan): Promise<void>;
  /** Cancel everything. */
  clear(): Promise<void>;
  /** Quick test fire — used by the Heart screen "Send test" button. */
  fireNow(payload: ReminderPayload): Promise<void>;
}

/**
 * Stub implementation. Logs to console only — no native side effects.
 * Lets the UI compile and the operator see the data flow before the native
 * module is installed.
 */
export const stubScheduler: ReminderScheduler = {
  async applyPlan(plan) {
    console.log('[stubScheduler] applyPlan', plan.name, plan.windows.length);
  },
  async clear() {
    console.log('[stubScheduler] clear');
  },
  async fireNow(payload) {
    console.log('[stubScheduler] fireNow', payload.title, payload.body);
  },
};
