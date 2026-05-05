# Phase 1B — Goal Front-and-Center

The deadline-aware spine. The operator's actual problem is the
summer fitness deadline; this phase is what turns the page from
"a beautiful reminder system" into "the dashboard for the deadline."

## Goal

The operator can leave the tablet on the desk, get pulses across
the day, log a Saturday 3-mile run via run-attempt mode, and watch
the deadline countdown plus best-of-30d grade move toward target.

## Prerequisites

- Phase 1A shipped.

## In scope

### Goal infrastructure
- Personal 3-mi grading table → pure `gradeFor3Mi(seconds)` fn.
  No verification gate (operator-authored).
- `PFTAttempt` storage + CRUD.
- `bestPFTAttempt(rolling30d)` helper.
- `pft.goal` storage (`{ event, target, deadlineISO }`).

### UI
- `<PFTGoalPanel />` v1, right-rail. Personal table only.
- `<LogAttemptSheet />` v1. Time + rep keypads.
- `<DeadlineCountdown />` chip on the status strip.
- `<ThirtyDayStrip />` directly under the status strip; see
  [../04-ui-spec/30day-progress.md](../04-ui-spec/30day-progress.md).
- `<RunAttemptScreen />` for live timed trials; see
  [../04-ui-spec/run-attempt-mode.md](../04-ui-spec/run-attempt-mode.md).

### Persistence
- `RunAttemptInProgress` survives reboot. Resume-or-discard prompt
  on relaunch when an in-flight attempt is detected.

## Out of scope (Phase 1B)

- Pulse content catalog (Phase 2).
- Periodization template (Phase 2).
- Branch standards (Phase 2 for USAF/USMC; Phase 3 for the rest).
- Voice cues (Phase 3).
- GPS / wearable integration (never).

## Acceptance

- Operator opens AOS on a Saturday. The PFT goal panel shows
  `Goal · 21:00 · grade B+` with `Best (30d) · 22:30 · B`.
- Operator taps **START ▶︎** on the trial card.
- The surface enters run-attempt mode with a 96-sp timer running.
- Operator goes for a run; tablet screen-locks during the run.
- Operator returns, unlocks, the timer is still running with no
  time loss.
- Operator taps **STOP**. Review card shows `21:48 · grade B+`.
- Operator commits. Activity log gets a `pft.attempt` entry.
- Best-of-30d updates to 21:48; grade chip updates to B+.
- Deadline countdown chip on the status strip shows `21 d`.
- 30-day strip's today cell turns into a trial-day glyph with the
  result.

## Test matrix

- Run-attempt resume across screen-lock.
- Run-attempt resume across app kill (persisted in-flight).
- Run-attempt discard (no journal write).
- Lap recording for 3-lap and 12-lap configurations.
- Manual log of an attempt that happened off-tablet.
- Deadline countdown crossing midnight.
- 30-day strip rendering with 0, partial, and full history.
