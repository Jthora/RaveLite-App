# Audit — what could cause grief, confusion or despair

*21 Sep 2026. Seven read-only audits in parallel — first run, the daily
loop, the program, reliability and data, language and access, structure,
health and safety — about 100 findings, each traced to `path:line`. The
serious ones were re-checked by hand before landing here; one estimate
was corrected (below). Nothing was changed in the app for this audit.*

## The one-paragraph critique

RaveLite was built around one person, and it shows everywhere a stranger
touches it: the author's 05:00 day, their 200 push-ups, their 27-minute
three-mile, their porch, desk and gut, their military tests, their plate
of food, and the alarm-volume chimes that make sense on their dedicated
desk phone and nowhere else. Skip setup, press Back, or tap an archetype
once, and a stranger is quietly handed all of it. Underneath that, the
app's kindest promises — *rest doesn't count against you*, *your streak
survives a day off*, *hurt mode protects the injury* — are broken in the
plumbing: they hold while the mode is on and are forgotten the morning it
ends. And a few things fail silently in ways that would cost real data or
real trust. None of this is a bad idea badly executed; it is a personal
tool that has not yet been un-personalised. The bones are good.

## Stop-ship — before anything else

These can hurt someone, lose their data, or lose them on day one.

1. **Restore does not reliably reach disk.** `restoreBackup` clears and
   rewrites every key with fire-and-forget saves, the clear is itself
   async and can land *after* the new writes, and the app restarts 400 ms
   later (`storage/persistence.ts:73-93`, `data/backup.ts:115-120`,
   `DataPanel.tsx:109-121`). Device checks never pressed "Replace
   everything", so it has never been proven. **Do not uninstall the app
   to switch signing keys (the next step in `docs/next.md`) until this is
   fixed and a restore has been verified on the Redmi.**
2. **Chimes play on the alarm stream through silent mode and Do Not
   Disturb, by default, from 05:05** (`ambient/cueVolume.ts:40-57, 85-87`,
   `RaveLiteDeviceModule.kt:63`, `ambient/types.ts:86-90`). Right for the
   author's plugged-in desk phone; for a stranger's only phone it goes off
   in meetings and wakes the house. Setup never asks when the day runs.
3. **Skip, Back, or an unconfirmed archetype gives a stranger the author's
   program**: every pack including military tests, a 200-a-day push-up
   goal, the desk shape (`profile/repository.ts:154-181`,
   `SetupFlow.tsx:121, 140-148`, `ArchetypePanel.tsx:82-90` — the first tap
   turns the card red and Next discards it).
4. **Hurt mode leaks.** Its protection is inferred from move types that
   miss a lot: a hurt shoulder still gets brick halos (Posture track, rung
   2) and every spinning prop; a hurt wrist still gets crow pose, down
   dog, cartwheels and freezes; there is no neck (`profile/kit.ts:304-312`).
   The only button on the active mode says **Done** and ends it
   (`ModePanel.tsx:86-95`); a day off can't sit on top of an injury, so
   resting ends the protection (`mode.ts` — one mode at a time).
5. **Saturday max-effort tests for everyone from week 1** — "Air Force
   test" push-ups and sit-ups flat out at 05:45, a timed run for anyone who
   skipped, the Marine CFT in week 3 — because the test drills belong to
   no pack (`program/week.ts:63-113, 229-239`, `library.ts:1298-1325`). No
   test drill says to stop for chest pain or dizziness.
6. **Stop cues are cut off.** The chime card shows three cues and the
   notification one (`ChimeCard.tsx` `slice(0, 3)`, `pulsePayload.ts:41`);
   the "sharp pain means stop" and "too hard? hands on the desk edge" lines
   are usually fourth or fifth.

## The themes

### 1. The author's life is everyone's default

- Day 05:00–21:00 and a 05:05 Morning Intent for all
  (`ambient/types.ts:86-90`, `defaultPlan.ts:65-84`); the Night Shift
  archetype can't even save an overnight day (`MyDaySheet.tsx:35`).
- 200 push-ups in track copy whatever the goal (`tracks.ts:51, 86`); a
  27:00 "assumed" three-mile and a B+ target shown to everyone
  (`run/plan.ts:36`, `Goals.tsx:340-360`); 150 active minutes a day
  (`active.ts:16`).
- Military framing in the base program: Saturday test names on Today,
  "PFT pace" push-ups, "the Marine test's plank", "Ammo-can lifts" in the
  Train log (`SetsMeters.tsx:24-27`, `tracks.ts:175, 294, 343`,
  `builtinMetrics.ts:127-157`). Tables fixed to ages 35–40, male by
  default (`standards.ts:85-86, 554-558`).
- A fuel chime twice a day prescribing one body's weight-loss plate and
  "stop at 80% full", scored and counted as missed if skipped
  (`defaultPlan.ts:86-100`, `library.ts:3105-3122`) — risky for anyone
  with an eating-disorder history, and wrong for ravers who dance all
  night.
- Copy for one body and one house: "the gut belt", "see yourself lean,
  light and strong", porch pull-ups for a doorway bar, "what a desk did
  to you" for a night worker, "MY CORRECTIONS" hard-wired to the author's
  three, Air's Library pre-filtered to them, "▸ PLAN · OPERATOR BASELINE".

### 2. Promises of mercy, broken in the plumbing

- **Rest and modes are read as quitting once they end.** The review asks
  "is a mode on *now*?", and a rest day's recorded empty ask falls back
  to a full ask (`program/repository.ts:261-263, 274`). A day off blocks
  the next step up; a festival weekend or a cleared injury comes back as
  "Back from a break" at 80%; a traveller's home-only tracks are cut.
  Turning a track off and on does the same. *Found by four of the seven
  audits independently.*
- **Days switched off in My day count as failed training days**, so a
  Mon–Fri person tops out at 71% and never levels up
  (`setScheduler.ts:164-175, 247-248`). "Only some days" can't say which
  days, so the Parent is "back from a break" every week.
- **"Your streak survives it" — it doesn't**, and the streak also reads
  zero every morning until the first Done (`activity/stats.ts:123-149`).
  Attributes keep decaying through an injury (`attributes/repository.ts:100-129`).
- **Paused chimes count as missed** and fill "Catch up N"
  (`useTodayModel.ts:171-174`); "Till morning" tapped after midnight
  pauses for 29 hours (`pause.ts:28-34`); a second **+5** silently throws
  the chime away and it later shows as missed (`pulseQueue.ts:295-298`).
- **Skip says "not today" but the sets come back** in later rounds with no
  label (`schedule.ts:165-180`); the Daily Sets total never shrinks, so an
  interrupted day can't be finished honestly (`setsSummary.ts:42-51`).
- **The Comeback and the Festival Six promise programs that don't exist**
  (`blockWeeks` is read by nothing).

### 3. Day one feels like failure

- Finish setup at 14:00 and Today already says **"Catch up 8"**, listing
  chimes from before the app existed; the first round is "Round 6 of 9"
  (`useTodayModel.ts:163-192` — `setUpAt` is never read).
- Finish after 21:00 and the "real chime" tutorial is suppressed; the coach
  says "do it now" over "NO MORE CHIMES TODAY" (`pulseQueue.ts:166-176`).
- "9 chimes a day" is really about twenty — the preview counts only rounds
  (`preview.ts:30-39`).
- The notification prompt appears over the disclaimer at cold start; a
  denial is visible only inside Settings (`HeartScreen.tsx:27-31`).
- Killing the app mid-setup means setup never returns
  (`repository.ts:309-317`); the "starting point" locks itself because the
  tutorial chime counts as history (`hasAnyHistory`).
- Setup speaks in "par", "tracks", "points", "Harmony day" before
  explaining any of them; the disclaimer says four questions, there are
  five.

### 4. Too hard for a beginner, and no way down

- "New to this" halves the numbers but keeps the author's rungs: full and
  diamond push-ups, porch pull-ups (`program/repository.ts:37-43`) —
  though `docs/public-beta.md` marks "starting rungs from setup" done.
- **No ladder can be stepped down**; "Level up" can offer a rung the room
  can't do and halve the sets on the same drill for good
  (`DailySetsSection.tsx:402-413`, `progression.ts:195-207`).
- The chime has Done, +5 and Skip — no "hurts". A pain-skip later reads
  "Eased: 55% done".
- Explosive work first thing at 05:45 with no warm-up; the Challenge chart
  turns aerial tricks into a 3-minute round without rest.

### 5. Things fail silently

- **Restore** (stop-ship 1). **Export/restore also turns numbers and
  switches into strings**, so muted elements chime again, DND respect
  resets, height is lost (`data/backup.ts:41-49`).
- **Chimes stop when the OS kills the app** outside My day, and nothing
  notices; no boot receiver, a failed service start is never retried, and
  "Stay alive" still says all set (`ambientLifecycle.ts:26-40`).
- **Storage**: AsyncStorage's 6 MB default and every persist error
  swallowed (`persistence.ts:77-92`). *Correction:* an auditor estimated a
  year to fill; the author's real export is 244 KB after 11 weeks, so it
  is years, not months — but when it fills, saving stops without a word.
- The Train log, program and profile fall back to empty on a parse error
  and then overwrite the good copy (`training/repository.ts:227-274`).
- Health problems (notifications revoked, alarm volume 0) show only deep
  in Settings; weather quietly vanishes after 48 h offline, taking the
  storm and heat checks with it; demo mode is invisible and eats logs.
- "Set up from scratch" stays armed across visits — one tap from erasing
  everything, under a heading that invites the unsure
  (`SettingsSheet.tsx:121, 322-329`).

### 6. Structure and navigation

- Settings opens Weather and Plan as sheets over itself — the pattern its
  own header says breaks Back; Goals → Log a test → Manage stacks four
  deep.
- Back in the circuit editor closes Practice and leaves an "Untitled"
  circuit behind; Undo lives under every sheet, so a mis-tap inside one
  can't be undone there.
- One session, six doors (chime, Try this now, Library, Practice, Session,
  + Log), several ledgers that disagree (push-ups via + Log don't move the
  Push meter).
- Newcomers can't find things: the element tiles have no names; Settings,
  Practice and Log sit below twenty day rows; Goals and the Character sheet
  hide inside Daily Sets; the Water page never mentions the prop paths.
- Two switches for one thing: global "Quiet flat" overrides per-place
  limits; a flow prop needs both the pack and the tile, and says "adds
  nothing" when the pack is off; travel mode drops carried props (poi go
  missing on holiday); weather still assumes every indoor room is a
  low-ceilinged basement.

### 7. Words and access

- **Any logged run gets a letter grade down to F**, from "Operator's
  whiteboard" table, pack or no pack (`training/grading.ts`,
  `TrainingLogSheet.tsx:290-300`); the "last week's sets" goal is graded
  F too, including weeks spent hurt.
- Raw codes on screen (UCS, APT, HOURGLASS, NOFLOOR, AMRAP, "3-mi equiv",
  "DELOAD + TEST WEEK"); zodiac and alchemy leading the attribute cards;
  a circuit called "the Pentagram" in an app whose own rule says no
  religious glyphs.
- `textMuted` (#4A5161) is 2.4:1 on the background — the "why" lines in
  setup, the water card and every Settings caption are nearly unreadable
  on a mounted phone.
- TalkBack: upcoming day rows announced as "Keep or remove…", track
  toggles read only "On/Off", Stay alive titles claim success while
  failing, no headings anywhere, no live announcement when a chime
  arrives, Settings reachable only after every day row.
- Meaning by colour alone: chart-clear dots, element tiles, the red
  active-minutes bar. The circuit screen pulses and flashes regardless of
  the Still setting.
- The README points to menu paths that no longer exist — including the
  backup it says matters most.

## Fix order

**Phase 0 — protect data (before the signed-build switch).**
Atomic, verified restore (one awaited `multiSet`, synchronous clear, read
back, then restart), typed export/import, persist and hydrate errors
logged and surfaced, a raised AsyncStorage size, keep-a-copy on parse
failure, "Set up from scratch" disarms on close. Verify a real restore on
the Redmi with a throwaway copy first.

**Phase 1 — a stranger is safe on day one (before public beta).**
New installs: chimes follow silent mode and DND (the author's phone keeps
its alarm route — it is a stored choice); setup asks when the day runs and
allows overnight days; Skip, Back and one tap give a gentle default (base
program, no packs, goal 100, "new"); Back steps back; Saturday tests only
with the military pack, after a few weeks, with a stop line first; fuel
checks opt-in with the plate and "80% full" gone; hurt mode by explicit
regions per drill, a neck region, "End" not "Done", injury stacking under
other modes, a see-a-professional line; safety cues always shown first;
beginners start at rung 0 and every track can step back down.

*Done 21 Sep 2026* (fa74d7e, 8ba15f8, 1593554, c13d772, 5d04b80, cbe2a82).
Checked on the Redmi: the author's phone kept its alarm route, its plan
and its meal check-ins, and Today did not change; a throwaway install
walked setup (Back steps back, an overnight day saves) and landed on a
six-chime base program. Still open from this list: the notification
prompt shows over setup and again after it (Phase 3, with the other
first-run items).

**Phase 2 — make the mercy real.**
Record per-day rest (mode, pause, My-day day off) and skip those days in
the ramp, the streak and attribute decay; honour My day's days in the
program; paused and never-sounded chimes get their own quiet status and
leave Catch up; install day starts at install; Skip releases its sets;
fix the second +5, "Till morning" after midnight, and stale notifications;
a heartbeat that tells the truth when chimes didn't sound.

*Done 21 Sep 2026* (6731650, 03fba31, 81276ed, 6557e4f and the heartbeat
commit). Rest days are written down as they happen (`profile/restDays.ts`)
and left out of the ramp, the streak and attribute decay; a day's
recorded asks are taken at their word; My day's days are honoured;
chimes that never sounded (paused, outside My day, app closed) are their
own row and out of Catch up; Skip lets its sets go; the setup day starts
at setup. Still open: a boot receiver, so chimes come back after a
reboot without opening the app (native, needs a reboot test on the
phone), and the Comeback and Festival Six block programs, which are
described but not built.

**Phase 3 — say it plainly, and un-personalise.**
No letter grades outside the military pack; take the author's numbers out
of copy (derive from the person's goal); human names for flaw codes and
"My corrections" from their own; jargon explained where it first appears;
count every chime in the preview; name the element tiles and bring
Settings and Practice up; pages inside sheets instead of sheets over
sheets; one ledger per question.

**Phase 4 — everyone can use it.**
Contrast (`textMuted` for borders only), TalkBack labels, roles and
headings, a live region on the chime card, non-colour cues, reduce-motion
in the circuit, README paths.

## Protect these in every fix

- **Misses are quiet**: dimmed, never red; "did it but didn't tap Done?"
  logs honestly at the chime's own time.
- **The disclaimer comes first**, even for people who skip; setup *is*
  the Settings panels; the new-install check needs three independent
  signals.
- **The ramp's humane core**: shares not counts, credit capped at the ask,
  a floor of two sets, deload weeks that hold, density applied at
  prescription and never to the ladder, and plain sentences for why the
  sets moved. The fix is in how it learns about rest, not in its rules.
- **One sheet at a time**, views inside sheets, voids instead of deletes,
  one day list from every source.
- **Practice paths**: nothing locked, no fail state, clears only add.
- **Honest health probes** that say "unknown" rather than "ok", backup
  chimes that share the live chime's identity, DST-careful day maths.
