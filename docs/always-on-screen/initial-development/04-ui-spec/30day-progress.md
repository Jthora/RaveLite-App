# 30-Day Progress View

Deadline-aware visualization that lives on the surface. Earned a
spot in Phase 1B because the summer countdown is the operator's
only deadline.

## What it replaces

- Today-only adherence rings remain (they answer "today").
- The 30-day strip answers "this month" and "the deadline."

## Surface placement

A horizontal strip directly below the status strip, above the
NowCard. Compact (≤ 56 dp tall). One cell per day for the
30-day arc.

```
┌────────────────────────────────────────────────────────┐
│ Day 1 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ Day 30 ▶ │
│ ▓▓ ▓▓ ▓▓ ▓░ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓░ ▓▓ □  □  □  □  □ ⬢ □ □ │
│  M  T  W  T  F  S  S  M  T  W  T  F  S  S  M  T  W  T │
└────────────────────────────────────────────────────────┘
                                       ↑ today              ⬢ trial day
```

Cell encoding:
- ▓▓ — adherence ≥ 75% of day's scheduled
- ▓░ — adherence 33–75%
- ░░ — adherence < 33%
- ⌬ — absence-dominated day
- ⬢ — anchor/trial day (special)
- □ — future day, empty

Today's cell is outlined. Trial days (Sat in periodization template)
are accented in fire color.

## Tap interactions

- Tap any past cell → opens that day's resolution log in the activity
  log zone.
- Tap a future cell → previews that day's planned anchor.
- Tap today → no-op (already viewing).

## Data shape

```ts
interface DayStatus {
  date: string;           // ISO YYYY-MM-DD
  adherence: number;      // 0..1, after absence absorption
  hasAnchor: boolean;
  anchorOutcome?: 'completed' | 'missed' | 'pending';
  isTrial: boolean;
  trialResultSeconds?: number;
  absenceMinutes: number; // sum of detected absences
}

function thirtyDayWindow(now: Date): DayStatus[]; // length 30
```

Lives in `src/domain/journal/stats.ts` as `dayStatusWindow(n)`.
Pure derivation; cheap with the existing journal.

## Headline numbers above strip

To the right of the strip:

- **Days remaining**: `21 d`.
- **Best 3-mi (30 d)**: `22:18` · grade B.
- **Trend arrow**: ↗ / ↘ / → vs. start-of-window best.

These are the three numbers that matter to the deadline.

## Idle-state vs active-state

- **Idle**: strip is fully visible.
- **Active (pulse running)**: strip collapses to a 12 dp ribbon
  (just colored cells, no labels) so the NowCard owns the screen.

## Forward visibility

Cells from "today + 1" through Day 30 show **anchor glyphs only**
(if the periodization template defines them). This satisfies the
operator's brief — "a clear up-coming task list of what's coming
up" — across days, not just hours.

The hourly UpcomingStrip (existing) and the 30-day strip are
complementary: hourly = "what's next today," day-strip = "what's
coming this month."

## End-of-arc state

After Day 30:
- Strip becomes static, locked.
- A "debrief" card replaces the NowCard for one launch:
  "Arc complete. Best 3-mi: 21:08. Grade B+. Tap to start a new
  arc." Operator can roll into another 30-day arc with the same or
  different goal.

## What this view does NOT do

- No emotional language. "21 d" not "21 days left to summer!"
- No comparative panels (you vs. last month). The arc is its own
  closed system.
- No social. Single-operator only.
