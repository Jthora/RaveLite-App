import {
  DEFAULT_GRACE_MS,
  DEFAULT_HORIZON_MS,
  planPulseId,
  reconcilePlan,
} from '../planScheduler';
import type {Plan} from '../../reminders/types';

/**
 * Plan with one weekday window 09:00–10:00 every 15min on the air slot.
 * → 4 fires per day at :00, :15, :30, :45.
 */
function makePlan(): Plan {
  return {
    id: 'p1',
    name: 'test',
    windows: [
      {
        id: 'w1',
        label: 'Morning',
        startTime: '09:00',
        endTime: '10:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        slots: [{element: 'air', everyMinutes: 15}],
      },
    ],
  };
}

/** Local 09:00 today. */
function nineAm(): number {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

describe('reconcilePlan', () => {
  it('produces a stable id with windowId, slotIndex, ts', () => {
    expect(planPulseId({ts: 123, element: 'air', windowId: 'w1', slotIndex: 0, everyMinutes: 15})).toBe(
      'plan:w1:0:123',
    );
  });

  it('returns one fire per slot tick inside the horizon', () => {
    const now = nineAm();
    const {toEnqueue} = reconcilePlan({
      now,
      plan: makePlan(),
      alreadyEnqueued: new Set(),
      horizonMs: 60 * 60_000, // 1h
    });
    // 09:00, 09:15, 09:30, 09:45 → 4 fires
    expect(toEnqueue).toHaveLength(4);
    expect(toEnqueue.map(f => new Date(f.ts).getMinutes())).toEqual([0, 15, 30, 45]);
  });

  it('is idempotent when re-run with the same enqueued set', () => {
    const now = nineAm();
    const first = reconcilePlan({
      now,
      plan: makePlan(),
      alreadyEnqueued: new Set(),
      horizonMs: 60 * 60_000,
    });
    const second = reconcilePlan({
      now,
      plan: makePlan(),
      alreadyEnqueued: first.nextEnqueued,
      horizonMs: 60 * 60_000,
    });
    expect(second.toEnqueue).toEqual([]);
    expect(second.nextEnqueued).toEqual(first.nextEnqueued);
  });

  it('skips fires older than now - graceMs', () => {
    // now = 09:30 → 09:00 + 09:15 are out of grace; 09:30 + 09:45 in
    const d = new Date();
    d.setHours(9, 30, 0, 0);
    const {toEnqueue} = reconcilePlan({
      now: d.getTime(),
      plan: makePlan(),
      alreadyEnqueued: new Set(),
      horizonMs: 60 * 60_000,
      graceMs: 30_000,
    });
    expect(toEnqueue.map(f => new Date(f.ts).getMinutes())).toEqual([30, 45]);
  });

  it('keeps a fire that lies within the grace window', () => {
    // now = 09:00:30 (30s past the 09:00 fire). Grace = 60s → keep it.
    const d = new Date();
    d.setHours(9, 0, 30, 0);
    const {toEnqueue} = reconcilePlan({
      now: d.getTime(),
      plan: makePlan(),
      alreadyEnqueued: new Set(),
      horizonMs: 60 * 60_000,
      graceMs: 60_000,
    });
    expect(toEnqueue[0].ts).toBe(nineAm());
  });

  it('GCs ids whose ts is older than retainMs', () => {
    const now = nineAm() + 10 * 60 * 60_000; // 10h later
    const stale = 'plan:w1:0:' + (now - 8 * 60 * 60_000); // 8h ago
    const fresh = 'plan:w1:0:' + (now + 60_000);
    const {nextEnqueued} = reconcilePlan({
      now,
      plan: makePlan(),
      alreadyEnqueued: new Set([stale, fresh]),
      horizonMs: DEFAULT_HORIZON_MS,
      retainMs: 6 * 60 * 60_000,
    });
    expect(nextEnqueued.has(stale)).toBe(false);
    expect(nextEnqueued.has(fresh)).toBe(true);
  });

  it('uses the default horizon to bound output', () => {
    const now = nineAm();
    const big: Plan = {
      ...makePlan(),
      windows: [
        {
          ...makePlan().windows[0],
          startTime: '00:00',
          endTime: '23:59',
          slots: [{element: 'air', everyMinutes: 1}], // 1440/day
        },
      ],
    };
    const {toEnqueue} = reconcilePlan({
      now,
      plan: big,
      alreadyEnqueued: new Set(),
      // default horizon
    });
    // 24h × 60/min ≈ 1440. Allow a small slack for grace + edge fires.
    expect(toEnqueue.length).toBeGreaterThan(1000);
    expect(toEnqueue.length).toBeLessThan(2000);
    expect(DEFAULT_GRACE_MS).toBeGreaterThan(0);
  });

  it('skips fires whose id is already in the enqueued set', () => {
    const now = nineAm();
    const seen = new Set<string>([
      'plan:w1:0:' + (now + 15 * 60_000), // 09:15
      'plan:w1:0:' + (now + 30 * 60_000), // 09:30
    ]);
    const {toEnqueue, nextEnqueued} = reconcilePlan({
      now,
      plan: makePlan(),
      alreadyEnqueued: seen,
      horizonMs: 60 * 60_000,
    });
    const newTs = toEnqueue.map(f => new Date(f.ts).getMinutes());
    expect(newTs).toEqual([0, 45]); // 15 + 30 already seen
    expect(nextEnqueued.size).toBeGreaterThanOrEqual(4);
  });
});

describe('reconcilePlan — restart safety', () => {
  it('never re-enqueues a pulse that already fired today', () => {
    const now = nineAm() + 30_000; // the 09:00 fire is still inside grace
    const firedId = 'plan:w1:0:' + nineAm();
    const {toEnqueue} = reconcilePlan({
      now,
      plan: makePlan(),
      alreadyEnqueued: new Set(),
      firedIds: new Set([firedId]),
      horizonMs: 60 * 60_000,
    });
    expect(toEnqueue.map(planPulseId)).not.toContain(firedId);
    expect(toEnqueue).toHaveLength(3);
  });
});

describe('reconcilePlan — plan edits', () => {
  it('cancels queued pulses from a window the plan no longer has', () => {
    const now = nineAm();
    const gone = 'plan:removed:0:' + (now + 20 * 60_000);
    const kept = 'plan:w1:0:' + (now + 15 * 60_000);
    const {toCancel, nextEnqueued} = reconcilePlan({
      now,
      plan: makePlan(),
      alreadyEnqueued: new Set([gone, kept]),
      queuedPlanIds: new Set([gone, kept]),
      horizonMs: 60 * 60_000,
    });
    expect(toCancel).toEqual([gone]);
    expect(nextEnqueued.has(gone)).toBe(false);
    expect(nextEnqueued.has(kept)).toBe(true);
  });

  it('replaces the old pulses when a slot is retimed', () => {
    const now = nineAm();
    const old = [15, 30, 45].map(m => 'plan:w1:0:' + (now + m * 60_000));
    const base = makePlan();
    const retimed: Plan = {
      ...base,
      windows: [
        {...base.windows[0], slots: [{element: 'air', everyMinutes: 20}]},
      ],
    };
    const {toCancel, toEnqueue} = reconcilePlan({
      now,
      plan: retimed,
      alreadyEnqueued: new Set(old),
      queuedPlanIds: new Set(old),
      horizonMs: 60 * 60_000,
    });
    expect([...toCancel].sort()).toEqual([...old].sort());
    const minutes = toEnqueue.map(f => new Date(f.ts).getMinutes());
    expect(minutes).toEqual([0, 20, 40]);
  });

  it('leaves a pulse already waiting past grace alone', () => {
    const now = nineAm() + 30 * 60_000;
    const waiting = 'plan:removed:0:' + (now - 5 * 60_000);
    const {toCancel} = reconcilePlan({
      now,
      plan: makePlan(),
      alreadyEnqueued: new Set([waiting]),
      queuedPlanIds: new Set([waiting]),
      horizonMs: 60 * 60_000,
    });
    expect(toCancel).toEqual([]);
  });
});
