# Phase 2 — Content & Discipline

The dashboard now does its job; this phase makes it good company.
Adds the *content* (what pulses actually say), the *arc* (4-week
periodization), and the *discipline* (active-hours editor, absence
handling, real cue tones, onboarding).

## Goal

The operator can glance at the tablet from across the desk and
instantly read the day's progress; sound and motion are tuned so
the surface is genuinely ambient rather than disruptive; pulses
say specific, varied, well-fit micro-actions; the 4-week arc is
visible end-to-end.

## Prerequisites

- Phase 1A + 1B shipped.

## In scope

### Pulse content
- Implement the v1 catalog of micro-actions per element. See
  [../01-requirements/pulse-catalog.md](../01-requirements/pulse-catalog.md).
- Scheduler picks catalog entries respecting element, hour-window,
  cooldown, and intensity.
- Periodization-aware overrides (anchor day uses preferred ids).

### Periodization template
- `PlanTemplate` storage + helpers.
- 4-week template installer (Mon–Sun anchors with deload Week 4).
  See [../03-architecture/periodization.md](../03-architecture/periodization.md).
- Anchor catalog entries (`anchor.run3mi-easy`, `anchor.run-intervals-5x400`,
  `anchor.run3mi-trial`, `anchor.upper-block`, `anchor.mobility`,
  `anchor.recovery-walk`).
- "Today's Anchor" card at top of PFT goal panel.
- Week-strip glyphs in the goal panel.

### Sound design
- Bespoke per-element cue tones (replace v1 placeholders).
- Master + per-element volume sliders.

### Active-hours UX
- Inline editor on the status-strip chip.
- Per-day-of-week mask in settings.
- Manual pause (default 1 h, tunable 15 min / 1 h / 4 h).

### Absence + resume
- `detectAbsences()` runs on dashboard re-foreground and on a
  lightweight FGS tick.
- `journal.absence` rollups posted; affected `reminder.ignored`
  entries marked `absorbedBy`.
- `<NowCard state="welcome-back" />` briefly displaces idle on
  return-to-foreground after a closed absence > threshold. See
  [../03-architecture/absence-resume.md](../03-architecture/absence-resume.md).
- Activity log collapses absorbed entries under absence rollups.

### Onboarding
- First-launch flow per
  [../04-ui-spec/onboarding.md](../04-ui-spec/onboarding.md).
- Active-hours / goal / plan-seed / periodization-offer / FGS-permission.
- Re-runnable from settings.

### Motion polish
- 0.4 Hz element-accent pulse on active card.
- Idle low-luminance background mode (≤ 10% apparent luminance).
- Smooth state transitions (250 ms fades on idle ↔ active).

### Operator-tunable behavior
- Snooze duration override (default 5 min, tunable 3/5/10).
- Window-expiry timeout per plan window (default 8 min, 3–15).
- Settings sheet documenting Android OS quirks (battery saver,
  sleeping apps, DND).

### Branch standards (operator-relevant only)
- USAF (35–39 male) standard tables, ⚠ shipped per-table verification.
- USMC (36–40 male) standard tables, ⚠ shipped per-table verification.
- "(preview)" labeling on UI when a chosen standard's table has not
  yet been verified.

## Out of scope (Phase 2)

- USSF / USN / USA standards (Phase 3).
- Elite badges (Phase 3).
- Voice (TTS) cues (Phase 3).
- Sleep self-report + periodization input (Phase 3).
- Pomodoro-aware pulse timing (Phase 3).

## Acceptance

- Operator runs onboarding from a fresh install. Lands on idle
  screen in < 90 s with active-hours, goal, plan, and FGS configured.
- A regular pulse fires at 14:30 with the catalog action `air.box4`
  (60 s box breathing). Cooldown prevents a repeat for ≥ 90 min.
- Saturday's surface shows the trial anchor and prompts run-attempt
  mode directly from the goal panel's "Today's Anchor" card.
- Operator vanishes for 3 hours during active hours. On return, a
  welcome-back card surfaces; activity log shows the absence rollup;
  adherence ring is unaffected by the gap.
- USAF tab in goal panel works for the 35–39 male table; USMC tab
  works for the 36–40 male table; both show no `(preview)` badge.

## Test matrix

- Catalog cooldown enforcement.
- Active-hours boundary at the per-day-of-week level.
- Manual pause persistence across app kill.
- Absence detection at 2-pulse and 5-pulse gaps.
- Onboarding re-run does not destroy journal data.
- Periodization template install with deadline < 28 days
  (Week 4 deload compresses).
