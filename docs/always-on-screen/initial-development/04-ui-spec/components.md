# Components

> **Amended 2026-09-14.** `NowCard`, `UpcomingStrip`, `ActivityLog` and
> `AdherenceRings` became `ChimeCard`, `DayList` and `BalanceStrip` in
> `src/components/today/`; `ActiveHoursChip` now opens `MyDaySheet`. The
> PFT goal, attempt and 30-day components below were never built. See
> [../10-today-home.md](../10-today-home.md).

Component-level contracts for the Always-On surface. Each section
lists props, states, and interaction rules.

## `<NowCard />`

Primary interactive surface. Three states: `idle`, `active`,
`welcome-back`.

### Props

```ts
interface NowCardProps {
  state: 'idle' | 'active' | 'welcome-back';
  /** Idle-state: when the next pulse fires. */
  nextPulseAt?: number;
  /** Active-state: the live pulse. */
  pulse?: Pulse;
  /** Welcome-back: just-closed absence to surface. */
  absence?: AbsenceEntry;
  onDone: () => void;
  onSkip: () => void;
  onSnooze: () => void;
  onWelcomeBackContinue: () => void;
}
```

### Idle layout
- Centered: `NEXT · 12m 40s` (large tabular).
- Below: "today: 6 sealed · 0 skipped · 1 ignored" (small).
- Subtle element-cycle background (one element accent at 0.05 alpha,
  cycles every 30 s).
- No tappable targets.

### Active layout
- Element glyph + name (top-left).
- Headline action: `BREATHE & STAND · 60s`.
- 60-second ring drawing at element accent.
- Bullet cues (≤ 4 lines): "tall spine · long inhale · soft exhale".
- Three CTAs at the bottom, equal width: **DONE** (solid element
  color), **SKIP** (ghost), **SNOOZE 5m** (ghost, narrower).
- Window-expiry meter as a hairline at the very bottom.

### Welcome-back layout
- ⌬ glyph + headline `WELCOME BACK`.
- Subline: `Away 4h 12m · 5 pulses absorbed`.
- One CTA: `continue →`.
- Auto-dismisses to idle after 30 s with no interaction.
- Tone: matter-of-fact, never apologetic. See
  [../03-architecture/absence-resume.md](../03-architecture/absence-resume.md).

### Behavior
- The ring fills clockwise over the action duration. Reaching 100%
  does NOT auto-resolve to Done (per interaction-states invariant).
- Tapping anywhere outside the three CTAs is a no-op.
- After resolve, fades back to idle within 800 ms.

## `<UpcomingStrip />`

Horizontal list of the next 3–5 pulses.

### Props

```ts
interface UpcomingStripProps {
  items: Array<{
    pulseId: string;
    fireAt: number;
    element: ElementId;
    label: string;
  }>;
  onPreview: (pulseId: string) => void;
}
```

### Layout
- Each chip: glyph + label (truncated) + ETA (`+12m`, `+1h 4m`).
- Chips render in fire-order, left-to-right.
- The chip nearest its fire-time gets a subtle border-pulse animation.

## `<ActivityLog />`

Today's resolutions, newest-first.

### Props

```ts
interface ActivityLogProps {
  entries: ResolutionEntry[];   // derived view-model from journal
  onReverse: (entryId: string) => void;
}
```

### Row layout
- 18-sp row.
- Time (HH:MM) · element glyph · label · outcome chip · `+ttR`.
- Outcome chip colors:
  - `completed` → element color
  - `skipped`   → palette.textDim
  - `snoozed`   → palette.textDim italic
  - `ignored`   → palette.textMuted
- Reverse-window sheet only available within 60 s of resolution
  (the row stores its `at`; component decides eligibility on render).

## `<AdherenceRings />`

One total ring + five element rings.

### Props

```ts
interface AdherenceRingsProps {
  total: { completed: number; scheduled: number };
  byElement: Record<ElementId, { completed: number; scheduled: number }>;
}
```

### Layout
- Total ring: 96 dp diameter; tabular % in center; element accent
  is heart.color (the integrator).
- Element rings: 48 dp, in `ELEMENT_ORDER`, beside the total.

## `<PFTGoalPanel />`

Right-rail anchor display. Ships in Phase 1B (not Phase 3).

### Props

```ts
interface PFTGoalPanelProps {
  standardId: string;
  anchor: {
    event: 'run' | 'pushups' | 'pullups' | 'crunches' | 'plank';
    target: number;        // seconds or reps
    bestWithin30d?: number;
    grade?: string;        // 'A+' | 'B+' | ...
  };
  /** Today's anchor from the periodization template, if any. */
  todayAnchor?: { actionId: string; label: string };
  secondaryChips: Array<{ event: string; bestWithin30d?: number; grade?: string }>;
  onLogAttempt: (event: string) => void;
  onStartTrial?: () => void;        // hot when today's anchor is a trial
}
```

### Layout
- Top: standard name + active anchor label (e.g. "USMC · 3-mi run").
- Center: large goal ring (best-of-30d as ratio against target).
- Below ring: grade letter + best time/reps.
- Bottom: row of secondary chips. Tap → log-attempt sheet.

### Chip colors
- Grade A+/A → element heart color.
- Grade B → element accent for the standard's branch (TBD per branch).
- Grade C and below → textDim.
- No grade yet → textMuted, "log first attempt".

## `<LogAttemptSheet />`

Modal sheet for recording a new `PFTAttempt`.

### Props

```ts
interface LogAttemptSheetProps {
  event: 'run' | 'pushups' | 'pullups' | 'crunches' | 'plank' | 'load_carry';
  defaultStandardId: string;
  onSubmit: (attempt: Omit<PFTAttempt, 'id'>) => void;
  onCancel: () => void;
}
```

### Behavior
- Time-event keypad: MM:SS digits with leading-zero discipline.
- Rep-event keypad: integer 0–999.
- For run, distance pickers: 1.5 mi, 2 mi, 3 km, 3 mi, 4 mi, 5 km,
  10 km — radio.
- For load_carry, additional load-kg input (defaults to 50 kg).
- Submit posts attempt and closes; toast on success.

## `<ReverseSheet />`

The 60-second undo for any activity log entry.

### Props

```ts
interface ReverseSheetProps {
  entry: ResolutionEntry;
  onRestore: () => void;
  onClose: () => void;
}
```

### Behavior
- Shows the original card data + outcome.
- One CTA: **RESTORE**.
- Auto-closes when 60-s eligibility window expires.

## `<ThirtyDayStrip />`

Deadline-aware month-arc visualization. Lives directly under the
status strip.

### Props

```ts
interface ThirtyDayStripProps {
  days: DayStatus[];          // length 30; today is at days[i] where date===today
  daysRemaining: number;
  bestSeconds?: number;       // best 3-mi (or chosen anchor) in window
  trend: 'up' | 'down' | 'flat';
  onTapDay: (date: string) => void;
}
```

Full spec: [30day-progress.md](30day-progress.md).

## `<DeadlineCountdown />`

Status-strip chip showing days remaining to the goal deadline.

```ts
interface DeadlineCountdownProps {
  deadlineISO: string;        // YYYY-MM-DD
  /** When < 7d, the chip recolors to fire-accent. */
}
```

## `<ActiveHoursChip />`

Status-strip chip displaying current active-hours range. Long-press
opens an inline editor.

```ts
interface ActiveHoursChipProps {
  range: { start: string; end: string; daysMask: number };
  manualPauseUntil?: number;
  onEdit: () => void;
  onTogglePause: () => void;
}
```

## `<RunAttemptScreen />`

Full-screen takeover during a live timed trial. See
[run-attempt-mode.md](run-attempt-mode.md) for the full spec.
Key contract: 96 sp monospace timer, 200×96 dp START/STOP, lap
support, screen-lock-resilient via persisted `RunAttemptInProgress`.
