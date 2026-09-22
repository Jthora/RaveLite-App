# Hardening passes

Written 21 Sep 2026, after Phases 0–4 shipped. That wave added a great
deal of surface area in a short time — profile, packs, archetypes, modes,
density, setup, demo, data export, units, symbols — and it was built
forward, not sideways. Every phase was verified working. Almost none was
verified *failing*.

This is the plan for the second kind of verification.

## What this wave actually taught us

Every serious bug in the last wave came from one of four places. That is
not a coincidence, and it sets the shape of the passes below.

| What went wrong | How it was found | Class |
|---|---|---|
| Window editor rendered blank labels for months | `tsc`, once its baseline was cleared | **A tolerated warning hid it** |
| Starting question could never have worked — the preview seeded the program before the question was asked | a test asserting the effect, not the call | **Order of operations** |
| Tutorial switched itself off by firing its own chime | device | **A feature's side effects hit its own guard** |
| Demo mode photographed real data | eyes on a screenshot | **State that dies with the process** |
| Today crashed on a journal entry with an unknown element | demo mode | **Bad data from our own writer** |
| A completion without `amount` is not a set | screenshots | **Two writers, one reader, different shapes** |
| CI would have gone red on first push | asking "how are we doing" | **Checked a subset, assumed the whole** |
| Taps felt slow: `keysWithPrefix` walked every key, so a 30-day range was 30 full scans | profiling with realistic data | **A helper whose cost nobody measured** |
| Tapping a row flashed and opened nothing: two sheets could be visible at once, and a deleted Train entry did nothing at all | the operator, then a test that taps every row | **Two pieces of state disagreeing about who owns the screen** |

None of these were logic errors in a function. They were all *seams*.

## The passes

Six, in this order. The order matters: 1 and 2 make the rest cheaper to
find, and 6 is worthless before them.

---

### Pass 1 — Make failure visible ✅ *(21 Sep 2026)*

**Problem:** when something goes wrong in the app today, the app looks
fine and the number is quietly wrong. There is no crash reporting, no
error boundary, and `console.warn` goes nowhere a user can see.

- **An error boundary per screen**, not one for the app. A crash in the
  character sheet should cost the character sheet, not Today. It says
  what broke, offers to reload that screen, and keeps the rest running.
- **A diagnostics page** in Settings → Your data: schema version, storage
  key count, last migration, last weather fetch and why it failed,
  whether native modules are present. All of it already exists in
  scattered places; nothing is computed for the first time here.
- **An error log**, capped at the last ~50 entries, written to storage
  and included in the export. A tester's bug report then arrives with the
  stack already in it.
- **Replace silent `catch {}`** with something that records. There are
  dozens; each one is a place the app decided not to tell anybody.

*Done when:* a deliberately corrupted store produces a screen that says
what is wrong, and an export that says it too.

**What shipped.** `domain/diagnostics/errorLog.ts` (50 entries, capped,
carried by the export, never throws), `components/Guard.tsx` (a boundary
per screen — Today and the character sheet), and
`domain/diagnostics/report.ts` behind **Settings → Your data → What state
this is in**.

**One judgement call:** not all 36 silent catches were given a voice.
Most are documented, deliberate tolerance — "corrupt, `getActiveHours`
already falls back", "emulators throw on vibration patterns" — and
logging those fills the buffer with noise, which trains everyone to
ignore it. Two were recorded, both places where data is genuinely
*discarded*: the whole Train log failing to parse, and a corrupt journal
entry being skipped. The rule for the rest of this work: **record where
something is lost, stay quiet where something is handled.**

---

### Pass 2 — Property tests where the shapes meet

**Problem:** the seam bugs above were all one writer disagreeing with one
reader. Example-based tests confirm the examples.

- **Storage round-trips.** Every repository: write arbitrary valid state,
  read it back, assert equality. `backup.ts` is already exact; the others
  have never been checked.
- **The journal → activity → counts chain.** Generate journal entries
  from the same generator the app writes with, and assert nothing
  crashes, nothing is silently dropped, and every count is a function of
  the entries. Two of this wave's bugs were exactly here.
- **Prescription invariants.** For every (archetype × day shape × mode ×
  kit) combination — a few thousand, all cheap — assert: sets ≥ 0, no
  duplicate track in a round, every prescribed drill is `canDo`, par
  reachable, and the day is never empty unless a rest mode says so.
- **Migrations are idempotent and ordered.** Run each twice; run them
  from every prior schema version. v1 → v8 has never been tested as a
  path, only as steps.

*Done when:* the invariants are stated as tests rather than as comments.

---

### Pass 3 — Hostile input

**Problem:** every input from outside the app is currently trusted more
than it should be.

- **Restore.** Truncated JSON, valid JSON of the wrong shape, an export
  from a newer schema, one from a *much older* one, a 50 MB file, a file
  full of nulls, keys with prefixes that collide with ours. It must
  refuse cleanly and leave the existing data untouched — which is tested
  for three cases and needs twenty.
- **The weather API.** Missing fields, nulls, an empty results array,
  1970 timestamps, a 500, a hang, a response that never ends.
- **The clock.** Midnight, DST both directions, a phone whose date is
  wrong by a year, a day that is 23 or 25 hours long, a timezone change
  mid-session. Streaks and day keys are the whole app's spine.
- **Packs.** The validator is good; it has never been fed a pack with a
  10,000-entry group or a circular reference.
- **Contributed drills.** Every library guard, run against deliberately
  bad data rather than only against the real library.

*Done when:* there is a fuzz corpus in the repo and it runs in CI.

---

### Pass 4 — Edges of a real life

**Problem:** the app was tested on one phone belonging to somebody with
eleven weeks of data.

- **Day zero.** A brand-new install on every archetype: no history, no
  program, no place, no permissions. Several screens have only ever been
  seen with data behind them.
- **Day one thousand.** Five years of journal entries — does anything
  read the whole journal on every render? `hasAnswered()` does exactly
  that, today.
- **The long gap.** Opening the app after 3 days, 30 days, 400 days. The
  ramp's catch-up is capped at 35; what happens at 400 is untested.
- **No permissions.** Notifications denied, location denied, battery
  optimisation on, Do Not Disturb, exact alarms revoked mid-run.
- **The phone fights back.** Process killed mid-write, storage full,
  clock jumped, app updated while a chime was pending.

*Done when:* each has a test, and the ones that cannot be tested have a
device script.

---

### Pass 5 — The seams this wave created ✅ *(22 Sep 2026)*

> **Promoted ahead of 3 and 4 (21 Sep 2026).** Both bugs found since this
> plan was written were seams of exactly this kind — a helper whose cost
> nobody had measured, and two pieces of state disagreeing about who owns
> the screen. Neither was a logic error inside a function, and neither
> would have been found by hostile input or by an edge-case date. The
> evidence says do this one next.

Specific, named, because they are new and nothing has stressed them.

- **`loadFacts()` is now four things at once** — room, injury, packs,
  mode. Every combination should be asserted, including contradictory
  ones (travelling *and* injured *and* no kit).
- **The profile cache.** Module-level, and `store.clearAll()` does not
  clear it — that leaked between tests already. Where else?
- **Demo mode** swaps the global store. Anything holding a reference
  across that swap is a bug waiting. Audit every module-level cache.
- **Density × ramp.** Density scales the ask; the ramp reads share done.
  A month of shape changes should not drift the ladder, and that is
  currently one test.
- **Modes that expire mid-session.** A rest day at 23:59:59. A travel
  mode that lapses while a chime is queued.
- **Who owns the screen.** Every handler that opens a sheet should close
  the others first, and the guard is a test that taps everything and
  asserts one modal. Today and the element pages have this; Settings has
  three independent sheet states and Daily Sets nests one, and neither
  has been checked the same way.
- **Handlers that can do nothing.** A branch with no `else` is a tap that
  flashes and is ignored, which is indistinguishable from a broken app.
  Two were found; the rest have not been looked for.
- **Archetype switching** rewrites packs, shape and every track's enabled
  flag. Done repeatedly, does anything accumulate?

*Done when:* each seam has a test that fails when the seam is broken —
verified by breaking it, as with the element-property guard.

**What it found** (c7c2185, 2df0cac, 04823f1, and this pass's tests):

- **Caches outlived the store.** Round partners lean on a balance worked
  out once a day from the week's history, and that cache survived demo
  mode's store swap: the demo's partners came from the real week, and
  after leaving, the real day kept the demo's. The Undo notice could name
  an entry in the other store. Storage now announces a wholesale change —
  demo swap, clear, restore — and every cache built from it registers to
  drop itself. The profile cache uses that hook instead of demo mode
  resetting it by hand.
- **Sheets over sheets.** Settings opened My day over itself; Daily Sets
  opened the max test, a target and a height over itself; Goals opened the
  Train log, which opened Manage, which opened New Exercise — four deep.
  On the phone a Modal over a Modal loses Back once touched. A dialog
  inside a sheet is now drawn in that sheet's own window (`SheetLayer`)
  and takes Back through its `BackStack`; My day is a page under The day.
  The guards count visible Modals along each path.
- **A mode took up to a minute to matter.** The schedulers watched the
  program, the plan and My day, but not the profile — where modes,
  injuries, packs and places live. A round queued at home could still ask
  for the pull-up bar after "away from home", and "taking the day off"
  still chimed. Both schedulers watch the profile now.
- **Festival Six inherited a festival that had already happened.** Taking
  it a second time kept the first date, and a date in the past is no block
  at all, so the program never started.
- **The combinations hold.** Every (mode × injury × room × packs) builds a
  day whose rounds are all doable, with no track twice in a round, empty
  only when the mode says so. A month of changing day shapes leaves the
  ladder exactly where a month of steady days does.

Not found: handlers that can do nothing (the early returns left are all
behind a disabled control or a message), and archetype switching
accumulating anything.

---

### Pass 6 — Performance and the low-end phone

**Problem:** the target device is a Redmi A3. It has never been measured,
only observed not to be obviously slow.

- **Measure first.** Today's render, the activity model over 5 years,
  storage hydration at 10,000 keys, Daily Sets grouping.
- **Find the full scans.** `hasAnswered`, `daysTrained`, `buildBackup`
  and the stats functions all walk everything; at what size does that
  hurt?
- **The always-on case.** This runs beside a monitor all day. Memory
  after 12 hours, wake-lock behaviour, battery.

*Done when:* there are numbers in a doc, and a regression test on the
worst one.

---

## How to run a pass

The same discipline that worked this wave:

1. **Write the test that should fail.** Not the fix.
2. **Verify it fails for the right reason** — break the thing on purpose
   and watch it go red. Two tests this wave passed for the wrong reason
   and were only caught by doing this.
3. Fix it.
4. Full checks: `npx tsc --noEmit`, `npm run lint`, `npx jest`.
5. Build, install, and look at the screen. Three of this wave's bugs were
   invisible to every test and obvious in a screenshot.
6. Commit one pass at a time, with what it found in the message.

## What not to do

- **Do not refactor while hardening.** A pass that changes structure and
  behaviour at once cannot tell you which one broke it.
- **Do not add features to fix a test.** If a test is hard to write, that
  is usually the finding.
- **Do not chase 100% coverage.** The bugs this wave were in seams, not
  in branches. Coverage would have found none of them.
