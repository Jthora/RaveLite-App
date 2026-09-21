import {
  emptyQueue,
  enqueue,
  tick,
  resolve,
  snooze,
  cancel,
  ALWAYS_PAGE,
  DEFAULT_ACTIVE_WINDOW_MS,
  DEFAULT_SNOOZE_MS,
  PagingPolicy,
  PulseSpec,
} from '../pulseQueue';

const T0 = 1_700_000_000_000; // arbitrary fixed epoch ms

const samplePulse = (over: Partial<PulseSpec> = {}): PulseSpec => ({
  id: 'p1',
  fireAt: T0,
  element: 'fire',
  ...over,
});

describe('enqueue', () => {
  it('adds a pulse in queued state with default expiresAt', () => {
    const {state, writes} = enqueue(emptyQueue(), samplePulse());
    expect(writes).toEqual([]);
    expect(state.pulses).toHaveLength(1);
    expect(state.pulses[0].state).toBe('queued');
    expect(state.pulses[0].expiresAt).toBe(T0 + DEFAULT_ACTIVE_WINDOW_MS);
  });

  it('honors an explicit expiresAt', () => {
    const {state} = enqueue(emptyQueue(), samplePulse({expiresAt: T0 + 1000}));
    expect(state.pulses[0].expiresAt).toBe(T0 + 1000);
  });

  it('does not auto-fire even if fireAt <= now', () => {
    // Just enqueue. Without a tick, nothing transitions.
    const {state, writes} = enqueue(
      emptyQueue(),
      samplePulse({fireAt: T0 - 10_000}),
    );
    expect(state.pulses[0].state).toBe('queued');
    expect(writes).toEqual([]);
  });
});

describe('tick — basic firing', () => {
  it('promotes a queued pulse to active when fireAt <= now', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0 + 1, ALWAYS_PAGE);
    expect(r.state.pulses).toHaveLength(1);
    expect(r.state.pulses[0].state).toBe('active');
    expect(r.writes).toEqual([
      expect.objectContaining({
        kind: 'reminder.fired',
        pulseId: 'p1',
        at: T0 + 1,
        element: 'fire',
      }),
    ]);
  });

  it('leaves a queued pulse alone if fireAt > now', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0 + 60_000}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    expect(r.state.pulses[0].state).toBe('queued');
    expect(r.writes).toEqual([]);
  });

  it('preserves windowId and exerciseId on reminder.fired', () => {
    let r = enqueue(
      emptyQueue(),
      samplePulse({windowId: 'w1', exerciseId: 'ex42'}),
    );
    r = tick(r.state, T0, ALWAYS_PAGE);
    expect(r.writes[0]).toMatchObject({
      kind: 'reminder.fired',
      windowId: 'w1',
      exerciseId: 'ex42',
    });
  });
});

describe('tick — suppression policy', () => {
  const suppressOutsideHours: PagingPolicy = () => 'outside-active-hours';

  it('suppresses a ready pulse when policy denies paging', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, suppressOutsideHours);
    // Suppressed pulses are dropped from in-memory list.
    expect(r.state.pulses).toHaveLength(0);
    expect(r.writes).toEqual([
      expect.objectContaining({
        kind: 'reminder.suppressed',
        pulseId: 'p1',
        reason: 'outside-active-hours',
        at: T0,
      }),
    ]);
  });

  it('does not promote to active when paging is denied', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, suppressOutsideHours);
    // No reminder.fired ever emitted.
    expect(r.writes.find(w => w.kind === 'reminder.fired')).toBeUndefined();
  });

  it('suppresses for manual-pause reason when policy returns it', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, () => 'manual-pause');
    expect(r.writes[0]).toMatchObject({
      kind: 'reminder.suppressed',
      reason: 'manual-pause',
    });
  });

  it('still expires an already-active pulse even when policy denies', () => {
    // Pulse is fired pre-suppression then policy flips. Window expires
    // while suppressed → reminder.ignored should still emit.
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0 + 1, ALWAYS_PAGE); // fires
    expect(r.state.pulses[0].state).toBe('active');
    r = tick(r.state, T0 + DEFAULT_ACTIVE_WINDOW_MS + 1, suppressOutsideHours);
    expect(r.writes).toEqual([
      expect.objectContaining({
        kind: 'reminder.ignored',
        pulseId: 'p1',
      }),
    ]);
  });
});

describe('tick — at-most-one-active invariant', () => {
  it('only promotes one pulse to active when two are ready', () => {
    let r = enqueue(emptyQueue(), samplePulse({id: 'a', fireAt: T0}));
    r = enqueue(r.state, samplePulse({id: 'b', fireAt: T0 + 1}));
    r = tick(r.state, T0 + 1000, ALWAYS_PAGE);

    const active = r.state.pulses.filter(p => p.state === 'active');
    const queued = r.state.pulses.filter(p => p.state === 'queued');
    expect(active).toHaveLength(1);
    expect(queued).toHaveLength(1);
    // Earlier fireAt wins.
    expect(active[0].id).toBe('a');
    expect(queued[0].id).toBe('b');

    // Only one reminder.fired emitted this tick.
    expect(r.writes.filter(w => w.kind === 'reminder.fired')).toHaveLength(1);
  });

  it('promotes the waiting pulse on the next tick after the active resolves', () => {
    let r = enqueue(emptyQueue(), samplePulse({id: 'a', fireAt: T0}));
    r = enqueue(r.state, samplePulse({id: 'b', fireAt: T0 + 1}));
    r = tick(r.state, T0 + 1000, ALWAYS_PAGE); // a active, b queued
    r = resolve(r.state, 'a', 'completed', T0 + 2000); // a leaves
    r = tick(r.state, T0 + 2001, ALWAYS_PAGE);
    expect(r.state.pulses).toHaveLength(1);
    expect(r.state.pulses[0]).toMatchObject({id: 'b', state: 'active'});
  });

  it('suppression of a ready pulse does not block another from activating', () => {
    // Hybrid: policy suppresses everything reaching tick. After all are
    // suppressed, no active remains. Confirms suppression doesn't
    // consume the at-most-one-active slot semantically (it's terminal).
    let r = enqueue(emptyQueue(), samplePulse({id: 'a', fireAt: T0}));
    r = enqueue(r.state, samplePulse({id: 'b', fireAt: T0 + 1}));
    r = tick(r.state, T0 + 1000, () => 'outside-active-hours');
    expect(r.state.pulses).toHaveLength(0);
    expect(r.writes.filter(w => w.kind === 'reminder.suppressed')).toHaveLength(
      2,
    );
  });
});

describe('tick — window expiry → reminder.ignored', () => {
  it('expires an active pulse whose expiresAt has passed', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE); // fires
    r = tick(r.state, T0 + DEFAULT_ACTIVE_WINDOW_MS + 1, ALWAYS_PAGE);
    expect(r.state.pulses).toHaveLength(0);
    expect(r.writes).toEqual([
      expect.objectContaining({
        kind: 'reminder.ignored',
        pulseId: 'p1',
        respondedAfterMs: null,
      }),
    ]);
  });

  it('does not re-fire an expired pulse', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    r = tick(r.state, T0 + DEFAULT_ACTIVE_WINDOW_MS + 1, ALWAYS_PAGE);
    // No queued pulse remains; further ticks do nothing.
    const r2 = tick(r.state, T0 + DEFAULT_ACTIVE_WINDOW_MS + 9999, ALWAYS_PAGE);
    expect(r2.writes).toEqual([]);
  });

  it('expires the active pulse first, then activates a waiting one', () => {
    let r = enqueue(emptyQueue(), samplePulse({id: 'a', fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE); // a active
    r = enqueue(r.state, samplePulse({id: 'b', fireAt: T0 + 1000}));
    // Tick after a's window expires AND b is ready.
    r = tick(r.state, T0 + DEFAULT_ACTIVE_WINDOW_MS + 1, ALWAYS_PAGE);

    const writes = r.writes;
    const ignored = writes.find(w => w.kind === 'reminder.ignored');
    const fired = writes.find(w => w.kind === 'reminder.fired');
    expect(ignored).toMatchObject({pulseId: 'a'});
    expect(fired).toMatchObject({pulseId: 'b'});
    expect(r.state.pulses).toHaveLength(1);
    expect(r.state.pulses[0]).toMatchObject({id: 'b', state: 'active'});
  });

  it('gives a pulse that waited behind another its full answer window', () => {
    let r = enqueue(emptyQueue(), samplePulse({id: 'a', fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE); // a active
    r = enqueue(r.state, samplePulse({id: 'b', fireAt: T0 + 1000}));
    const promotedAt = T0 + DEFAULT_ACTIVE_WINDOW_MS + 1;
    r = tick(r.state, promotedAt, ALWAYS_PAGE); // a ignored, b active
    expect(r.state.pulses[0]).toMatchObject({
      id: 'b',
      state: 'active',
      fireAt: T0 + 1000,
      expiresAt: promotedAt + DEFAULT_ACTIVE_WINDOW_MS,
    });
    // A second later b is still answerable instead of ignored.
    r = tick(r.state, promotedAt + 1000, ALWAYS_PAGE);
    expect(r.writes).toEqual([]);
    expect(r.state.pulses[0]).toMatchObject({id: 'b', state: 'active'});
  });
});

describe('resolve', () => {
  it('completed: removes pulse, emits NO journal write (caller posts CompletionEntry)', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    r = resolve(r.state, 'p1', 'completed', T0 + 5000);
    expect(r.state.pulses).toHaveLength(0);
    expect(r.writes).toEqual([]);
  });

  it('skipped: emits reminder.skipped with respondedAfterMs', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    r = resolve(r.state, 'p1', 'skipped', T0 + 3000);
    expect(r.state.pulses).toHaveLength(0);
    expect(r.writes).toEqual([
      expect.objectContaining({
        kind: 'reminder.skipped',
        pulseId: 'p1',
        respondedAfterMs: 3000,
      }),
    ]);
  });

  it('ignored: emits reminder.ignored', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    r = resolve(r.state, 'p1', 'ignored', T0 + 7000);
    expect(r.writes[0]).toMatchObject({
      kind: 'reminder.ignored',
      pulseId: 'p1',
      respondedAfterMs: 7000,
    });
  });

  it('snoozed outcome is rejected — caller must use snooze()', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    const before = r.state;
    r = resolve(r.state, 'p1', 'snoozed', T0 + 1000);
    expect(r.state).toBe(before);
    expect(r.writes).toEqual([]);
  });

  it('no-ops when pulseId is unknown', () => {
    const start = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    const r = resolve(start.state, 'missing', 'completed', T0);
    expect(r.state).toBe(start.state);
    expect(r.writes).toEqual([]);
  });

  it('no-ops when target pulse is queued, not active', () => {
    const start = enqueue(emptyQueue(), samplePulse({fireAt: T0 + 10_000}));
    const r = resolve(start.state, 'p1', 'completed', T0);
    expect(r.state).toBe(start.state);
    expect(r.writes).toEqual([]);
  });
});

describe('snooze', () => {
  it('moves the active pulse back to queued with new fireAt + emits reminder.snoozed', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    r = snooze(r.state, 'p1', T0 + 2000);
    const p = r.state.pulses[0];
    expect(p.state).toBe('queued');
    expect(p.fireAt).toBe(T0 + 2000 + DEFAULT_SNOOZE_MS);
    expect(p.expiresAt).toBe(p.fireAt + DEFAULT_ACTIVE_WINDOW_MS);
    expect(p.snoozedFrom).toBe(T0);
    expect(r.writes).toEqual([
      expect.objectContaining({
        kind: 'reminder.snoozed',
        pulseId: 'p1',
        respondedAfterMs: 2000,
      }),
    ]);
  });

  it('caps at one snooze per pulse', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    r = snooze(r.state, 'p1', T0 + 1000);
    // Re-fire after the snooze window.
    r = tick(r.state, T0 + 1000 + DEFAULT_SNOOZE_MS + 1, ALWAYS_PAGE);
    expect(r.state.pulses[0].state).toBe('active');
    // Second snooze attempt — should no-op.
    const before = r.state;
    r = snooze(r.state, 'p1', T0 + 1000 + DEFAULT_SNOOZE_MS + 100);
    expect(r.state).toBe(before);
    expect(r.writes).toEqual([]);
  });

  it('honors a custom duration', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    r = snooze(r.state, 'p1', T0 + 500, 60_000);
    expect(r.state.pulses[0].fireAt).toBe(T0 + 500 + 60_000);
  });

  it('frees the active slot so another pulse can promote', () => {
    let r = enqueue(emptyQueue(), samplePulse({id: 'a', fireAt: T0}));
    r = enqueue(r.state, samplePulse({id: 'b', fireAt: T0 + 1}));
    r = tick(r.state, T0 + 1000, ALWAYS_PAGE); // a active, b queued
    r = snooze(r.state, 'a', T0 + 2000); // a → queued
    r = tick(r.state, T0 + 2001, ALWAYS_PAGE);
    // b should now be active.
    const active = r.state.pulses.find(p => p.state === 'active');
    expect(active?.id).toBe('b');
  });

  it('no-ops on unknown pulseId', () => {
    const start = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    const r = snooze(start.state, 'missing', T0);
    expect(r.state).toBe(start.state);
    expect(r.writes).toEqual([]);
  });
});

describe('cancel', () => {
  it('drops a queued pulse with no journal writes', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0 + 10_000}));
    r = cancel(r.state, 'p1');
    expect(r.state.pulses).toHaveLength(0);
    expect(r.writes).toEqual([]);
  });

  it('drops an active pulse with no journal writes', () => {
    let r = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    r = tick(r.state, T0, ALWAYS_PAGE);
    r = cancel(r.state, 'p1');
    expect(r.state.pulses).toHaveLength(0);
    expect(r.writes).toEqual([]);
  });

  it('no-ops on unknown pulseId', () => {
    const start = enqueue(emptyQueue(), samplePulse({fireAt: T0}));
    const r = cancel(start.state, 'missing');
    expect(r.state).toBe(start.state);
    expect(r.writes).toEqual([]);
  });
});
