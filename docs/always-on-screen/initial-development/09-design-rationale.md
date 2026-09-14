# Design Rationale

The WHY ledger. Initial documentation pass produced 19 docs that
covered container, ambient discipline, and journal contract well
but under-specified the **content, the deadline arc, and the act
of actually running the time trial.** This doc records the
inferred WHY behind the operator's brief, the misalignments the
first pass exhibited, and where each issue now lives in the
refactored canonical docs.

Read this when you want to know *why* a design choice was made,
not *what* it currently is. For the latter, follow the reading
order in [README.md](README.md).

## The inferred WHY (one paragraph)

The operator silos in deep work for 6–15 hours a day. The body decays
silently across that window. There is a **fixed one-month deadline**
("get fit for summer"), a **specific performance target** (7-minute
miles, 3-mi sub-21), and a **measurable grading lens** (the whiteboard
3-mi table plus selected branch PFTs). The tablet is the only object
that can mediate behavior across deep-work sessions because the
phone is locked away, the watch isn't worn, and a human coach isn't
in the room. Therefore the dashboard's job is **fitness compliance
delivered as desk-ambient gamified UX**, not "another reminder
system."

## Strengths of the existing docs

- ✅ The interaction state machine (queued → active → resolved/ignored)
  matches the "respect deep work, log misses, don't re-ping" rule.
- ✅ Time-to-respond as a first-class metric directly answers the
  operator's stated request to know "how long it took for me to
  click anything."
- ✅ Element coherence with existing app + pentagram metaphysics
  preserved.
- ✅ Verification flags on every standards table — refused to ship
  fabricated numbers.
- ✅ Wake-lock / FGS / battery-aware fallbacks are specified.

## Misalignments resolved by this refactor

Each numbered item below names the original misalignment and the
doc that now resolves it.

### M-1 — PFT was scoped to Phase 3
The summer deadline is the operator's actual problem. Putting goal
tracking in Phase 3 means MVP ships without the only number that
matters. **Goal panel + run-attempt logging belongs in Phase 1.**

### M-2 — "Quiet hours" is the wrong abstraction
The operator works irregular hours, including late. A fixed-window
quiet bracket is a phone-app default, not a desk-mediator design.
The right model is **Active Hours** — operator declares when the
tablet is allowed to actively page them; outside that window, the
surface goes silent and ignores aren't shamed.

### M-3 — No pulse content catalog
The docs spec the *container* (NowCard) but never enumerate what a
pulse actually *says*. "Breathe & stand · 60s" appears once as an
example. There is no list of the ~30 micro-actions the operator
will see across a day, mapped to elements, durations, and
appropriate hour-of-day windows.

### M-4 — No 30-day periodization
A summer deadline implies a 4-week training arc with deload, not
a flat daily schedule. The plan editor today schedules pulses by
element/cadence — fine for ambient pings — but says nothing about
"Tue is upper-body day, Sat is the time-trial, Wed is deload."
Without a periodization layer, the Goal Panel will track an
impossible-to-improve number.

### M-5 — No run-attempt UX
The whole point is to time a 3-mile run, but the docs say "manual
entry only." Manual entry of MM:SS is fine for *recording* a result;
it's not how the operator will actually run the trial. A tablet
sitting on the desk needs a giant **START / STOP** mode that the
operator can trigger before walking out the door, with elapsed time
read at 1.5 m. Maybe even resume across screen-lock.

### M-6 — No absence-and-resume model
The operator said "I might be outside for a few hours" or "asleep
and forgot to turn off the tablet." The pulseQueue invariants
silently log everything as `ignored` during a 4-hour absence. The
dashboard should detect absence (no taps for ≥ N minutes spanning
≥ M pulses) and present a **welcome-back summary** instead of a
wall of ignored entries. Gap is acknowledged, not punished.

### M-7 — Activity log is today-only
The operator wants to "keep track of what I've done." Today-only
is wrong for a 30-day deadline. A second view — **30-day strip
heatmap** — should sit on the dashboard or one tap away.

### M-8 — Streak pill contradicts P-8 ("no streak shame")
Phase 2 introduces a streak pill. P-8 says don't lead with miss
counts. A streak pill is celebratory when it's high but inherently
miss-shaming when it breaks back to zero. Either the pill is
purely additive (+1 today) or it doesn't exist. Specify.

### M-9 — Onboarding/first-run is undefined
The docs assume an already-configured plan and an already-selected
PFT standard. First-launch from a blank slate is unspecified.

### M-10 — No tablet-battery-health note
A tablet plugged in 24/7 sitting on a desk degrades to a swollen
brick if held at 100% continuously. Worth a paragraph on charge
discipline (e.g. Samsung's "Protect Battery" cap at 80%).

### M-11 — Insights v1 not extended in the plan
Insights v1 just shipped in code. The AOS docs reference adherence
math but don't say which Insights deltas are needed (e.g. anchor
trend, distribution of time-to-respond by hour-of-day). Should be
a one-line backlog tag against existing Insights, not a re-write.

### M-12 — Element-to-action mapping is implicit
Fire = "Power & Conditioning" is in the elements file but never
formally bound to actions. AOS docs say "an Air pulse fires a
breathing action" — implicit only. Explicit table needed:
run = fire/conditioning; plank = earth/core; hydration = water;
breath = air; integration/posture-check = heart.

### M-13 — Branch verification gating Phase 3 is over-cautious
For the operator's actual use case (USAF + USMC + personal table),
two branches matter. Holding all of Phase 3 against verification
of USSF/USN/USA standards is cargo. The verification gate should
apply per-table, not as a global Phase 3 lock.

## Gaps (things never mentioned)

- G-1 — **Posture as a chronic problem**, not just an Air pulse.
  The operator is at the desk with monitors *above* the tablet,
  meaning neck-up posture. Deserves its own dedicated lane.
- G-2 — **Hydration**, surprisingly absent. Water-element pulses
  aren't enumerated.
- G-3 — **Eye breaks** (20-20-20 rule) — high-value low-cost desk
  intervention.
- G-4 — **Sleep data** entirely absent. The operator sleeps with the
  tablet sometimes on. Sleep timing inflects fitness gains over a
  4-week arc; even rough self-reported "to bed at" stamps would
  feed the periodization layer.
- G-5 — **Voice cues** (TTS) — operator may want spoken cues
  ("stand up, breathe twice") instead of/in addition to chord tones,
  especially when looking at a monitor not the tablet.
- G-6 — **Camera-glance avoidance**: the tablet center bottom of the
  monitor stack puts the tablet camera directly at the operator's
  chest. Document that the surface never asks for camera permission.
  Reassurance, not a feature.
- G-7 — **Pomodoro-style work tracking** — the operator's work
  rhythm is implicit input to when pulses should fire. Not in scope
  to track work blocks, but the dashboard should be aware that a
  pulse at minute 45 of a focus block is more disruptive than at
  minute 5.
- G-8 — **Multi-user shielding** — if the tablet is in a household,
  someone else interacting with it triggers tap events. Not a
  concern for the dev workstation, but worth a one-line note.

## Verdict

The original docs nailed the **container, ambient discipline, and
journal contract.** They under-specified the **content, the
deadline arc, and the act of actually running the time trial.**
The refactor closed those gaps and re-ordered the phasing so the
MVP delivers operator value against the summer deadline, not just
architecture.

The revised plan landed in this refactor closes those gaps and
re-orders the phasing so the MVP delivers operator value against
the summer deadline, not just architecture. Concrete homes:

- [01-requirements/active-hours.md](01-requirements/active-hours.md) — replaces FR-6.3 quiet-hours.
- [01-requirements/pulse-catalog.md](01-requirements/pulse-catalog.md) — the actual content.
- [03-architecture/periodization.md](03-architecture/periodization.md) — the 4-week arc.
- [03-architecture/absence-resume.md](03-architecture/absence-resume.md) — gap handling.
- [04-ui-spec/run-attempt-mode.md](04-ui-spec/run-attempt-mode.md) — timing the trial.
- [04-ui-spec/30day-progress.md](04-ui-spec/30day-progress.md) — deadline-aware visualization.
- [04-ui-spec/onboarding.md](04-ui-spec/onboarding.md) — first-launch flow.
- [05-roadmap/phase-1a-ambient-spine.md](05-roadmap/phase-1a-ambient-spine.md) — reflowed Phase 1A.
- [05-roadmap/phase-1b-goal.md](05-roadmap/phase-1b-goal.md) — new Phase 1B (PFT moves up).
- [05-roadmap/phase-2-content-discipline.md](05-roadmap/phase-2-content-discipline.md) — Phase 2 rewritten.
- [05-roadmap/phase-3-expansion.md](05-roadmap/phase-3-expansion.md) — Phase 3 reduced to optional.

## 2026-09-14 — "I have to check around too much"

The operator reviewed the built app against their real use: a phone beside
the monitors, a chime, a small set, one tap. The app was organised around
the five-element metaphor rather than those jobs — 31 tabs, three stores
for a "done" that no screen read together, controls that did nothing,
about 71 chimes a day, and balance that only happened if the operator chose
to visit other elements (they admitted sticking to Fire).

They chose to keep the element rail but make Heart › Today the home, cut
Heart to Today · Progress · Setup and the elements to Drills · Train ·
History, read every count from one activity model, chime about twenty
times a day as Daily Sets rounds with partner drills from other elements
(water riding along), keep one editable My day window, say "Done"
everywhere, and leave the PFT content as it is. Balance now arrives with
the chimes instead of by navigation. See [10-today-home.md](10-today-home.md).
