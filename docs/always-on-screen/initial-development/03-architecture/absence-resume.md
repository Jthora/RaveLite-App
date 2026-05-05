# Absence & Resume

What the dashboard does when the operator vanishes for hours and
comes back. The brief explicitly mentions this case
("I might be outside for a few hours doing something").

## The bad version

The operator returns after a 4-hour gap. The activity log is a wall
of `ignored · ignored · ignored · ignored`. Adherence ring crashes
to 23%. Operator feels shamed for stepping away from a desk for 4
hours of normal life. **Behavior we explicitly want to avoid.**

## The right model: absence is a first-class event

An **absence window** is detected, summarized into a single rollup
entry, and excluded from adherence math.

### Detection

A gap is an *absence* when:

- ≥ N consecutive scheduled pulses produce zero operator interaction
  (no taps anywhere on the surface, no app foreground events), AND
- The gap exceeds `absenceThresholdMin` (default 45 min) inside
  active hours.

Default `N = 2`. Tunable.

Detection runs on dashboard re-foreground (when the operator comes
back) and in a lightweight foreground-service tick every minute
during Live mode.

### Logging

Posts a single `journal.absence` entry covering the absence window:

```ts
type AbsenceEntry = {
  kind: 'absence';
  id: string;
  at: number;          // when the gap is closed (operator returns)
  fromAt: number;      // when the gap started
  toAt: number;        // === at, kept for clarity
  pulseIdsAffected: string[];
  withinActiveHours: boolean;
};
```

The pulses inside the absence window have their fired-but-unresolved
state converted from `ignored` to `absorbed-by-absence` (a
sub-flag on `reminder.ignored`):

```ts
type ReminderIgnoredEntry = {
  ...
  absorbedBy?: string;  // absence entry id
};
```

Activity log renders affected ignored entries collapsed under the
absence rollup.

### Adherence math

`adherenceForDay` excludes pulses whose `ignored` is `absorbedBy`-set
**from both numerator and denominator** when `withinActiveHours
=== true`. Outside active hours they were already excluded by the
suppression rule.

Net effect: the day's ring fills against pulses fired *while the
operator was actually present*, which is the only fair metric.

## The welcome-back card

When the dashboard detects a closed absence window > threshold on
return-to-foreground, the now-card briefly shifts to a welcome-back
state:

```
┌──────────────────────────────────────┐
│  ⌬  WELCOME BACK                       │
│                                        │
│  Away 4h 12m · 5 pulses absorbed       │
│  Picking up from 14:38.                │
│                                        │
│       [ continue → ]                   │
└──────────────────────────────────────┘
```

- One CTA: continue. Tapping resumes the surface in idle state.
- The card auto-dismisses after 30 s if no interaction.
- Tone: matter-of-fact, never apologetic, never accusatory.

## Multiple gaps per day

Multiple absences are fine. Each is its own entry. The activity log
shows them as ⌬-prefixed rollups inline with the resolution rows.

## Manual pause vs detected absence

- **Manual pause** (operator long-presses PAUSE 1H) creates
  `reminder.suppressed` entries — **explicit absence**.
- **Detected absence** creates `journal.absence` entries — **implicit
  absence**.

Both are excluded from adherence math, but the activity log
differentiates them visually so the operator knows which gaps were
declared vs. drifted-into.

## Edge cases

- **Sleeping with the tablet on (operator-flagged scenario)**:
  treated identically to detected absence. The next-morning
  welcome-back card just says "Away 8h" once.
- **Active hours boundary cross**: an absence that spans the
  active-hours edge is still one entry (`fromAt` / `toAt`
  honest), but `withinActiveHours = false` because most of the
  span was outside; suppresses the rollup card on return — the
  operator was off-duty.
- **Single-tap-then-vanish**: the gap-detection clock resets on any
  tap, then re-arms. A drive-by tap won't fool the detector for
  long.

## Insights extension (Phase 2)

A weekly rollup of absence count, average length, and effect on
adherence. Useful for the operator's self-knowledge ("Wednesdays
I vanish twice"). One small chart on Insights, hidden behind a
"see absences" link to honor P-8 (no streak shame).

## Never auto-completing missed pulses

Absences absorb but never **complete** the missed pulses. The
operator did not do the action. Auto-completion would be a lie.
Absorption is the honest middle-path: "didn't do it, you weren't
here, no shame, no credit."
