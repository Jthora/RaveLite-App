import {ElementId} from '../../theme/elements';
import {Plan} from './types';

/**
 * One concrete future notification, ready to hand to a native scheduler.
 *
 * This is the *output* of expanding a Plan + a time range. The native
 * scheduler (Notifee) only sees these — it never touches the Plan tree.
 * That separation means we can unit-test the cadence math on Node, with
 * fake clocks, without booting an Android emulator.
 */
export interface FireSpec {
  /** Local-time epoch ms when this should fire. */
  ts: number;
  element: ElementId;
  windowId: string;
  /** 0-based index of the slot inside its window — used as a stable id. */
  slotIndex: number;
  everyMinutes: number;
}

/** Stable pulse id for a plan fire: `plan:${windowId}:${slotIndex}:${ts}`. */
export function planPulseId(
  fire: Pick<FireSpec, 'windowId' | 'slotIndex' | 'ts'>,
): string {
  return `plan:${fire.windowId}:${fire.slotIndex}:${fire.ts}`;
}

/**
 * Expand a Plan into the concrete list of fires falling inside [fromTs, toTs].
 *
 * Conventions:
 *   - Window bounds are [start, end) — start fires, end doesn't.
 *     Example: 09:00–17:00 every 30min ⇒ 09:00, 09:30, …, 16:30 (16 fires).
 *   - daysOfWeek uses JS `Date.getDay()` (0 = Sunday).
 *   - All times are evaluated in the device's local timezone. The trainee
 *     trains in their body's clock, not UTC.
 *   - `exclusive: true` on a window suppresses any non-exclusive slot whose
 *     fire ts lands inside that window's bounds. Use it for deep-focus
 *     blocks (Morning Training, Evening Review) so desk-hours pings don't
 *     interrupt them.
 *   - Output is sorted by ts ascending.
 *
 * Limitations (documented + guarded):
 *   - Windows are not allowed to cross midnight (endTime ≤ startTime). The
 *     function logs and skips such windows. The default plan is compliant;
 *     editor UIs should validate before saving.
 *   - DST: we use `Date.setHours()` which honors the local DST rules of the
 *     calendar day being expanded. A 02:30 fire on a spring-forward Sunday
 *     will simply skip if 02:30 doesn't exist that day (Date normalizes).
 *     Acceptable: trainee won't notice a missed micro-prompt across a
 *     once-a-year DST transition.
 */
export function expandPlanToFires(
  plan: Plan,
  fromTs: number,
  toTs: number,
): FireSpec[] {
  if (toTs <= fromTs) {
    return [];
  }
  const fires: FireSpec[] = [];

  // Walk every calendar day touched by [fromTs, toTs].
  const cursor = new Date(fromTs);
  cursor.setHours(0, 0, 0, 0);
  const endDay = new Date(toTs);
  endDay.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= endDay.getTime()) {
    const dow = cursor.getDay();

    const dayWindows = plan.windows
      .filter(w => w.daysOfWeek.includes(dow))
      .map(w => {
        const start = setLocalTime(cursor, w.startTime);
        const end = setLocalTime(cursor, w.endTime);
        return {w, start, end};
      })
      .filter(({w, start, end}) => {
        if (end <= start) {
          // eslint-disable-next-line no-console
          console.warn(
            `[expandPlanToFires] window ${w.id} has end <= start; skipping. ` +
              'Cross-midnight windows are not supported.',
          );
          return false;
        }
        return true;
      });

    const exclusiveBounds = dayWindows
      .filter(({w}) => w.exclusive)
      .map(({start, end}) => ({start, end}));

    for (const {w, start, end} of dayWindows) {
      const isExclusive = !!w.exclusive;
      w.slots.forEach((slot, slotIndex) => {
        const stepMs = slot.everyMinutes * 60_000;
        if (stepMs <= 0) {
          return;
        }
        for (let t = start; t < end; t += stepMs) {
          if (t < fromTs || t > toTs) {
            continue;
          }
          if (
            !isExclusive &&
            exclusiveBounds.some(b => t >= b.start && t < b.end)
          ) {
            continue;
          }
          fires.push({
            ts: t,
            element: slot.element,
            windowId: w.id,
            slotIndex,
            everyMinutes: slot.everyMinutes,
          });
        }
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  fires.sort((a, b) => a.ts - b.ts);
  return fires;
}

function setLocalTime(day: Date, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}
