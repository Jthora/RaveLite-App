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

- **No tab bar.** Today is home and always open underneath. Its balance
  strip is the navigation: tap an element (Fire, Air, Core, Earth or
  Water) for its page, drawn over Today; Back (the page's ‹ or Android's)
  returns to Today where it was left. **Settings** sits at the very bottom
  of Today, beside + Log a session and Practice, so the strip stays five
  balanced tiles. The bar went to give the page its height back.
- **No clock or My day chip.** Android's status bar shows the time; My day
  and pausing live in Settings.
- **No sub-tabs.** Each element is one scrolling page. Anything
  lower-priority opens in a full-screen sheet from that page.

## Core themes (`src/theme/heartVariants.ts`, `src/components/icons/ElementGlyph.tsx`)

Settings › Theme sets how Core presents itself, in two choices. A mark:
**Core** (⊙), **Heart** (♡), **Æther** (a six-pointed star in lines),
**Star** (a five-pointed star in lines) or **Starcom** (the Starcom
mark, filled). And a color, one of five that keep clear of the
four elements' red, yellow, green and blue: orange, magenta, violet, cyan or
white. Until a color is picked, each mark brings its own (Core orange,
Heart magenta, the stars white); once picked, it stays across marks. The
picker previews both, and the app redraws when Settings closes. Every
element's mark (Fire, Air, Earth, Water and all five Core marks) is SVG
on one 24-unit grid with one 1.75 line (`src/components/icons/elementMarks.ts`),
sized to Lucide's keylines, so marks match in size, center and weight in
the balance strip, page headers and the picker. The
Starcom mark is a regular five-pointed star whose lower legs are cut into
two chevrons: below the body, four equal bands parallel to the legs' inner
edges (gap, chevron, gap, chevron). It was traced from the CommanderIcon
reference (98% pixel overlap) and is also saved as
`src/components/icons/svg/star-commander.svg`. Storage keeps `heart` as the
element id whatever the theme.
Starcom is as wide as the outlined Star measures to the outside of its
line, so the two read the same size. In the balance strip each mark is
centered in its tile.

## Today (`src/screens/heart/TodayPanel.tsx`)

Top to bottom, one scroll:

1. **Conditions line**, once a place is set — the next sunrise or sunset
   and, with a forecast, the temperature, rain chance and bug estimate now.
   Tap for the Weather sheet. Before a place is set it doesn't show;
   Settings asks for one.
2. **Chime card** — while a chime sounds: the round's moves, each with its
   own −/+, its partner drill and any glass of water, a draining answer
   window, and **Done / +5 / Skip**. Otherwise the next chime with **+5**
   and **Skip it**. A chime the weather changed says why, e.g. "Rain 80% —
   Fire Rounds inside instead". While chimes are paused, the card says until
   when, with **Resume now**.
3. **Balance strip** — today's points per element with a bar filling
   toward par (20), and seven dots for the last seven days: solid on days
   the element made par, faint on days it got something. Tap to open the
   element's page. Partner drills, glasses and eye breaks count toward their
   own elements.
4. **Drink** — glasses of water today out of 8 (10 on a hot day, 12 in
   dangerous heat), with **+1**.
5. **Daily Sets meters** — sets done and today's focus (the day's
   attributes in their element colors, or Saturday's test), then one small
   meter per track in its element's color; push-ups get no row of their
   own. Tap the card for the Daily Sets sheet.
6. **Today · N-day streak** (plus **· Harmony** once all five are at
   par) and the day's list — one row per record from
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
7. At the very bottom: **+ Log** (Train log sheet), **Practice** (circuits,
   then Heart drills, in one scroll) and **Settings**.

## Sheets

- **Settings** (the bottom of Today) — My day, pause
  chimes (30 min, 2 hours, till morning, or resume), Weather & place (it
  asks for a place until one is set), chime volumes with a test per element
  and Respect DND, the Stay alive checklist, the plan editor, restoring a
  plan the v2 migration replaced, alive motion, and the Core theme. A
  notifications-off warning leads when permission is denied.
- **Goals** (Daily Sets › Goals, shown inside the Daily Sets sheet so Back
  returns to Daily Sets; see the note below) — push-ups today against today's
  sets, with 200 a day as the long-term goal, then each military
  test event with its target (a B+ on every test that uses it, or a target
  the operator set on a number pad), the best Train log test with its grade
  on each test and a bar toward the target, each test's D−, B+ and A+ marks
  for the chosen table (male or female first), and **Log a test**, which
  opens the log sheet on that event. Then a section each for Air, Core,
  Earth and Water, graded on RaveLite's own marks.
- **Weather** (Today's conditions line, or Settings › Weather & place) —
  the place (type a town, or Use my location), today's first light,
  sunrise, sunset and daylight, the next 12 hours, and switches for Buggy
  today, moving yard work inside when buggy, running in the dark, and °F.
- **Daily Sets** (Today's meters) — today's tracks with their rounds, max
  tests, level ups, track on/off, why each track asks for its sets (see
  Adaptive ramp), how much of last week's sets got done, and **Goals**
  in the header.
- **Library** (element pages) — focus areas, saved per element, which also
  steer the drill card; and the element's whole drill list.

**Sheets over sheets.** On the Redmi, once a React Native Modal opened over
another Modal has been touched (scrolled or tapped), Back stops reaching it
and then the sheet beneath, which stays open until tapped closed; a single
sheet scrolled on its own closes on Back. So Goals is a view inside the
Daily Sets sheet, not a sheet on top of it. Small pads over a sheet (Test
max, a goal's target, Log a test) are still their own Modals.

Cut outright: Progress's 7-day bars and 14-day trend, History's tiles and
sparkline, the Train tab's headline card (now one line), Setup's own My day
row and Test chime button, and the Daily Sets explainer paragraph.

## Element pages (`src/screens/element/ElementPage.tsx`)

Fire, Air, Core, Earth and Water each have one, opened over Today from the
balance strip. One scroll:

1. **Header** — ‹ back to Today, the element's glyph and name, "14/20 today · 62 this week · 4-day
   streak" in points, the best result of the last 30 days (a run's 3-mile-equivalent
   grade, otherwise the most-logged kind's best), and **+ Log**.
2. **Try this now** — name and dose, with the why and the cues folded
   under How. **Done** logs it (a Daily Sets track's current rung counts as
   a set), **↻ Swap** offers the next best, **Library** opens the rest.
3. **Day ribbon** — the last 14 days as bars of points over a faint par
   line, today on the right, a dot on days with a Train entry. The whole ribbon is one touch target: a tap
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

## Points (`src/domain/activity/par.ts`)

Every thing done is worth effort points to its element, so balance is
reachable: counting completions gave a perfect Monday Fire 15 · Earth 14 ·
Water 13 · Core 5 · Air 2.

| Thing done | Points |
|---|---|
| A glass of water, an eye break | 1 |
| A set, a partner, a short drill | 2 |
| A check-in (morning intent, fuel check) | 3 |
| A max test | 5 |
| A longer drill or a timed Train session (runs, timed custom kinds) | a point a minute, up to 30 |

- **Par** is 20 a day per element. Over par counts half up to 40
  (`scoredPoints`, for XP later); a day with all five at par is
  **Harmony**.
- **Air** gets two Daily Sets tracks every day: **Posture** (chin tucks →
  wall angels → brick halos) and **Breath** (physiological sighs →
  coherence → box breathing). Every chimed glass (a round's, or a water
  call answered) comes with a 20 s **eye break**; the Drink +1 counter
  doesn't.
- **Water** gets **Mobility** every day (hamstring floss → deep squat hold
  → front split progression), and the morning blocks bring staff flow and
  footwork on Tuesday, Thursday and Friday and long stretches on Monday and
  Sunday (see Focus wheel).
- **Core** gets its own Daily Sets track, **Stillness** (pulse check →
  still sit → single-point focus, small timed sets every day), a **Morning
  Intent** check-in at 05:05, and the Evening Review at 20:45, which always
  chimes as itself (a slot can name its drill with `exerciseId`) and opens
  with a three-minute still sit.
- **Check.** Answering every chime for eight days from Monday 14 September
  put every element at par every day except Sunday's Earth (18: most
  strength tracks rest, and rounds holding an Earth move can't end on an
  Earth partner; one Earth drill makes it up). Week 1 Monday: Fire 29 ·
  Air 26 · Earth 26 · Water 28 · Core 26.

## Goals and fitness standards (`src/domain/standards/`, `src/domain/program/pushups.ts`)

The operator trains toward four tests, and their events are sacred: the
Air Force and Space Force tests (push-ups and sit-ups in a minute, plank,
2-mile run), the Marine PFT and combat fitness test (pull-ups, 2-minute
push-ups, plank, 3-mile run, 880-yard sprint, ammo-can lifts, maneuver under
fire) and MARSOC's marks. The goal is **a B+ on the Space Force, Air Force
and Marine tests**. The services score points, not letters, so grades run
evenly along each test's chart for ages 35–40 (USMC 36–40, USAF and USSF
35–39): the passing minimum is a D−, the max an A+. An event on several
tests targets the hardest B+ (the plank's 3:03 clears all three); the
combat fitness test, with no published minimum, targets its top score.
Male B+ marks: push-ups 47 in a minute and 65 in two, 17 pull-ups, a 3:03
plank, 48 sit-ups in a minute, a 15:56 2-mile and a 20:54 3-mile. The charts
come from 2025–2026 calculator and news sites and a Space Force chart dated
4 Feb 2026, because the official charts would not load; they are close, not
final, and every target can be changed.

- **Element goals** grade the same way on RaveLite's own marks, since no
  official chart covers them; the operator approved them on 14 Sep 2026.
  Marks run D− to A+, with the B+ goal in brackets:
  - Air: breath hold 0:30–2:30 (1:58), exhale hold 0:15–1:00 (0:48), rope
    skips in 2 minutes 120–300 (251).
  - Core: still sit 0:30–3:00 (2:20); last week's sets done 50–100% (87%),
    measured from Daily Sets rather than logged.
  - Earth: squats in one set 20–80 (64), wall sit 0:45–3:00 (2:24), dead
    hang and weaker-side side plank 0:30–2:00 (1:36), one-leg balance with
    eyes closed 0:10–1:00 (0:47).
  - Water: deep squat hold 0:30–5:00 (3:47), staff flow without a drop
    1:00–20:00 (14:50).
- **Projected dates** (`src/domain/standards/projection.ts`). Each goal's
  card says where its tests are heading: a straight line through the tests
  of the last four months dates when it reaches the target ("On pace for
  the B+ around Nov 20"). It needs two tests at least a week apart, and says
  "not on pace yet" for a trend going the wrong way or more than three years
  out. Today's push-ups add how soon the sets could reach 200 a day keeping
  up every week (`src/domain/program/ramp.ts`), or, when the sets top out at
  today's max, the tested max that gets there.
- **Push-ups, ramping toward 200 a day.** The day's count adds Push and
  Variants sets (rounds, "+ set", drill taps that count as a set), max tests
  and push-up tests from the Train log; standard push-ups count apart from
  variants. Today's target is what today's sets add up to, which grows as
  the weeks build and the tested max rises: a push-up max of 25 comes to
  about 60 a day in week 1.
- **Push** stays on the tested push-up (incline push-ups are its only
  easier rung) and runs every day, up to 12 sets. **Variants** (diamond →
  decline → archer) run every day beside it; their reps count toward 200.
- **Pull-ups, rows and plank** run every day. **Plank** has one rung, the
  forearm plank, building toward 3:45. The core track, now **Sit-ups**,
  ends at the sit-up.
- Rounds can hold six moves, so the extra sets don't add chimes.
- **Results** come from Train log tests. A longer run counts at the same
  pace, so the 3.2-mile loop times the 3-mile event. New log kinds:
  1-minute push-ups and sit-ups, 880-yard movement to contact, ammo-can
  lifts (about 6 bricks in a bag), maneuver under fire.
- **Not tracked yet:** MARSOC's swim and ruck, and waist-to-height ratio.

## Adaptive ramp (`src/domain/program/adapt.ts`)

Daily Sets volume follows what gets done, not the calendar. Once a day
(when the sets scheduler first runs) each track reads its training days in
the week before, done against what each day asked (recorded daily under
`program.days`), each day counted at most in full:

- **85% or more:** a set more a day, up to the track's most.
- **60% to 85%:** hold. **Under 60%:** a set fewer, never below two.
- **At most one step a week**, so the climb is smooth and one bad day never
  costs a set. A track's first review starts it at its week-1 base.
- **A break** (three training days in a row with nothing) brings the track
  back at 80%, again each week the break lasts; it climbs back a set after
  every three good days until it's where it was.
- **Deload weeks hold.** Set size stays at about half the tested max, so
  growth comes as more small sets across the day, and from max tests.
- **Within the day**, sets from a round that went by undone roll into
  later rounds, at most one per round for each track and never past a full
  round; what doesn't fit is let go rather than crammed into one big set.

## Focus wheel (`src/domain/program/week.ts`)

Fifteen attributes, three per element. Six are the **daily core**, trained
by every day's rounds: Strength, Toughness, Breath, Awareness, Focus and
Resolve. The other nine rotate as the day's **focus**, each twice a week and
never more than four days apart:

| Day | Focus | Morning block |
|---|---|---|
| Sun | Recovery · Agility | Long walk and light skips |
| Mon | Power · Mobility · Presence | Kicks and jumps |
| Tue | Speed · Dexterity · Balance | Strides and staff |
| Wed | Stamina · Recovery | Easy run |
| Thu | Agility · Mobility · Presence | Footwork and flow |
| Fri | Power · Dexterity · Balance | Bricks and staff |
| Sat | Stamina · Speed | The week's test |

- **Saturday tests** rotate with the 4-week block: the Air Force test
  (1-minute push-ups and sit-ups, 2-mile run), the Marine PFT (pull-ups,
  plank, 3-mile run), the Marine combat fitness test (880-yard sprint,
  ammo-can lifts, maneuver under fire), then max tests on the deload week.
- **Sweat stays in the morning** (laundry is limited). A focus day adds one
  set to its dry track (Mobility, Stillness or Breath) and ends every second
  round with a dry focus partner (a hip opener, a balance, a presence
  drill). A guard keeps every rung and partner free of sweaty drills
  (`src/domain/exercises/sweat.ts`), and Try this now sinks them after 08:00.
- **Tests are tagged `Test`**, so random plan picks, indoor weather swaps and
  Try this now never choose one.
- **Morning chimes follow the block** (`src/domain/program/morning.ts`). The
  Morning Session (05:45–07:00) has one slot marked `block: 'morning'`, a
  chime every 25 minutes: 05:45, 06:10 and 06:35 take the day's three pieces
  in order (a longer window repeats the last), and Saturday chimes its test.
  Each says which piece it is ("Kicks and jumps · 1 of 3") on Today's list
  and the chime unless the weather has a note, chimes in the piece's own
  element, and still moves indoors or swaps in bad weather. Migration v7
  moves an untouched default plan; any other slot still picks from the
  library.
- **On the Daily Sets page:** today's focus in its colors with the morning
  block piece by piece and the daily core under the header, and the next
  seven days (focus, and each morning's block or Saturday's test) before
  the track list.

## Weather (`src/domain/conditions/`)

- **Place.** Typed as a town (Open-Meteo's place search) or detected once
  with coarse location (Android's last-known or a single network fix; the
  town name comes from Android's geocoder). Stored rounded to 0.1° (about
  10 km) and only sent to Open-Meteo.
- **Sun** (`sun.ts`). First light, sunrise, sunset and day length from the
  sunrise equation, on the phone, with no network. Checked against
  Open-Meteo for New York: within 2 minutes.
- **Forecast** (`forecast.ts`, `weather.ts`). Hourly temperature,
  feels-like, humidity, rain chance and amount, weather code and wind for
  48 hours, plus 10 days of past rain. Fetched when over 3 hours old:
  checked every 15 minutes while the app runs, when it comes to the front,
  and when the place changes. Offline, the last forecast stays in use.
- **Conditions** (`conditions.ts`). Dark before civil dawn; rain at 50%
  chance or rain falling; heat caution at feels-like 32 °C and danger at
  39 °C; cold at 0 °C, icy with snow or freezing-rain codes. Bugs are an
  estimate (warm, humid, still air, within 90 minutes of sunrise or
  sunset, 5 mm of rain in the last 10 days); Buggy today overrides it.
- **What changes** (`adapt.ts`). Only drills that can happen in the yard
  adapt; porch, mat and desk work stays. Indoors is a low basement, so
  running, walking laps, jumping, kicking, carries and staff flow or dance
  never move inside; Fire Rounds and most standing, mat and wall work do.
  - Rain, ice or dangerous heat: a drill that fits inside moves inside;
    one that doesn't swaps for an indoor drill of its element (a run
    becomes Fire Rounds, staff flow becomes a Water mobility drill).
  - Dark: a run swaps for indoor Fire work until first light, unless Run
    in the dark is on (then: headlamp and reflective gear).
  - Bugs likely: static work moves inside; the run and staff flow stay out,
    with repellent first.
  - Hot: easy pace, drink first. Cold: warm up inside first.
- **Where it shows.** The plan scheduler queues the adapted drill with its
  note; when a new forecast changes a waiting chime, it's queued again
  (keeping any +5). OS backup notifications lead with the note, and
  Today's list shows it as the row detail.
- **Hot days** (`heatWater.ts`). An extra water call halfway between the
  plan's own, in each hot hour (`heat-water` windows for today and
  tomorrow), so water calls come hourly, and the Drink target rises by 2
  (caution) or 4 (danger).
- **Not built yet:** moving the run to a dry hour before 09:00 or the
  warmest hour, winter's lean toward strength and mobility, and learning
  the yard from Buggy today taps.

## Chimes (`src/domain/program/rounds.ts`, `src/domain/ambient/setScheduler.ts`)

- **Rounds.** A day's Daily Sets are grouped into rounds — a few different
  moves back to back (at most five, no track twice), about nine rounds a
  day. As weeks ramp a round grows a move instead of the day growing
  chimes. Moves alternate elements (push, posture, row, squat, mobility,
  pull, crunch, leg-ups, hang, plank, side, breath) and keep grip-heavy
  row, pull and hang apart.
- **Partners.** Each round ends with a 20–30 s drill from another element,
  chosen from the lead move's list in `tracks.ts` (chest opener after
  push-ups, hip opener after squats, a breath after trunk work).
- **Smart partners.** The partner goes to the element with the lightest
  day, among those not already in the round: the lead move's own partner
  when one fits, else a short drill from `PARTNER_POOL`. "Lightest" is in
  points: what today's plan chimes and rounds will give each element, less
  how far it averaged under par over the past seven days, plus 2 for each
  partner already placed. An element that made par every day isn't pulled,
  so partners don't swing from one element to another day to day. Worked
  out once a day, so partners hold steady all day.
- **Water rides along.** A plan water call within 20 minutes of a round
  becomes that round's glass; the plan scheduler and OS backups skip it.
- **Budget.** Rounds, the remaining water calls, the morning intent, two
  fuel checks, the evening review and the morning session come to about
  twenty-two on a default weekday. `chimeBudget.test.ts` keeps week 1 and week 3 ≤ 24.
- **Done everywhere.** Buttons and notifications say "Done".

## My day

`ambient.activeHours`, default **05:00–21:00**, all days (it was
09:00–22:00; the operator runs in the morning and winds down at 21:00). The one window
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
- **v4.** An untouched My day (09:00–22:00) moves to 05:00–22:00, and an
  untouched default plan moves to the morning: water calls every 2 h from
  05:30, and the evening Backyard Session becomes a 05:45–07:00 Morning
  Session (run and flow). Anything the operator changed stays.
- **v5.** An untouched v4 default plan gains the 05:05 Morning Intent, the
  Evening Review pinned to its own drill, and staff flow in the morning
  session. The Posture, Breath and Mobility tracks need no migration: a
  stored program fills in tracks it doesn't know.
- **v6.** An untouched My day (05:00–22:00) ends at 21:00, and an untouched
  v5 default plan moves the Evening Review from 21:30 to 20:45, inside it.

## Verification

Per phase: jest (all suites), `tsc` (non-test error count unchanged),
eslint on touched files, release build, `adb install -r`, screenshots of
every page and sheet. Still to confirm across a full day on the Redmi A3:
chime count, a round's Done from a killed-app notification, My day edits
re-laying chimes, and Restore previous plan.
