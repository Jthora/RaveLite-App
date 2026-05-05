# Functional Requirements

Numbered for traceability into [05-roadmap/task-backlog.md](../05-roadmap/task-backlog.md).

## FR-1 — Surface presence

- **FR-1.1** Always-On is a top-level sub-page reachable from the
  bottom navigation (likely the existing Heart sub-tab strip, but
  may warrant promotion to a primary tab — see open questions).
- **FR-1.2** Entering the page transitions the device into a
  "session mode" that keeps the screen awake while the page is
  foregrounded and the device is plugged in.
- **FR-1.3** Leaving the page restores normal screen-timeout
  behavior immediately.
- **FR-1.4** Power-button press (manual screen lock) ends the
  session cleanly. On unlock, the operator is returned to the
  same Always-On state without the app having needed to run as
  a background service.

## FR-2 — The "now" card

- **FR-2.1** At any moment, exactly one card occupies the primary
  zone of the screen.
- **FR-2.2** When a pulse is scheduled and within its trigger
  window, the card shows the prescribed action: title, element,
  duration, optional bullet cues.
- **FR-2.3** When idle, the card shows a countdown to the next
  scheduled pulse and the operator's current daily score.
- **FR-2.4** The action card MUST present three response targets
  sized for sloppy taps from 1–2 m away: **Done**, **Skip**,
  **Snooze 5m**. Minimum target size: 96 dp on each side.

## FR-3 — Upcoming list

- **FR-3.1** A persistent strip shows the next 3–5 scheduled items
  with element glyph, label, and ETA.
- **FR-3.2** Items shift left/down as time passes; no manual refresh.
- **FR-3.3** Tapping an upcoming item previews its action card
  without firing the pulse.

## FR-4 — Activity log

- **FR-4.1** Today's responses are visible without leaving the page,
  newest-first, with timestamp + element + outcome.
- **FR-4.2** Outcome enum: `completed`, `skipped`, `snoozed`,
  `ignored`, `auto-completed` (if the system can verify, e.g. a
  posture timer that runs to completion).
- **FR-4.3** Each entry records **time-to-respond** in seconds:
  delta between ping fire and the operator's tap. `ignored` entries
  store `null` for time-to-respond.
- **FR-4.4** Tapping an entry opens its detail sheet (full cue text,
  related plan window, options to reverse status within 60s).

## FR-5 — Score & rings

- **FR-5.1** A primary daily-adherence ring fills as
  `completed / scheduled-so-far`.
- **FR-5.2** Per-element mini-rings sit beside the primary ring,
  matching pentagram order.
- **FR-5.3** A second ring tracks the active **PFT goal of the
  week** (e.g. *3-mile time trial under 24 minutes*) — see
  [02-fitness-standards/](../02-fitness-standards/).

## FR-6 — Sound, motion, active hours

- **FR-6.1** Each element has a distinct cue-sound (≤1.2 s).
- **FR-6.2** Cue volume is independently adjustable (0–100%) and
  persists per device.
- **FR-6.3** **Active hours** define when the surface may page the
  operator. Outside the active-hours window, scheduled pulses post
  `reminder.suppressed` and are excluded from adherence math (they
  are not "missed"). Default `09:00–23:00`, operator-editable, with
  per-day-of-week mask. See [active-hours.md](active-hours.md).
- **FR-6.4** Operator may invoke a **manual pause** (default 1 h)
  from the status strip. During pause, pulses post
  `reminder.suppressed` with reason `manual-pause`.
- **FR-6.5** While the now-card is active, the screen pulses the
  element accent at ~0.4 Hz to remain glanceable across the room
  without being a strobe.
- **FR-6.6** When idle and unattended, the screen rests at <10%
  apparent luminance to avoid bleeding into peripheral vision.

## FR-7 — Cross-app integration

- **FR-7.1** Pulses originate from the existing reminder plan; the
  Always-On surface does not own scheduling.
- **FR-7.2** A "Done" tap on Always-On posts the same
  `CompletionEntry` that the existing journal infrastructure
  already understands.
- **FR-7.3** A "Skip" tap posts a new journal entry kind
  (`reminder.skipped`) consumable by Insights.
- **FR-7.4** A pulse with no response within its window posts a
  `reminder.ignored` entry once the next pulse fires (or at end
  of window) and is excluded from the day's denominator only if
  the operator was outside any plan window.
- **FR-7.5** Engaging a circuit from Always-On launches the existing
  `CircuitChamber` and returns to Always-On on completion.

## FR-8 — PFT goal (Phase 1B)

- **FR-8.1** A **PFT goal panel** binds the dashboard to a chosen
  anchor event + standard. The personal 3-mi table is the default;
  branch standards (USAF, USMC, etc.) are opt-in and labeled
  `(preview)` until verified per-table. See
  [05-roadmap/phasing-and-verification.md](../05-roadmap/phasing-and-verification.md).
- **FR-8.2** A **deadline date** is part of the goal. The status
  strip shows days-remaining at all times the goal is active.
- **FR-8.3** A **30-day progress strip** visualizes the arc on the
  surface itself. See [04-ui-spec/30day-progress.md](../04-ui-spec/30day-progress.md).
- **FR-8.4** A weekly **anchor day** (typically Saturday for the
  3-mi trial) surfaces a TRIAL card; the trial uses
  [run-attempt mode](../04-ui-spec/run-attempt-mode.md) for live
  timing rather than manual entry.
- **FR-8.5** Non-trial attempts (rep events, trial results from
  outside the dashboard) are entered via `<LogAttemptSheet />`.
- **FR-8.6** All attempts grade against the active standard's
  lookup table; grading is pure (`grade(time, distance, standard)`).

## FR-9 — Operator hygiene

- **FR-9.1** No hidden state. All scheduling visible from this page.
- **FR-9.2** No "streak shame." UI never highlights miss-counts; a
  miss log is available but never the headline.
- **FR-9.3** Reversibility: any single response is reversible within
  60 seconds via the entry's detail sheet.
- **FR-9.4** **Absence is first-class.** A detected operator-away
  gap (≥ 2 consecutive ignored pulses spanning ≥ 45 min) collapses
  to a single `journal.absence` rollup, the affected pulses are
  marked `absorbedBy` the absence, and they are excluded from
  adherence math. On return, a welcome-back card briefly replaces
  the now-card (matter-of-fact tone, no apology, no scolding). See
  [03-architecture/absence-resume.md](../03-architecture/absence-resume.md).

## FR-10 — Onboarding

- **FR-10.1** First launch presents a guided onboarding flow that
  resolves: active-hours, anchor goal + deadline, daily plan seed,
  optional 4-week periodization template, and FGS permission. See
  [04-ui-spec/onboarding.md](../04-ui-spec/onboarding.md).
- **FR-10.2** Active-hours is the only non-skippable step; without
  it the suppression model has no anchor.
