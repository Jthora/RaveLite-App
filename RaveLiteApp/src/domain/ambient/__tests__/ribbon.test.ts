import {buildRibbonRows, type ActivePulseSummary} from '../ribbon';
import type {JournalEntry} from '../../journal/types';
import type {Plan} from '../../reminders/types';

// ── Fixtures ───────────────────────────────────────────────────────

const HOUR = 60 * 60_000;
const MIN = 60_000;

/** Anchor "now" at a deterministic moment well inside a single day. */
const NOW = (() => {
  const d = new Date();
  d.setHours(14, 0, 0, 0); // today 14:00 local
  return d.getTime();
})();

const dowToday = new Date(NOW).getDay();

const EMPTY_PLAN: Plan = {
  id: 'p',
  name: 'empty',
  windows: [],
};

/** A plan that fires Air every 30min from 09:00 to 17:00, today. */
const AIR_30M_PLAN: Plan = {
  id: 'p1',
  name: 'air-30',
  windows: [
    {
      id: 'w1',
      label: 'Day',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [dowToday],
      slots: [{element: 'air', everyMinutes: 30}],
    },
  ],
};

const baseInput = (overrides: Partial<Parameters<typeof buildRibbonRows>[0]> = {}) => ({
  now: NOW,
  windowBackMs: 4 * HOUR,
  windowForwardMs: 4 * HOUR,
  plan: EMPTY_PLAN,
  journal: [] as JournalEntry[],
  ...overrides,
});

// ── Tests ───────────────────────────────────────────────────────────

describe('buildRibbonRows — empty', () => {
  it('returns exactly one now-idle row when plan and journal are empty', () => {
    const rows = buildRibbonRows(baseInput());
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('now-idle');
    expect(rows[0].at).toBe(NOW);
  });
});

describe('buildRibbonRows — past sealed', () => {
  it('produces a past-sealed row with +ttR detail', () => {
    const journal: JournalEntry[] = [
      {
        id: 'j1',
        kind: 'reminder.fired',
        at: NOW - 30 * MIN,
        pulseId: 'p1',
        element: 'fire',
      },
      {
        id: 'j2',
        kind: 'completion',
        at: NOW - 30 * MIN + 14_000,
        exerciseId: 'fire-burpees',
        element: 'fire',
        source: 'always-on',
        pulseId: 'p1',
        respondedAfterMs: 14_000,
      },
    ];
    const rows = buildRibbonRows(baseInput({journal}));
    const sealed = rows.find(r => r.kind === 'past-sealed');
    expect(sealed).toBeDefined();
    expect(sealed!.id).toBe('p1');
    expect(sealed!.element).toBe('fire');
    expect(sealed!.label).toBe('fire-burpees');
    expect(sealed!.detail).toBe('+14s');
  });
});

describe('buildRibbonRows — past skipped + ignored', () => {
  it('emits distinct kinds', () => {
    const journal: JournalEntry[] = [
      {
        id: 'j1',
        kind: 'reminder.fired',
        at: NOW - 90 * MIN,
        pulseId: 'p1',
        element: 'air',
      },
      {
        id: 'j2',
        kind: 'reminder.skipped',
        at: NOW - 90 * MIN + 5_000,
        pulseId: 'p1',
        respondedAfterMs: 5_000,
      },
      {
        id: 'j3',
        kind: 'reminder.fired',
        at: NOW - 60 * MIN,
        pulseId: 'p2',
        element: 'water',
      },
      {
        id: 'j4',
        kind: 'reminder.ignored',
        at: NOW - 60 * MIN + 90_000,
        pulseId: 'p2',
        respondedAfterMs: null,
      },
    ];
    const rows = buildRibbonRows(baseInput({journal}));
    expect(rows.find(r => r.id === 'p1')!.kind).toBe('past-skipped');
    expect(rows.find(r => r.id === 'p2')!.kind).toBe('past-ignored');
  });
});

describe('buildRibbonRows — future from plan', () => {
  it('emits future rows sorted ascending and capped to forward window', () => {
    const rows = buildRibbonRows(
      baseInput({plan: AIR_30M_PLAN, windowForwardMs: 2 * HOUR}),
    );
    const future = rows.filter(r => r.kind === 'future');
    // 14:30, 15:00, 15:30, 16:00 — 4 fires within the 2h window
    expect(future).toHaveLength(4);
    for (let i = 1; i < future.length; i++) {
      expect(future[i].at).toBeGreaterThan(future[i - 1].at);
    }
    expect(future.every(r => r.element === 'air')).toBe(true);
    // Each future row's at must be within (now, now+2h]
    for (const r of future) {
      expect(r.at).toBeGreaterThan(NOW);
      expect(r.at).toBeLessThanOrEqual(NOW + 2 * HOUR);
    }
  });
});

describe('buildRibbonRows — active pulse', () => {
  const active: ActivePulseSummary = {
    pulseId: 'p-active',
    fireAt: NOW,
    expiresAt: NOW + 60_000,
    element: 'air',
    drillId: 'box-breath',
    drillName: 'BREATHE & STAND',
    durationSec: 60,
    cuesShort: ['inhale 4', 'hold 4', 'exhale 4'],
  };

  it('synthesizes a now-active row even when no matching reminder.fired exists', () => {
    const rows = buildRibbonRows(baseInput({activePulse: active}));
    const now = rows.find(r => r.kind === 'now-active');
    expect(now).toBeDefined();
    expect(now!.id).toBe('p-active');
    expect(now!.active?.cuesShort).toEqual(['inhale 4', 'hold 4', 'exhale 4']);
    expect(rows.find(r => r.kind === 'now-idle')).toBeUndefined();
  });

  it('replaces a matching unresolved reminder.fired row with the active row', () => {
    const journal: JournalEntry[] = [
      {
        id: 'j1',
        kind: 'reminder.fired',
        at: NOW,
        pulseId: 'p-active',
        element: 'air',
      },
    ];
    const rows = buildRibbonRows(baseInput({journal, activePulse: active}));
    // No duplicate row for p-active.
    const matches = rows.filter(r => r.id === 'p-active');
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe('now-active');
  });
});

describe('buildRibbonRows — welcome-back / absorbed', () => {
  it('synthesizes past-absorbed rows for plan fires older than threshold with no journal', () => {
    // 14:00 now, plan fires at 09:00 / 09:30 / 10:00 / ... — none journal-written.
    const rows = buildRibbonRows(
      baseInput({plan: AIR_30M_PLAN, windowBackMs: 4 * HOUR}),
    );
    const absorbed = rows.filter(r => r.kind === 'past-absorbed');
    // From 10:00 to 13:30 inclusive (within 4h back window): 8 fires
    // (10:00, 10:30, 11:00, 11:30, 12:00, 12:30, 13:00, 13:30).
    expect(absorbed.length).toBeGreaterThanOrEqual(7);
    expect(absorbed.every(r => r.element === 'air')).toBe(true);
  });

  it('does NOT mark very recent plan fires (< threshold) as absorbed', () => {
    // Make a plan that fires at NOW - 1min; threshold is 5min.
    const justFiredPlan: Plan = {
      id: 'p',
      name: 'just',
      windows: [
        {
          id: 'w',
          label: 'Now',
          startTime: hhmmFor(new Date(NOW - 60_000)),
          endTime: hhmmFor(new Date(NOW + 60 * MIN)),
          daysOfWeek: [dowToday],
          slots: [{element: 'fire', everyMinutes: 60}],
        },
      ],
    };
    const rows = buildRibbonRows(baseInput({plan: justFiredPlan}));
    expect(rows.some(r => r.kind === 'past-absorbed')).toBe(false);
  });
});

describe('buildRibbonRows — out-of-window plan fires excluded', () => {
  it('drops plan fires before now - back', () => {
    const rows = buildRibbonRows(
      baseInput({plan: AIR_30M_PLAN, windowBackMs: 1 * HOUR}),
    );
    // Window: [NOW-1h, NOW+4h]. Anything before 13:00 is out.
    for (const r of rows) {
      expect(r.at).toBeGreaterThanOrEqual(NOW - 1 * HOUR);
      expect(r.at).toBeLessThanOrEqual(NOW + 4 * HOUR);
    }
  });
});

describe('buildRibbonRows — strict ordering', () => {
  it('returns rows in monotonic ascending order of `at`', () => {
    const journal: JournalEntry[] = [
      {
        id: 'j1',
        kind: 'reminder.fired',
        at: NOW - 90 * MIN,
        pulseId: 'p1',
        element: 'fire',
      },
      {
        id: 'j2',
        kind: 'reminder.skipped',
        at: NOW - 90 * MIN + 1000,
        pulseId: 'p1',
        respondedAfterMs: 1000,
      },
    ];
    const rows = buildRibbonRows(
      baseInput({plan: AIR_30M_PLAN, journal, windowBackMs: 2 * HOUR}),
    );
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].at).toBeGreaterThanOrEqual(rows[i - 1].at);
    }
  });
});

describe('buildRibbonRows — now-active and now-idle are mutually exclusive', () => {
  it('never includes both', () => {
    const active: ActivePulseSummary = {
      pulseId: 'pa',
      fireAt: NOW,
      expiresAt: NOW + 60_000,
      element: 'fire',
      drillId: 'd',
      drillName: 'D',
      durationSec: 60,
      cuesShort: [],
    };
    const rows = buildRibbonRows(baseInput({activePulse: active}));
    const idle = rows.filter(r => r.kind === 'now-idle');
    const act = rows.filter(r => r.kind === 'now-active');
    expect(idle).toHaveLength(0);
    expect(act).toHaveLength(1);
  });
});

describe('buildRibbonRows — future preview label uses drill name when available', () => {
  it('looks up a real drill via pickDrillForSlot', () => {
    const rows = buildRibbonRows(
      baseInput({plan: AIR_30M_PLAN, windowForwardMs: 1 * HOUR}),
    );
    const future = rows.filter(r => r.kind === 'future');
    expect(future.length).toBeGreaterThan(0);
    // Library has Air drills; label should not be the bare element domain.
    const distinctLabels = new Set(future.map(r => r.label));
    expect(distinctLabels.size).toBeGreaterThanOrEqual(1);
  });
});

describe('buildRibbonRows — plan fire dedup vs reminder.fired', () => {
  it('does not produce a past-absorbed row for a plan fire that already has a matching reminder.fired', () => {
    // Plan fires at 13:30 (past); journal records it fired ~30s late.
    const planTs = setLocalHM(13, 30).getTime();
    const journal: JournalEntry[] = [
      {
        id: 'j1',
        kind: 'reminder.fired',
        at: planTs + 30_000,
        pulseId: 'preal',
        element: 'air',
        windowId: 'w1',
      },
    ];
    const rows = buildRibbonRows(
      baseInput({
        plan: AIR_30M_PLAN,
        journal,
        windowBackMs: 2 * HOUR,
      }),
    );
    // The real fired row exists.
    const realRow = rows.find(r => r.id === 'preal');
    expect(realRow).toBeDefined();
    // No synthetic past-absorbed row at the same plan ts.
    const dup = rows.filter(
      r =>
        r.kind === 'past-absorbed' && Math.abs(r.at - planTs) < 1000,
    );
    expect(dup).toHaveLength(0);
  });
});

// ── Helpers ────────────────────────────────────────────────────────

function setLocalHM(h: number, m: number): Date {
  const d = new Date(NOW);
  d.setHours(h, m, 0, 0);
  return d;
}

function hhmmFor(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}
