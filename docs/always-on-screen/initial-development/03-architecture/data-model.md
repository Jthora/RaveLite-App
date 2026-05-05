# Data Model

The Always-On surface is a *consumer* of existing RaveLite domain
state plus a small additive layer for the new interaction outcomes
and PFT records. Reuses the journal as the source-of-truth log.

## Existing types reused

| Type                              | Source                                 |
| --------------------------------- | -------------------------------------- |
| `Plan`, `Window`, `CadenceSlot`   | `src/domain/reminders/`                |
| `CompletionEntry` (`kind:'completion'`) | `src/domain/journal/types.ts`    |
| `JournalEntry` envelope           | `src/domain/journal/types.ts`          |
| `ElementId`                       | `src/theme/elements.ts`                |
| `CircuitLeg`, `CustomCircuit`     | `src/domain/circuit/`                  |

## New journal entry kinds

Add to the `JournalEntry` discriminated union:

```ts
type ReminderFiredEntry = {
  kind: 'reminder.fired';
  id: string;
  at: number;            // when cue fired
  pulseId: string;       // synthetic id for correlation
  windowId: string;
  element: ElementId;
  exerciseId?: string;   // when the slot resolved a specific drill
};

type ReminderResolvedEntry = {
  kind: 'reminder.skipped' | 'reminder.snoozed' | 'reminder.ignored';
  id: string;
  at: number;            // when operator tapped or window expired
  pulseId: string;       // matches a prior reminder.fired
  respondedAfterMs: number | null;  // null for ignored
  reason?: string;       // free-text, optional, operator-entered
  /** Set on reminder.ignored when an absence rollup absorbs it. */
  absorbedBy?: string;
};

type ReminderSuppressedEntry = {
  kind: 'reminder.suppressed';
  id: string;
  at: number;
  pulseId: string;
  reason: 'outside-active-hours' | 'battery-saver' | 'manual-pause';
};

type AbsenceEntry = {
  kind: 'journal.absence';
  id: string;
  at: number;            // === toAt; epoch when gap closed (operator returned)
  fromAt: number;
  toAt: number;
  pulseIdsAffected: string[];
  withinActiveHours: boolean;
};
```

`reminder.fired` is **also written by the existing scheduler** so
adherence math becomes "count of fired in window" minus "count of
ignored where operator was present." See FR-7.4 / interaction-states.

A `CompletionEntry` posted from Always-On also carries a new
optional field:

```ts
{ ...existing CompletionEntry,
  pulseId?: string;          // correlate to fired entry
  respondedAfterMs?: number; // time-to-Done
  source: 'manual' | 'notification' | 'auto' | 'always-on';
}
```

## New domain area: `pft`

```
src/domain/pft/
├── standards/                 // pure tables, one file per branch
│   ├── personal3mi.ts         // operator-authored, ships in Phase 1B
│   ├── usaf.ts                // ⚠ verified per-table before UI ships it
│   ├── usmc.ts                // ⚠ verified per-table before UI ships it
│   ├── ussf.ts                // ⚠ preview-only until verified
│   ├── usn.ts                 // ⚠ preview-only until verified
│   ├── usa.ts                 // ⚠ preview-only until verified
│   └── elite.ts               // SEAL / Spetsnaz, "popular benchmark" labeling allowed
├── grading.ts                 // grade(time, distance, standard) → letter
├── records.ts                 // PFTAttempt + RunAttemptInProgress CRUD
├── periodization.ts           // 4-week template helpers
└── types.ts
```

### `PFTAttempt`

```ts
interface PFTAttempt {
  id: string;
  at: number;
  standardId: 'personal3mi' | 'ussf' | 'usaf' | 'usmc' | 'usn' | 'usa' | 'elite';
  event: 'run' | 'pushups' | 'pullups' | 'crunches' | 'plank' | 'load_carry';
  /** primary metric in canonical units */
  value: number;             // seconds for time events, reps for count events
  distanceMeters?: number;   // for run/load_carry
  loadKg?: number;           // for load_carry
  notes?: string;
}
```

Stored under key prefix `pft.attempt.<id>` as JSON. New attempts
append-only.

### `RunAttemptInProgress`

In-flight state for [run-attempt mode](../04-ui-spec/run-attempt-mode.md).
Survives reboot.

```ts
interface RunAttemptInProgress {
  startEpoch: number;
  distanceMeters: number;
  totalLaps: number;
  laps: Array<{ at: number; }>;
  goalSeconds: number;
  standardId: string;
  event: 'run';
}
```

Stored at `KEYS.attemptInProgress` (singleton). Cleared on STOP /
Quit / Discard.

### `PlanTemplate`

Optional 4-week periodization layer over the existing `Plan`.

```ts
interface PlanTemplate {
  id: string;
  name: string;
  weeklyDays: PlanTemplateDay[];   // length 7, Mon-first
  startDate: string;               // ISO YYYY-MM-DD
  endDate: string;                 // ISO; deadline-countdown source
}

interface PlanTemplateDay {
  weekday: number;                 // 0=Mon..6=Sun
  anchorActionId?: string;         // e.g. 'anchor.run3mi-trial'
  preferredCatalogIds?: string[];  // override regular catalog pool for the day
}
```

Stored at `KEYS.planTemplate`. See
[periodization.md](periodization.md).

## New domain area: `ambient`

```
src/domain/ambient/
├── pulseQueue.ts             // pure logic for at-most-one-active state machine
├── tones.ts                  // element → asset path map (audio)
├── session.ts                // session-mode state (plug-detect, screen-on, etc.)
└── types.ts
```

### `Pulse` (ephemeral, in-memory)

```ts
interface Pulse {
  id: string;
  state: 'queued' | 'active' | 'resolved' | 'cancelled';
  fireAt: number;
  expiresAt: number;
  element: ElementId;
  windowId: string;
  exerciseId?: string;
  snoozedFrom?: number;
  resolution?: {
    outcome: 'completed' | 'skipped' | 'snoozed' | 'ignored';
    at: number;
    respondedAfterMs: number | null;
    journalEntryId?: string;
  };
}
```

Pulses live in memory while the surface is foregrounded. State
transitions emit journal writes; the pulse object is discarded
after `resolved` is committed.

## Storage keys (new)

| Key                          | Holds                                |
| ---------------------------- | ------------------------------------ |
| `pft.attempt.<id>`           | `PFTAttempt` JSON                    |
| `pft.activeStandard`         | string id of the operator's chosen anchor |
| `pft.goal`                   | `{ event, target, deadlineISO }`     |
| `pft.attemptInProgress`      | `RunAttemptInProgress` (singleton)   |
| `pft.planTemplate`           | `PlanTemplate` (singleton)           |
| `ambient.session.lastSeenAt` | last foreground tick (for resume logic) |
| `ambient.toneVolume.<el>`    | 0–100 per element                    |
| `ambient.activeHours`        | `{ start, end, daysMask }`           |
| `ambient.manualPauseUntil`   | epoch ms; cleared when reached       |
| `ambient.onboarding.completedAt` | epoch ms                          |

All keys go through `src/storage/keys.ts` (KEYS object), not
string-typed inline.

## Aggregation contracts

Insights gains:

- `adherenceForDay(d)` → `{completed, scheduled, skipped, ignored}`
  — excludes `reminder.suppressed` and `absorbedBy`-marked
  `reminder.ignored` from both numerator and denominator.
- `timeToRespondPercentile(pXX, windowDays)` → ms
- `dayStatusWindow(n)` → `DayStatus[]` for the 30-day strip
  ([04-ui-spec/30day-progress.md](../04-ui-spec/30day-progress.md)).
- `bestPFTAttempt(standardId, event, withinDays)` → `PFTAttempt | undefined`
- `pftGradeForBest(standardId, event, withinDays)` → grade letter
- `detectAbsences(journal, activeHours, threshold)` →
  `AbsenceEntry[]` (pure; consumed on resume to commit rollups).

Each is a pure derivation over journal + pft store, mirroring
the existing `stats.ts` pattern.
