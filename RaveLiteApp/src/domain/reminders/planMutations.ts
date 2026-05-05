/**
 * Pure mutations on a Plan.
 *
 * Every mutation returns a NEW Plan (immutable update style) so the
 * UI's draft/committed comparison can be a single referential check
 * after structural equality. No I/O — persistence stays in
 * `repository.ts`, the scheduler stays in `notifeeScheduler.ts`.
 *
 * IDs are generated with a small monotonic helper rather than uuid to
 * avoid pulling another dep; collisions across cold-launches are fine
 * because IDs are scoped to a single plan and the timestamp prefix
 * makes accidental reuse vanishingly unlikely.
 */
import type {CadenceSlot, Plan, Window} from './types';
import type {ElementId} from '../../theme/elements';

let _seq = 0;
function nextId(prefix: string): string {
  _seq = (_seq + 1) % 100_000;
  return `${prefix}-${Date.now().toString(36)}-${_seq.toString(36)}`;
}

export function newWindowId(): string {
  return nextId('w');
}

// ─── Window-level mutations ─────────────────────────────────────────────

export function addWindow(plan: Plan, window: Window): Plan {
  return {...plan, windows: [...plan.windows, window]};
}

export function updateWindow(
  plan: Plan,
  id: string,
  patch: Partial<Window>,
): Plan {
  return {
    ...plan,
    windows: plan.windows.map(w => (w.id === id ? {...w, ...patch} : w)),
  };
}

export function removeWindow(plan: Plan, id: string): Plan {
  return {...plan, windows: plan.windows.filter(w => w.id !== id)};
}

export function findWindow(plan: Plan, id: string): Window | undefined {
  return plan.windows.find(w => w.id === id);
}

// ─── Slot-level mutations (slots are positional within a window) ────────

export function addSlot(
  plan: Plan,
  windowId: string,
  slot: CadenceSlot,
): Plan {
  return updateWindow(plan, windowId, {
    slots: [
      ...(findWindow(plan, windowId)?.slots ?? []),
      slot,
    ],
  });
}

export function updateSlot(
  plan: Plan,
  windowId: string,
  index: number,
  patch: Partial<CadenceSlot>,
): Plan {
  const w = findWindow(plan, windowId);
  if (!w) {return plan;}
  if (index < 0 || index >= w.slots.length) {return plan;}
  const nextSlots = w.slots.map((s, i) => (i === index ? {...s, ...patch} : s));
  return updateWindow(plan, windowId, {slots: nextSlots});
}

export function removeSlot(
  plan: Plan,
  windowId: string,
  index: number,
): Plan {
  const w = findWindow(plan, windowId);
  if (!w) {return plan;}
  return updateWindow(plan, windowId, {
    slots: w.slots.filter((_, i) => i !== index),
  });
}

// ─── Derived helpers (used by overview / dirty-check) ───────────────────

/** Total slots across all windows. Used in the "11 slots/day" subtitle. */
export function totalSlotCount(plan: Plan): number {
  return plan.windows.reduce((sum, w) => sum + w.slots.length, 0);
}

/** Stable structural equality. Order-sensitive so a re-ordered slot list
 *  registers as dirty. Cheap enough to call on every render. */
export function plansEqual(a: Plan, b: Plan): boolean {
  if (a === b) {return true;}
  return JSON.stringify(a) === JSON.stringify(b);
}

// ─── Constructors ───────────────────────────────────────────────────────

export function makeWindow(opts?: Partial<Window>): Window {
  return {
    id: newWindowId(),
    label: 'New Window',
    startTime: '09:00',
    endTime: '17:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    slots: [],
    ...opts,
  };
}

export function makeSlot(element: ElementId, everyMinutes = 60): CadenceSlot {
  return {element, everyMinutes};
}
