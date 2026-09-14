# Open Questions

Decisions deferred until operator review. Each question is binary or
small-N to keep the planning wave decisive.

## OQ-1 — Placement

> Does Always-On live as a Heart sub-tab (`aos`) or as a new
> top-level primary tab in the bottom-bar?

- **Sub-tab pros**: keeps element ontology clean (Heart is the
  integrator); no nav redesign.
- **Primary-tab pros**: it's the most-used surface on the desk-mediator
  use case; sub-tab makes it 2 taps to land on.
- **Recommendation**: ship Phase 1 as Heart sub-tab `aos`, promote
  to primary tab in Phase 2 if the operator confirms it's the home
  surface.
- **Status**: `proposed` — Heart sub-tab `aos` for Phase 1A.
  Operator may overturn before Slice 4.

## OQ-2 — Snooze cap

> Is one snooze per pulse the right cap, or should the operator be
> allowed two?

- One forces a real decision; two enables drift.
- Recommendation: one. Settings-tunable to two if requested.

## OQ-3 — Ignored denominator rule

> Should ignored pulses outside any plan window count toward
> "scheduled" in adherence math?

- Refactor sets the rule: pulses outside **active hours** post
  `reminder.suppressed` and are excluded from both numerator and
  denominator. Pulses inside active hours but inside a detected
  absence get `absorbedBy` and are similarly excluded.
- Confirm this matches the operator's mental model before shipping
  ring math. If operator wants ignored-during-active-hours to count
  against them, set `absenceAbsorptionEnabled = false` in settings
  and adjust `adherenceForDay`.
- **Status**: `proposed` — suppressed/absorbed both excluded from
  numerator and denominator; `absenceAbsorptionEnabled` settings
  toggle deferred to Phase 2. Operator may overturn before Slice 3.

## OQ-4 — Cue tone authorship

> Are placeholder tones acceptable for Phase 1, or does the operator
> want bespoke audio before any release?

- Recommendation: ship Phase 1 with simple tonal sine envelopes,
  promote to bespoke in Phase 2.

## OQ-5 — Foreground service text

> Android FGS requires a persistent notification. What text?

- Default: `"RaveLite · Always-On session active. Tap to return."`
- Confirm tone preference (clinical vs. ceremonial).
- **Status**: `proposed` — default text used in Slice 5. Operator
  may overturn before native plumbing lands.

## OQ-6 — Reverse-60s window

> Is 60 s the right reversal grace? Operator may want longer
> (e.g. 5 min) for accidental skips.

- 60 s keeps the activity log honest; 5 min lets the operator come
  back from an interruption to undo. Recommendation: 60 s with a
  Phase-2 setting.

## OQ-7 — Run distance default

> If the operator picks USMC anchor, default attempt distance is
> 3 mi. If USAF, 1.5 mi. If USSF, 2 mi. What about personal-table?

- Default to 3 mi to match the operator's primary goal table.

## OQ-8 — Goal ring "best" definition

> Rolling-30d best, rolling-14d best, or all-time best?

- 30 d balances motivation (recent effort matters) and noise
  (single-attempt luck dampened). Recommendation: 30 d.

## OQ-9 — Active-hours default

> What's the right default active-hours window for the operator's
> dev-silo work pattern?

- Refactor sets default to `09:00–23:00` all days. The operator's
  brief implies dev hours can run late.
- Recommendation: ship with default but make the field easy to
  edit on first run (onboarding step 1) and from the status-strip
  chip (long-press).
- Open: should the daysMask default exclude weekend mornings? Likely
  no — single window, all days, operator tunes per-day if needed.
- **Status**: `resolved` (2026-09-14) — "My day", default 09:00–22:00
  all days, editable from Today's status line and Heart › Setup. It is
  the one window for chimes, spreading rounds and night dimming.

## OQ-10 — Branch verification budget

> How many of the `AOS-V##` verification tasks does the operator
> want to do up-front vs. ship Phase 1B against personal-table only?

- Personal table is operator-authored and ready (Phase 1B default).
- USAF + USMC are operator-relevant given the brief; verifying
  these two unlocks Phase 2 standards work for the operator's
  actual use case.
- USSF / USN / USA can stay deferred to Phase 3.
- SEAL / Spetsnaz: ship as "popular benchmark" with disclaimer if
  canonical sources resist verification.
- Verification gate is **per-table**, not phase-wide, after the
  refactor.

## OQ-11 — Audio under DND

> Should the cue tone bypass DND when the surface is foregrounded
> (operator's intent is to be interrupted)?

- Android allows category-flagged "alarm" sounds to pierce DND. Risk:
  surprises if the operator forgot the surface is open and DND was on
  for a meeting.
- Recommendation: respect DND by default; add a settings toggle
  "Pierce DND when Always-On is foreground" for operators who want
  the harder commitment.
- **Status**: `resolved` (2026-09-14) — the operator chose the harder
  commitment by default: cues play on the alarm audio stream and cut
  through silent mode and DND during active hours. Heart › Settings ›
  Chimes has a "Respect Do Not Disturb" toggle (off by default) that
  hands DND back to the OS.

## OQ-12 — Scope creep guard

> The integration map mentions a `circuits` deep-link from a pulse.
> Should circuits launch be in Phase 1A MVP or Phase 2?

- Phase 1A keeps scope tight: pulses surface as actions, circuits
  remain reachable from the Heart > Circuits sub-tab.
- Phase 2 can add the pulse-launches-circuit deep link.
- **Status**: `resolved` (2026-09-14) — circuits launch from Today ›
  Practice (Pentagram and saved circuits); the Circuits tab is gone.

## OQ-13 — Onboarding deferability

> Should onboarding ship in Phase 1A or wait for Phase 2?

- Refactor places it in Phase 2 because Phase 1A has no goal panel
  to onboard *to*. In Phase 1A the operator hand-configures
  active-hours via the (read-only-in-1A) chip; the only thing
  required is the FGS permission ask, which can be a single dialog
  on first AOS launch rather than a 6-step flow.
- Confirm: is single-dialog OK for 1A, or does the operator want
  the full onboarding immediately?
- **Status**: `proposed` — single FGS-permission dialog only in
  Phase 1A; full onboarding flow lands in Phase 2 as AOS-122.
  Operator may overturn before Slice 5.

## OQ-14 — Daily chime load

> How many chimes a day can the operator actually answer?

- **Status**: `resolved` (2026-09-14) — about twenty. Daily Sets chime as
  rounds of a few moves with a partner drill (about nine a day) instead of
  one set per chime; the default plan drops Desk Hours and Morning
  Training. Guarded by `chimeBudget.test.ts`.

## OQ-15 — Done button label

> Element verbs (Ignite, Inhale, Root, Flow, Seal) or one word?

- **Status**: `resolved` (2026-09-14) — "Done" everywhere, in the app and
  on notifications; element colour and glyph carry the flavour.

## OQ-16 — Water calls

> Should water calls chime on their own?

- **Status**: `resolved` (2026-09-14) — a water call within 20 minutes of a
  round rides along as that round's glass; otherwise it chimes alone.
  Glasses from chimes, ride-alongs and Today's +1 all count.
