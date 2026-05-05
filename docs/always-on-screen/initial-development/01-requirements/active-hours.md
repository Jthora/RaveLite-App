# Active Hours (replaces "Quiet Hours")

The single declared window during which the tablet is allowed to
actively page the operator. Outside the window, the surface is
silent, ignores are not counted, and the dashboard idles to
preserve battery + display.

## Why this replaces quiet-hours

A quiet-hours bracket assumes a regular sleep schedule and a
phone-style "do not disturb." The operator's reality:

- Dev silos can run past midnight.
- The operator may be asleep with the tablet still on the desk.
- The operator may be away from the desk for hours during waking
  hours (errands, real-life).

A single active-hours range captures all three correctly:

- **Outside active hours, audio is muted, visual cues are dim, and
  any pulse that would have fired logs `reminder.suppressed`** —
  not `ignored`. Doesn't enter the "ignored" denominator.
- **Inside active hours, normal behavior.** Ignored pulses log
  `ignored` and surface in the activity log.

## Data model

```ts
interface ActiveHours {
  /** Local time, "HH:MM". */
  start: string;
  /** Local time, "HH:MM". May be < start (e.g. 09:00 → 02:00 next day). */
  end: string;
  /** Day-of-week mask. Default: all 7 days. */
  daysMask: number;  // bit 0 = Mon ... bit 6 = Sun
}
```

Stored under `KEYS.activeHours`. Default: `{ start: '09:00',
end: '23:00', daysMask: 0b1111111 }`.

## New journal kind

Add to the union:

```ts
type ReminderSuppressedEntry = {
  kind: 'reminder.suppressed';
  id: string;
  at: number;
  pulseId: string;
  reason: 'outside-active-hours' | 'battery-saver' | 'manual-pause';
};
```

`suppressed` entries appear in the activity log under a single
day-rollup row ("⌀ 4 pulses suppressed · outside active hours")
rather than as individual entries — to keep the log signal-rich.

## Manual pause

Operator long-presses a "PAUSE 1H" target on the status strip when
they're stepping away. Stores `KEYS.manualPauseUntil` epoch ms.
Pulses fired during the pause window log `reminder.suppressed`
with reason `manual-pause`. Auto-cleared when reached.

## Settings UI

Active-hours edit lives in:

1. The onboarding flow (first-launch sets a default).
2. A small chip on the status strip ("active 09:00–23:00") that
   opens an inline range editor.

No separate quiet-hours setting exists.

## Sound + motion behavior

| State                     | Audio | Haptic | Visual cue | Counts toward scheduled? |
| ------------------------- | ----- | ------ | ---------- | ------------------------ |
| Inside active hours       | yes   | yes    | full       | yes                      |
| Outside active hours      | no    | no     | dim only   | no                       |
| Manual pause (active hrs) | no    | no     | dim only   | no                       |
| Battery saver (active)    | yes   | yes    | reduced    | yes                      |

## Adherence math impact

`adherenceForDay(d)` excludes `reminder.suppressed` from both the
numerator and denominator. The day's ring fills proportionally
to *what was paged within active hours*, which is the only thing
the operator can fairly be measured against.

## Cross-doc supersedes

- Originally specified "quiet hours" in
  [`functional.md`](functional.md) FR-6.3 is replaced by this model.
- Phase 2 task AOS-103 ("Implement quiet-hours window") becomes
  AOS-104 ("Implement active-hours model + manual pause") in the
  refactored backlog.
- The state machine in
  [`interaction-states.md`](interaction-states.md) gains a
  transition: `queued → suppressed` whenever fireAt falls outside
  active hours, bypassing `active`.
