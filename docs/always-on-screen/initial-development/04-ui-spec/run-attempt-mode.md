# Run-Attempt Mode

The UX for actually running a timed mile attempt. Manual entry of
"22:30" is for *recording* a run; this is for *running it*.

## Why this matters

The operator needs to leave the desk, go run 3 miles, come back, and
have the time. That requires:

- A start trigger that's faster than fumbling for a phone.
- A stop trigger that's reachable mid-puff.
- Resilience across screen-lock (the operator will pocket the
  phone, but the *tablet* might lock too if the run lasts > 5 min).
- Clear data attribution: the trial used distance D, took T seconds,
  on date X, with optional lap splits.

## Trigger

A **TRIAL** anchor card surfaces on time-trial day at the operator's
chosen anchor time (or earlier if the operator opens the app and
taps "Run anchor now"). The card shows:

```
┌──────────────────────────────────────┐
│ ⬢ TRIAL · 3-MILE RUN                  │
│ Goal: 21:00 · grade B+                │
│ Best (30d): 22:30 · grade B           │
│                                       │
│  ┌──────────────┐    ┌─────────────┐  │
│  │   START ▶︎    │    │  Setup...   │  │
│  └──────────────┘    └─────────────┘  │
└──────────────────────────────────────┘
```

START is a 200×96 dp target. Tapping it transitions the entire
surface into **run-attempt mode**.

## Run-attempt mode — running state

The screen reflows to a single dominant timer:

```
┌──────────────────────────────────────┐
│ ⬢  3-MILE TRIAL                       │
│                                       │
│         12:14.7                       │  ← MM:SS.t
│         ─────────                     │
│         Lap 2 · 0:24 ahead of pace    │
│                                       │
│   ┌─────────┐  ┌─────────┐  ┌──────┐  │
│   │  LAP    │  │  STOP   │  │ Quit │  │
│   └─────────┘  └─────────┘  └──────┘  │
└──────────────────────────────────────┘
```

- Timer text ≥ 96 sp, monospace numerals. Readable from across the
  room when the operator returns.
- LAP records a split. STOP ends the attempt and posts a
  `PFTAttempt`. Quit aborts (with confirm).
- Tapping STOP transitions to a tiny review card before commit.

## Pace ribbon

Below the timer: a one-line ribbon ("0:24 ahead of pace") computed
from the active anchor goal. Updates every second.

- Goal pace = `targetSeconds / totalLaps`.
- "Ahead" / "behind" relative to expected position at current
  elapsed time, assuming uniform pace. Honest, not gamified.

## Lap model

Default = 1 lap (no split). Operator can pre-configure laps for the
attempt:

- `1` — single split (just the trial).
- `3` — for 3-mile trial, one tap per mile.
- `4` — for 4-mile (SEAL).
- `12` — for 5 km on a 400 m track (lap-per-lap).

The lap count is in the Setup sheet (the "Setup..." button in the
trigger card).

## Resilience

- **Screen lock during run**: the timer continues in a foreground
  service. On unlock, the dashboard restores the running state with
  no time loss. Lap input requires unlock; no quick-action lap from
  the lock screen in v1.
- **App killed (Doze, low memory)**: persist `attemptInProgress`
  with start-epoch every lap. On relaunch, detect persisted in-flight
  attempt and present "Resume?" dialog. If resumed, time continues
  from start-epoch. If aborted, save partial.
- **Battery dies during run**: the operator returns to a dead tablet.
  The persisted `attemptInProgress` survives reboot; the dashboard
  on next launch offers manual stop-time entry to commit the partial
  attempt.

## Data shape

```ts
interface RunAttemptInProgress {
  startEpoch: number;
  distanceMeters: number;       // e.g. 4828 for 3 mi
  totalLaps: number;
  laps: Array<{ at: number; }>;
  goalSeconds: number;
}
```

Stored at `KEYS.attemptInProgress`. Cleared on STOP or Quit.

On STOP, posts:

```ts
PFTAttempt {
  event: 'run',
  value: stopEpoch - startEpoch,   // seconds
  distanceMeters: 4828,
  notes: laps.map(l => `${(l.at - startEpoch)/1000}s`).join(','),
  // ...
}
```

## Review card

After STOP and before commit:

```
┌──────────────────────────────────────┐
│ Trial complete · 3 mi · 21:48         │
│ Grade: B+                              │
│ Splits: 7:10 · 7:22 · 7:16             │
│                                        │
│ Notes (optional):                      │
│ [____________________________]         │
│                                        │
│  [ Commit ✓ ]   [ Discard ]            │
└──────────────────────────────────────┘
```

Discard nukes the persisted in-flight attempt without writing a
PFTAttempt.

## Voice cues (Phase 3)

A run-attempt mode setting (off by default) plays spoken updates
through the tablet's speakers at chosen lap milestones, e.g.
"mile 1, 7 minutes 10 seconds, 24 seconds ahead." Useful when the
tablet is across the room or carried. Out of v1 scope.

## What's deliberately not here

- **No GPS**. The tablet is on a desk. The operator runs an
  out-and-back or track and uses pre-declared distance.
- **No HR**. No wearables in this design.
- **No auto-distance from sensors**. Manual distance only.
- **No race mode** (multi-runner). Solo only.
