# Heart › Today — the home redesign

Decided with the operator on 2026-09-14 and built on branch `today-home`
(P0–P4). This doc is the current shape of the app; where older docs in
this folder describe tablet zones, the Always-On ribbon, adherence rings
or a separate active-hours window, this one takes precedence.

## Why

The operator reviewed the app against how they actually use it — a phone
beside the monitors, a chime, a small set, one tap — and said: "I have to
check around too much for something I just want to use to track my
fitness." The review found:

- 31 tabs: five elements × six tabs plus seven on Heart. Heart's Dash was
  meant to be home but had filled with a mandala, a circuit card and a
  drills grid.
- A "done" landed in one of three stores (journal, Train log, program
  state) that no screen read together — a logged run never counted
  toward a streak.
- Controls that did nothing (Operating Mode, Daily Target, Apply Plan) and
  an active-hours window that couldn't be edited and silently muted the
  Morning Training window.
- About 71 chimes on a default weekday; 21 had gone unanswered by 12:31 on
  the device.
- Only Fire had concrete tracking, and balance required visiting the other
  elements. The operator admitted sticking to Fire work.

## Navigation

- The five-element rail stays. The app **always opens on Heart › Today**.
- Heart: **Today · Progress · Setup**.
- Fire, Air, Earth, Water: **Drills · Train · History**.
- Other elements reopen on their last tab; tabs from the old layout map to
  where their content lives (Now/Tune → Drills, Log/Stats → History).

## Today (`src/screens/heart/TodayPanel.tsx`)

Top to bottom, one scroll:

1. **Status line** — LIVE or PAUSED (tap to pause 30 min / 2 h / until
   tomorrow), the My day chip (tap to edit), the clock.
2. **Chime card** — while a chime sounds: the round's moves, each with its
   own −/+, its partner drill and any glass of water, a draining answer
   window, and **Done / +5 / Skip**. Otherwise the next chime with **+5**
   and **Skip it**.
3. **Balance strip** — today's count per element; tap to open the element.
   Partner drills and glasses count toward their own elements.
4. **Water** — glasses today out of 8, with **+1**.
5. **Daily Sets line** — sets done and per-track amounts; tap for Progress.
6. **The day's list** — one row per record from every source (chimes and
   rounds, drill taps, circuit legs, Train log entries, max tests) and the
   day's chimes as active, upcoming, skipped or missed. Missed and skipped
   rows are dimmed, never red, never counted.
7. **+ Log a session** (Train log sheet) and **Practice** (circuits and
   Heart drills).

## Progress and Setup

- **Progress** — last 7 days by element, a 14-day trend against the usual
  day, a streak line that never shames ("A fresh start today"), and Daily
  Sets (tracks, max tests, level ups, on/off).
- **Setup** — notification status, My day, chime volumes and Respect DND,
  Test chime, Stay Alive checklist, the plan editor ("Save plan"), restoring
  a plan the v2 migration replaced, alive motion, Heart theme.

## Element tabs

- **Drills** — a drill to try now (Done logs it; Swap always offers a
  different one), saved focus areas that also steer the pick, the library.
  A drill that is a Daily Sets track's current rung counts as a set.
- **Train** — sessions typed in by hand (runs, holds, rep tests), unchanged.
- **History** — everything done in the element on a chosen day, from every
  source; day, week and streak tiles; 14-day trend.

## Chimes (`src/domain/program/rounds.ts`, `src/domain/ambient/setScheduler.ts`)

- **Rounds.** A day's Daily Sets are grouped into rounds — a few different
  moves back to back (at most five, no track twice), about nine rounds a
  day. As weeks ramp a round grows a move instead of the day growing
  chimes. Moves alternate fire and earth and keep grip-heavy row, pull and
  hang apart.
- **Partners.** Each round ends with a 20–30 s drill from another element,
  chosen from the lead move's list in `tracks.ts` (chest opener after
  push-ups, hip opener after squats, a breath after trunk work).
- **Water rides along.** A plan water call within 20 minutes of a round
  becomes that round's glass; the plan scheduler and OS backups skip it.
- **Budget.** Rounds, the remaining water calls, two fuel checks, the
  evening review and the backyard session come to about twenty on a
  default weekday. `chimeBudget.test.ts` keeps week 1 and week 3 ≤ 24.
- **Done everywhere.** Buttons and notifications say "Done".

## My day

`ambient.activeHours`, default **09:00–22:00**, all days. The one window
for paging, for spreading rounds (they stop 90 minutes before the end) and
for night dimming. Saving it re-lays chimes, re-plans backups and re-checks
the screen and foreground service at once.

## Records

- `src/domain/activity/` merges journal completions, Train log entries and
  max tests into one list; every count reads it.
- A round is one completion with `moves`, `partnerExerciseId`/`partnerSec`
  and `water`. Max tests append `program.test`.
- A skip from Today writes `reminder.skipped`; `handledPulseIds` keeps the
  schedulers from re-queueing it after a restart.

## Migration (schema v2)

On upgrade, a saved plan that differs from the new default (which dropped
Desk Hours and Morning Training) is kept under `plan.backup.v1` and
replaced; Setup › Previous plan restores it. The Daily Sets day window is
dropped. Fresh installs are untouched.

## Verification

Per phase: jest (all suites), `tsc` (non-test error count unchanged),
eslint on touched files, release build, `adb install -r`, screenshots.
Still to confirm across a full day on the Redmi A3: chime count, a round's
Done from a killed-app notification, My day edits re-laying chimes, and
Restore previous plan.
