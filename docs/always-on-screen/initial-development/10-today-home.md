# Heart › Today — the home redesign

Decided with the operator on 2026-09-14 and built on branch `today-home`
(P0–P5, then N0–N4 for one page per element the same day). This doc is the
current shape of the app; where older docs in this folder describe tablet
zones, the Always-On ribbon, adherence rings, sub-tabs or a separate
active-hours window, this one takes precedence.

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

A first pass cut the tabs to three per element. Using it, the operator
found even those too many, and the strip looked faded (the page's corner
vignettes overflowed onto it). The tabs also repeated each other: Train
and History showed the same records, Progress repeated Today's balance,
and Setup repeated the My day chip and the per-element test buttons.

## Navigation

- The five-element rail is the only navigation. The app **always opens on
  Heart**.
- **No sub-tabs.** Each element is one scrolling page. Anything
  lower-priority opens in a full-screen sheet from that page.
- Heart is Today. Fire, Air, Earth and Water each have one page (below).

## Today (`src/screens/heart/TodayPanel.tsx`)

Top to bottom, one scroll:

1. **Status line** — one chip for live or paused and My day (tap: edit My
   day, pause 30 min / 2 h / until tomorrow, or resume), the clock, and
   **⚙ Settings**, which carries a yellow dot when notifications are off or
   a Stay alive check warns.
2. **Chime card** — while a chime sounds: the round's moves, each with its
   own −/+, its partner drill and any glass of water, a draining answer
   window, and **Done / +5 / Skip**. Otherwise the next chime with **+5**
   and **Skip it**.
3. **Balance strip** — today's count per element, and seven dots for the
   last seven days (lit when that element had anything). Tap to open the
   element. Partner drills and glasses count toward their own elements.
4. **Drink** — glasses of water today out of 8, with **+1**.
5. **Daily Sets meters** — sets done, then one small meter per track in its
   element's color. Tap for the Daily Sets sheet.
6. **Today · N-day streak** and the day's list — one row per record from
   every source (chimes and rounds, drill taps, circuit legs, Train log
   entries, max tests) and the day's chimes as active, upcoming, skipped or
   missed. Missed and skipped rows are dimmed, never red, never counted.
   Train entries open for edit. A missed or skipped chime opens a Log it
   sheet (a round's moves with −/+, or the drill's dose): Done records it at
   the chime's own time, as a manual completion carrying the chime's pulse
   id, so the row turns done and a round counts toward Daily Sets
   (`src/domain/ambient/lateDone.ts`). Other logged rows open to keep or
   remove. With two or more missed chimes the header offers **Catch up N**:
   a tick-list that logs each ticked chime at its own time.
7. **+ Log a session** (Train log sheet) and **Practice** (circuits, then
   Heart drills, in one scroll).

## Sheets

- **Settings** (⚙ on Today) — chime volumes with a test per element and
  Respect DND, the Stay alive checklist, the plan editor ("Save plan"),
  restoring a plan the v2 migration replaced, alive motion, Heart theme. A
  notifications-off warning leads when permission is denied. My day is
  edited from Today's chip.
- **Daily Sets** (Today's meters) — today's tracks with their rounds, max
  tests, level ups, and track on/off.
- **Library** (element pages) — focus areas, saved per element, which also
  steer the drill card; and the element's whole drill list.

Cut outright: Progress's 7-day bars and 14-day trend, History's tiles and
sparkline, the Train tab's headline card (now one line), Setup's own My day
row and Test chime button, and the Daily Sets explainer paragraph.

## Element pages (`src/screens/element/ElementPage.tsx`)

One scroll:

1. **Header** — the element's name, "3 today · 12 this week · 4-day
   streak", the best result of the last 30 days (a run's 3-mile-equivalent
   grade, otherwise the most-logged kind's best), and **+ Log**.
2. **Try this now** — name and dose, with the why and the cues folded
   under How. **Done** logs it (a Daily Sets track's current rung counts as
   a set), **↻ Swap** offers the next best, **Library** opens the rest.
3. **Day ribbon** — the last 14 days as bars, today on the right, a dot on
   days with a Train entry. The whole ribbon is one touch target: a tap
   picks the day under the finger. The day label opens a calendar for
   older days.
4. **That day's log** from every source. Train entries open for edit.

Older Train entries whose kind is custom with no element (`'any'`) appear
on every element page, as the Train tab showed them, but count once, where
`trainElement` credits them (`src/domain/activity/elementDay.ts`).

## Move icons (`src/domain/exercises/moves.ts`, `src/components/icons/`)

Below the element sits the move: what the operator is actually doing.

- **33 pictograms** on a 24-unit grid, in one bold weight: stick figures
  (solid head, 2.6-unit limbs) for body moves — push, pull, row, hang,
  squat, lunge, plank, crunch, run, staff flow and so on — and Lucide shapes
  for breath, drink, fuel, presence, evening review and pulse. The shapes
  live in `moveGlyphs.json`; `MoveIcon` draws them tinted by the element.
- **Every drill, Daily Sets track and built-in Train kind maps to a move**;
  `moves.test.ts` fails if a new drill, kind or track has none, or a move has
  no pictogram. Kinds the operator adds fall back to run or a pulse line.
- **Where they show:** the chime card (on a soft tile of the element's
  color), Today's list and each element's day log, the Daily Sets meters and
  track cards, the drill card and the Library and Practice cards.
- **Notifications** use the move as the status-bar icon, tinted by element.
  Android needs vector drawables, so `node scripts/gen-move-drawables.js`
  writes `res/drawable/ic_move_*.xml` from the same JSON; run it after
  editing a shape. The keep-alive notification uses the pulse icon.
- The water counter reads **Drink** with a glass, so drinking water isn't
  confused with the Water element's count in the balance strip.

## Corrections (`src/domain/activity/corrections.ts`)

- **Undo bar.** Every completion logged while the app is open — a Done, a
  drill tap, +1 water, a late or caught-up log — shows "Logged … · Undo" at
  the bottom of the page for 8 seconds.
- **Remove.** A logged row in Today's list or an element's day log opens a
  sheet with Remove; the undo bar then offers to put it back. Max tests
  aren't removable (it wouldn't undo the new set size); Train entries are
  edited or deleted in their own sheet.
- **Voids, not deletes.** Taking something back appends an `entry.voided`
  record in the entry's own day. `entriesForDay` skips voided entries, so
  every count, streak, meter and scheduler agrees at once; a round's sets
  return and later rounds regrow.

## Chimes (`src/domain/program/rounds.ts`, `src/domain/ambient/setScheduler.ts`)

- **Rounds.** A day's Daily Sets are grouped into rounds — a few different
  moves back to back (at most five, no track twice), about nine rounds a
  day. As weeks ramp a round grows a move instead of the day growing
  chimes. Moves alternate fire and earth and keep grip-heavy row, pull and
  hang apart.
- **Partners.** Each round ends with a 20–30 s drill from another element,
  chosen from the lead move's list in `tracks.ts` (chest opener after
  push-ups, hip opener after squats, a breath after trunk work).
- **Smart partners.** The partner leans toward the element with the least
  work over the seven days before today, among those not already in the
  round: the lead move's own partner when one fits, else a short drill from
  `PARTNER_POOL`. Each partner placed counts toward the next pick, so a day
  spreads them across the neglected elements. Past days only, so partners
  hold steady all day.
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

## Migrations

- **v2.** On upgrade, a saved plan that differs from the new default
  (which dropped Desk Hours and Morning Training) is kept under
  `plan.backup.v1` and replaced; Settings › Previous plan restores it. The
  Daily Sets day window is dropped. Fresh installs are untouched.
- **v3.** The stored per-element tab (`settings.shell.subTabByElement`) is
  dropped; there are no tabs to return to.

## Verification

Per phase: jest (all suites), `tsc` (non-test error count unchanged),
eslint on touched files, release build, `adb install -r`, screenshots of
every page and sheet. Still to confirm across a full day on the Redmi A3:
chime count, a round's Done from a killed-app notification, My day edits
re-laying chimes, and Restore previous plan.
