# Interaction States

The state machine governing what each pulse is doing at any moment,
and how operator input transitions it.

## Pulse lifecycle

```
                       outside active hours / manual-pause
            ┌────────┐  ─────────────────────────────────▶ ┌────────────┐
  Scheduled │ queued │                                     │ suppressed │
            └────────┘  cue fires      ┌─────────┐         └────────────┘
                  │ ───────────────────▶│ active  │
                  │                     └─────────┘
   plan edit      │                     │ │ │ │
   → cancelled    │           Done ◀────┘ │ │ │
            ┌────────┐         Skip ◀─────┘ │ │
            │cancelled│      Snooze ◀───────┘ │
            └────────┘    (window expires) ◀──┘                ┌──────────┐
                                            │  ───covered─by──▶│ absorbed │
                                            ▼   absence-window └──────────┘
                                       ┌─────────┐                  │
                                       │ resolved│                  ▼
                                       └─────────┘            counted-out
```

## States

### `queued`
Scheduled pulse, time-to-fire > 0. Visible in upcoming strip.
No interaction possible except *preview* (FR-3.3).

### `active`
Cue has fired. The now-card occupies the primary zone. Big targets
visible. Window timer counts down (default 8 min; operator-tunable
per plan window).

### `resolved.completed`
Operator tapped **Done**. Posts `CompletionEntry`.
Records time-to-respond.

### `resolved.skipped`
Operator tapped **Skip**. Posts `reminder.skipped`. Records
time-to-respond.

### `resolved.snoozed`
Operator tapped **Snooze 5m**. Pulse re-queues for +5 min, max one
snooze per pulse. Original fire-time and snooze-delta both logged.

### `resolved.ignored`
Active window expired with no operator input. Posts
`reminder.ignored` with `time-to-respond = null`. **Does not re-fire**.

### `cancelled`
Plan was edited (FR-7.1) so that this pulse is no longer scheduled,
or the operator left the surface and the device locked before the
fire-time. Not logged.

### `suppressed`
Fire-time fell outside active hours, or a manual pause was active.
Posts `reminder.suppressed` with reason. **Excluded from adherence
math** (numerator and denominator). Activity log shows a single
day-rollup row, not individual entries.

### `absorbed`
A `resolved.ignored` pulse may be retroactively marked
`absorbedBy: <absenceId>` when an absence-detection pass identifies
the operator was away during the active window. The original
`reminder.ignored` entry is preserved; the `absorbedBy` flag
removes the pulse from adherence math but keeps the audit trail.
See [absence-resume.md](../03-architecture/absence-resume.md).

## Outcome enum (denormalized to journal)

| Enum value             | Posted by         | counts toward `completed`? | counts toward `scheduled`? |
| ---------------------- | ----------------- | -------------------------- | -------------------------- |
| `completion`           | Done tap          | yes                        | yes                        |
| `reminder.skipped`     | Skip tap          | no                         | yes                        |
| `reminder.snoozed`     | Snooze tap        | n/a (informational)        | n/a                        |
| `reminder.ignored`     | Window expiry     | no                         | yes\*                      |
| `reminder.suppressed`  | Outside active hrs / manual pause | no             | no                         |
| `reminder.fired`       | Cue fire          | n/a (informational)        | yes                        |
| `journal.absence`      | Absence detector  | n/a                        | n/a (rollup)               |

\* `reminder.ignored` is excluded from the day's denominator when
`absorbedBy` is set (covered by an absence rollup) — FR-9.4.

## Time-to-respond field

A first-class metric. Captured as `respondedAfterMs: number | null`
on the resolution journal entry. Insights v2 will surface
distributions ("median time-to-Done by element by hour-of-day").

## Reverse window

Within 60 s of any resolution (FR-9.3), tapping the entry in the
activity log opens a sheet with `Restore` action. Restoration:
- Removes the resolution entry.
- Re-queues the pulse with its original fire-time minus elapsed,
  bounded so it fires immediately.

## State invariants

- **At-most-one** pulse can be in the `active` state at a time. If
  a second pulse's fire-time arrives while one is active, the new
  pulse waits in `queued` until the active one resolves.
- A `snoozed` pulse counts as one consumed slot for the
  at-most-one rule until it re-fires.
- The system never auto-resolves `active` to `completed`. Only the
  operator transitions to `completed` (or system to `ignored`).
- `queued → suppressed` bypasses `active` entirely; suppressed
  pulses never play audio and never demand interaction.
- `absorbed` is post-hoc only; it never blocks the operator from
  acting on a live pulse.
