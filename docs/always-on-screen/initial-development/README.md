# Always-On Screen — Initial Development

The always-on dashboard is RaveLite's **ambient desk-mediator**: a sub-page
purpose-built to live on a tablet sitting at a dev workstation, breaking
through deep-work silos with sound, motion, and big-target check-ins so
the operator actually does the fitness work the rest of the app plans —
in service of a fixed summer deadline.

## Reading order

1. [00-vision.md](00-vision.md) — the felt experience and why
   existing screens don't cover it.
2. [01-requirements/](01-requirements/) — what the surface must do
   ([functional.md](01-requirements/functional.md)), how it must feel
   ([ambient-ux.md](01-requirements/ambient-ux.md)), the full
   pulse-lifecycle state machine
   ([interaction-states.md](01-requirements/interaction-states.md)),
   the active-hours model ([active-hours.md](01-requirements/active-hours.md)),
   and the v1 pulse content catalog
   ([pulse-catalog.md](01-requirements/pulse-catalog.md)).
3. [02-fitness-standards/](02-fitness-standards/) — every PFT scoring
   table the operator wants to track against. **All numbers flagged
   for verification per-table.**
4. [03-architecture/](03-architecture/) — data model
   ([data-model.md](03-architecture/data-model.md)), integration map
   ([integration-map.md](03-architecture/integration-map.md)),
   always-on / wake-lock strategy
   ([always-on-strategy.md](03-architecture/always-on-strategy.md)),
   the 4-week training arc
   ([periodization.md](03-architecture/periodization.md)),
   and absence-and-resume handling
   ([absence-resume.md](03-architecture/absence-resume.md)).
5. [04-ui-spec/](04-ui-spec/) — layout zones
   ([layout.md](04-ui-spec/layout.md)), component contracts
   ([components.md](04-ui-spec/components.md)), the deadline-aware
   30-day strip ([30day-progress.md](04-ui-spec/30day-progress.md)),
   live timed-trial UX ([run-attempt-mode.md](04-ui-spec/run-attempt-mode.md)),
   and first-launch flow ([onboarding.md](04-ui-spec/onboarding.md)).
6. [05-roadmap/](05-roadmap/) — four-phase shipping plan
   (1A spine → 1B goal → 2 content/discipline → 3 expansion) plus
   the extracted task backlog (`AOS-###` IDs).
7. [06-open-questions.md](06-open-questions.md) — binary decisions
   awaiting operator review before code lands.
8. [09-design-rationale.md](09-design-rationale.md) — the WHY behind
   the post-critique refactor. Read after the rest if you want
   the why-and-how-we-got-here narrative.

## Naming

- "Always-On" or "AOS" = the sub-page itself.
- "Operator" = the user. Dev-workstation, age 39, summer fitness goal,
  one month horizon at time of writing.
- "Ping" = the ambient cue the operator should respond to (sound +
  visual + optional haptic).
- "Pulse" = a single fitness reminder fire (existing RaveLite term).
- "Anchor" = a day's main event in the periodization template
  (e.g. Saturday 3-mi trial). Distinct from regular ambient pulses.
- "Active hours" = the operator-declared window during which the
  surface is allowed to actively page. Outside it, pulses suppress
  and don't count against adherence. Replaces "quiet hours."

## Out of scope for this wave

- Cloud sync, multi-device, social/leaderboard features.
- Camera-based form analysis.
- GPS / wearable integration. Mile times come from manual entry
  or run-attempt-mode timing against the scoring tables.
- Companion-watch integration.

## Status

Documentation phase only. No code in this wave. Implementation
phasing defined in [05-roadmap/](05-roadmap/) but gated on operator
review of [06-open-questions.md](06-open-questions.md) — particularly
OQ-1 (placement) and OQ-2/OQ-5 (snooze cap, ignored denominator)
which block UI scaffolding and data-model finalization respectively.
