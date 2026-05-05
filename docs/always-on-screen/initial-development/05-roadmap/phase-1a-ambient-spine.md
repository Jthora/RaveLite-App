# Phase 1A — Ambient Spine

The minimum viable surface: the page exists, pulses fire, the
operator can resolve them, the journal sees the new outcomes.

## Goal

The operator can leave the tablet on the desk during a normal dev
session and respond to scheduled pulses without leaving the page or
context-switching to the rest of the app.

## In scope

- New top-level page (assume Heart sub-tab `aos` for v1; OQ-1).
- `<NowCard />` with idle + active states.
- `<UpcomingStrip />` driven by the existing plan.
- `<ActivityLog />` for today only, with reverse-60s.
- `<AdherenceRings />` (today's totals, no anchor goal yet).
- Wake-lock when foregrounded **and** plugged in.
- Audio cue per element (placeholder tone each).
- Foreground-service notification on Android.
- New journal kinds: `reminder.fired`, `reminder.skipped`,
  `reminder.snoozed`, `reminder.ignored`.
- New stats helpers: `adherenceForDay`, `timeToRespondPercentile`.
- Active-hours model wired (default `09:00–23:00`, all days),
  including `reminder.suppressed` writes outside the window. See
  [../01-requirements/active-hours.md](../01-requirements/active-hours.md).

## Out of scope (Phase 1A)

- PFT goal panel (Phase 1B).
- Run-attempt mode (Phase 1B).
- 30-day progress strip (Phase 1B).
- Bespoke per-element cue tones (Phase 2).
- Pulse content catalog implementation (Phase 2).
- Periodization template (Phase 2).
- Absence detection + welcome-back (Phase 2).
- Onboarding flow (Phase 2).

## Acceptance

- Open AOS, leave it on the desk for a 90-min plan window with two
  scheduled pulses inside active hours.
- Both pulses fire with audio + visual.
- Operator taps Done on one, ignores the other.
- Tablet remains awake throughout (plugged in).
- Activity log shows: 1 completed, 1 ignored, with timestamps and
  time-to-respond on the completed entry.
- A pulse scheduled outside active hours posts `reminder.suppressed`
  silently and does **not** appear as a missed entry.
- Insights view picks up the new outcomes correctly (counts adjust).
- Phone lock + unlock returns to the same AOS state without crash.

## Test matrix

- Plug-in / on-battery transitions.
- Page foreground / background transitions.
- App killed by Android (Doze) — the next OS notifee notification
  should still fire and the resume should hydrate the AOS log.
- Multiple pulses arriving within 30 s of each other (queue invariant).
- Active-hours boundary fires (pulse at 22:59 fires; pulse at 23:01
  suppresses).
