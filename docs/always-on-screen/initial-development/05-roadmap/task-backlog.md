# Task Backlog

Extracted task items, ID-prefixed for tracking. Phase tags reflect
the post-refactor phasing (Phase 1A spine → 1B goal → 2 content/
discipline → 3 expansion).

## Phase 1A — Ambient Spine

| ID      | Task                                                        | Notes |
| ------- | ----------------------------------------------------------- | ----- |
| AOS-001 | Decide AOS placement (Heart sub-tab vs. primary tab)        | OQ-1 |
| AOS-002 | Scaffold `src/screens/AlwaysOnScreen.tsx` with zone layout  | Landscape-first |
| AOS-003 | Scaffold `src/domain/ambient/` module set                   | `pulseQueue`, `tones`, `session`, `types` |
| AOS-004 | Extend `JournalEntry` union with `reminder.*` kinds         | Includes `reminder.suppressed` |
| AOS-005 | Extend `CompletionEntry` with `pulseId`, `respondedAfterMs`, `'always-on'` source | Optional fields |
| AOS-006 | Build `<NowCard />` idle state                              | Countdown + today summary |
| AOS-007 | Build `<NowCard />` active state                            | Headline · ring · 3 CTAs |
| AOS-008 | Build `<UpcomingStrip />`                                   | Reads from `expandPlan` |
| AOS-009 | Build `<ActivityLog />` with reverse-60s                    | New kinds renderable |
| AOS-010 | Build `<AdherenceRings />`                                  | Total + 5 element |
| AOS-011 | Implement pulseQueue state machine                          | At-most-one-active |
| AOS-012 | Wire pulse fire → journal `reminder.fired` write            | At cue trigger |
| AOS-013 | Wire Done/Skip/Snooze taps → journal resolution writes      | Resolution enum |
| AOS-014 | Window-expiry → `reminder.ignored` write                    | No re-fire |
| AOS-015 | Add `adherenceForDay` and `timeToRespondPercentile` to stats | Pure derivations |
| AOS-016 | Integrate `react-native-keep-awake` (or peer)               | Plug-in gated |
| AOS-017 | Integrate `react-native-sound` for cue tones                | One placeholder per element |
| AOS-018 | Add Android foreground service for Live mode                | Manifest + channel |
| AOS-019 | Active-hours storage + suppression write path               | Excludes from adherence |
| AOS-020 | `<ActiveHoursChip />` (read-only in 1A)                     | Editor lands in Phase 2 |
| AOS-021 | Acceptance: 90-min two-pulse desk session                   | See phase-1a doc |
| AOS-022 | On-device deploy + verify on R9AR7003A2J                    | Repeat per slice |

## Phase 1B — Goal Front-and-Center

| ID      | Task                                                        | Notes |
| ------- | ----------------------------------------------------------- | ----- |
| AOS-040 | Personal 3-mi grading table → `gradeFor3Mi(seconds)` pure fn | No verification needed |
| AOS-041 | `PFTAttempt` storage + CRUD                                 | Append-only |
| AOS-042 | `pft.goal` storage (`{event, target, deadlineISO}`)         | Singleton |
| AOS-043 | `bestPFTAttempt(rolling30d)` derivation                     | Pure |
| AOS-044 | `<PFTGoalPanel />` v1 (personal table only)                 | Right-rail |
| AOS-045 | `<LogAttemptSheet />` v1 (rep + time keypads)               | Reachable from chips |
| AOS-046 | `<DeadlineCountdown />` chip on status strip                | Recolors at < 7 d |
| AOS-047 | `dayStatusWindow(n)` derivation                             | For 30-day strip |
| AOS-048 | `<ThirtyDayStrip />` under status strip                     | Cell encoding per UI spec |
| AOS-049 | Run-attempt mode UI (START/STOP, lap, 96-sp timer)          | Full-screen takeover |
| AOS-050 | `RunAttemptInProgress` persistence + resume-on-relaunch     | Survives reboot |
| AOS-051 | Pace-ribbon computation (ahead/behind goal pace)            | Honest, no gamification |
| AOS-052 | Lap configurations (1, 3, 4, 12) in setup sheet             | Default 1 |
| AOS-053 | Review-card → commit / discard flow                         | Discard nukes in-flight |

## Phase 2 — Content & Discipline

| ID      | Task                                                        | Notes |
| ------- | ----------------------------------------------------------- | ----- |
| AOS-100 | Implement `src/domain/ambient/catalog.ts` (PulseAction[])   | See pulse-catalog.md |
| AOS-101 | Scheduler picks catalog entries (element/window/cooldown)   | 90-min default cooldown |
| AOS-102 | Author bespoke per-element cue tones                        | OGG/WAV ≤ 1.2 s |
| AOS-103 | Master + per-element volume sliders                         | KEYS namespace |
| AOS-104 | Active-hours inline editor + per-day-of-week mask           | OQ resolves the default |
| AOS-105 | Manual-pause control (long-press status strip)              | Persisted across app kill |
| AOS-106 | 0.4 Hz active-card accent pulse                             | Reanimated |
| AOS-107 | Idle low-luminance mode                                     | ≤ 10% apparent |
| AOS-108 | Settings sheet: OS quirks (battery/Doze/DND/sleeping apps)  | Static doc UI |
| AOS-109 | Long-press header → manual Live lock                        | Auto-release rules |
| AOS-110 | Daily-seal star animation in activity log                   | < 5 s respond bonus |
| AOS-111 | Streak pill on status strip (additive only)                 | Honors P-8 |
| AOS-112 | Adherence ring color thresholds                             | 0.33 / 0.66 stops |
| AOS-113 | Snooze duration setting (3/5/10 min)                        | Per device |
| AOS-114 | Window-expiry timeout setting (3–15 min)                    | Per plan-window |
| AOS-115 | `PlanTemplate` storage + 4-week installer                   | See periodization.md |
| AOS-116 | Anchor catalog entries (`anchor.*`)                         | Surface as TRIAL card on day-of |
| AOS-117 | "Today's Anchor" card on PFT goal panel                     | + week-strip glyphs |
| AOS-118 | `detectAbsences()` derivation                               | Pure, journal + activeHours |
| AOS-119 | `journal.absence` writes + `absorbedBy` marking             | On resume + FGS tick |
| AOS-120 | `<NowCard state="welcome-back" />`                          | Auto-dismiss 30 s |
| AOS-121 | Activity log absence-rollup rendering                       | Collapses absorbed rows |
| AOS-122 | First-launch onboarding flow                                | 6 steps; ≤ 90 s |
| AOS-123 | Settings re-run-onboarding entry point                      | Preserves journal |
| AOS-124 | USAF (35–39 male) standard table + grading                  | Gated on AOS-V01 |
| AOS-125 | USMC (36–40 male) standard table + grading                  | Gated on AOS-V02 |
| AOS-126 | `(preview)` badge UI for unverified standards               | Per-table gate |

## Phase 3 — Expansion

| ID      | Task                                                        | Notes |
| ------- | ----------------------------------------------------------- | ----- |
| AOS-200 | USSF age-banded standard table                              | Gated on AOS-V03 |
| AOS-201 | USN age-banded standard table                               | Gated on AOS-V04 |
| AOS-202 | USA (ACFT) age-banded standard table                        | Gated on AOS-V05 |
| AOS-203 | Elite badges: SEAL 4-mi, Spetsnaz 3 km                      | "popular benchmark" disclaimer ok |
| AOS-204 | Voice (TTS) lap announcements in run-attempt mode           | Off by default |
| AOS-205 | Voice cue option for pulses                                 | Off by default |
| AOS-206 | Sleep self-report stamps                                    | Feeds periodization |
| AOS-207 | Pomodoro-aware fire-time slide                              | Heuristic, opt-in |
| AOS-208 | Insights: time-to-respond by hour-of-day                    | Existing Insights extension |
| AOS-209 | Insights: anchor-event trend chart                          | 30-day rolling |
| AOS-210 | Insights: weekly absence heatmap                            | New tile |
| AOS-211 | Pulse catalog v2 refinements                                | Posture/hydration |

## Verification gate (`AOS-V##`) — per-table

| ID      | Task                                                        | Source            |
| ------- | ----------------------------------------------------------- | ----------------- |
| AOS-V01 | Verify USAF 35–39 male age-band cut scores + components     | AFI 36-2905       |
| AOS-V02 | Verify USMC 36–40 male age-band cut scores                  | MCO 6100.13       |
| AOS-V03 | Verify USSF table                                            | Branch publication |
| AOS-V04 | Verify USN table                                             | Branch publication |
| AOS-V05 | Verify USA / ACFT table                                      | TC 7-22.10        |
| AOS-V06 | Verify SEAL 4-mile threshold                                 | NSW PST           |
| AOS-V07 | Verify or label Spetsnaz benchmarks                          | RU MoD or "popular" |
| AOS-V08 | Confirm USMC plank alternative status for age band           | MCO 6100.13       |
| AOS-V09 | Confirm USMC CFT ammo-lift age-banded target                 | MCO 6100.13       |

## Cross-cutting

| ID      | Task                                                        | Notes |
| ------- | ----------------------------------------------------------- | ----- |
| AOS-X01 | Define `KEYS.ambient*` and `KEYS.pft*` namespaces           | Single source of truth |
| AOS-X02 | Document Android FGS notification and permission ask        | Onboarding step 5 |
| AOS-X03 | Add jest tests for pulseQueue invariants                    | At-most-one, snooze cap, suppression |
| AOS-X04 | Add jest tests for adherenceForDay edge cases               | Suppressed + absorbed exclusions |
| AOS-X05 | Add jest tests for grading lookups                          | Per shipped table |
| AOS-X06 | Add jest tests for `detectAbsences()`                       | Boundary cases |
| AOS-X07 | Add jest tests for `dayStatusWindow(30)`                    | Empty / partial / full history |
| AOS-X08 | E2E smoke: 90-min desk session synthetic                    | Detox/Maestro TBD |

## Sequencing notes

- AOS-001 must close before AOS-002.
- AOS-004/005 land before any UI that consumes the new kinds.
- AOS-011 is the spine; AOS-012/013/014 hang off it.
- AOS-016/017/018 are Android-side and can run in parallel with the
  pure-JS stack.
- AOS-019/020 unblock active-hours suppression in 1A; the editor
  (AOS-104) can land later in Phase 2.
- AOS-049/050 (run-attempt mode) drive AOS-053 (review/commit).
- AOS-118/119/120 (absence) require AOS-019 (active-hours) to compute
  `withinActiveHours`.
- All `AOS-V##` are gated by operator/verifier availability;
  per-table gate, never a phase-wide block.

## Today home redesign (2026-09-14, branch `today-home`)

| ID    | Task                                                                  | Status |
| ----- | --------------------------------------------------------------------- | ------ |
| TH-P0 | Queue expiry fix, plan edits cancel queued chimes, ribbon overlap     | done   |
| TH-P1 | One activity model (journal + Train log + max tests), water glasses   | done   |
| TH-P2 | Rounds + partner drills, My day window, water ride-along, "Done"      | done   |
| TH-P2b| Leaner default plan, schema v2 migration with plan backup            | done   |
| TH-P3 | Heart › Today home; Heart Today · Progress · Setup                    | done   |
| TH-P4 | Element pages Drills · Train · History                                | done   |
| TH-P5 | Docs amended; `10-today-home.md`                                      | done   |
| TH-N0 | Helpers: element day items, 14-day ribbon, week counts, Train headline | done   |
| TH-N1 | Heart one page: Settings and Daily Sets sheets, week dots, set meters | done   |
| TH-N2 | Element pages one page: drill card, Library sheet, day ribbon, log    | done   |
| TH-N3 | Sub-tab strip removed, vignettes clipped, brighter rail, schema v3    | done   |
| TH-N4 | Docs amended for one page per element                                | done   |
| TH-V1 | Full-day device pass on the Redmi A3 (chime count, killed-app Done, My day edits, Restore) | open |
