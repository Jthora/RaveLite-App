# Copy audit — clarity and directness

*23 Sep 2026. Five read-only audits in parallel — setup and first run, Today
and the chime notifications, Settings, Daily Sets and the character screens,
and the drill library with every error and empty state. About 4,670
user-visible strings read, about 250 flagged. Every finding quoted here was
re-checked by hand against the source. Nothing was changed in the app for
this audit.*

Written for whoever does the rewrites.

## The one-paragraph verdict

The app is not badly written. The drill library is excellent — 511 drills,
under 1% flagged — and the error states, the health checks and the crash
screen are better than most shipped software. The problem is narrower and
worse than bad prose: **the app speaks a private language it never teaches.**
Twenty-eight invented terms — track, rung, par, XP, element, round, window,
slot, My day, Harmony day, max, build, deload, focus — reach the screen, and
almost none is defined anywhere the reader will be standing when they meet
it. On top of that sit three structural faults that produce the specific
feeling of fog: headings whose bodies answer a different question, the same
sentence printed twice on one screen, and internal engineering words leaking
into the highest-traffic strings in the product. Fix the vocabulary and the
three structures and most of the 250 findings dissolve; rewrite sentence by
sentence and you will be here again in a month.

## The standard

1. **Answer the heading in the first sentence.** If the heading asks what a
   thing is, the first sentence is a definition, not a behaviour.
2. **Say what a thing is before what it does.** Noun first, then verb.
3. **Define an invented word at first use, or do not use it.**
4. **A control says what it changes. An error says what to do next.**
   A destructive control names what it destroys, before it runs.
5. **Every number carries its unit.** "Unlocks at 25" is not a sentence.
6. **One thing has one name.** Not "chime" here and "pulse" there.
7. **Cut any word that only sets a mood.** No winks, no reassurance, no
   scene-setting, no metaphor where a literal word exists.

## Root cause 1 — a private language, never taught

This is the bulk of the audit. The word the codebase uses became the word on
the screen, and no screen ever defines it.

| Term | Where a reader first meets it | Defined where they are? |
|---|---|---|
| track | `DailySetsSection.tsx:256`, heading "Tracks" | No — only `a Daily Sets track`, circular |
| XP | `CharacterSheet.tsx:175`, `:206`, `:211` | No |
| par | never printed — shown only as `12/40` | No |
| element | `CharacterSheet.tsx:206`, `DailySetsSheet.tsx:108` | No |
| attribute | `CharacterSheet.tsx:215`, the grid | Only **while the sheet is locked**; the definition vanishes when the grid appears |
| rung / ladder | `info.ts:198`, `:207` "next rung at 15" | No, and the number has no unit |
| window / slot | `SettingsSheet.tsx:565` — the Settings index itself | No |
| My day | `DailySetsSection.tsx:186` | Circular: "Chimes sound inside My day" |
| Harmony day | `CharacterSheet.tsx:205` | Circular |
| max / max test | `DailySetsSection.tsx:281`, `:423` | Only inside the test dialog, in its third sentence |
| BUILD / deload / week N | `DailySetsSection.tsx:182`, the sheet's first line | No |
| good day / test week / focus block | `:576`, `:426`, `tracks.ts:437` | No — "focus block" appears nowhere else in the codebase |
| Sign (Aries, Sulfur, Mercury) | `info.ts:260` | No — and it changes nothing |

**"Level" means three unrelated things within two taps**: the character level
(`CharacterSheet.tsx:171`), an attribute level (`info.ts:238`), and switching
to a harder exercise (`DailySetsSection.tsx:458`, "Level up →"). This is the
cheapest single fix in the audit.

Two definitions do exist, and both are in the wrong place: "attribute" is
explained only on the locked empty state, and the Cardinal/Fixed/Mutable gloss
sits **31 lines below the grid it explains**. `MODALITIES[].gist` in
`attributes.ts:217-233` holds the plain words — "Starting: the first move" —
and is never rendered anywhere in the app.

## Root cause 2 — headings the body does not answer

The owner's diagnosis, and it has a mechanical source. `InfoSheet.tsx:215`
renders `card.what` as the first line under the title with no heading of its
own, so when `what` does not answer the title, nothing else will. Three code
paths fall back to a `what` that does not name the thing:

- `info.ts:358` — `what: EVENT_WHAT[id] ?? event.name`. Tap "what is this?"
  and you are shown the title again.
- `info.ts:310` — falls back to `'Measured the same way every time, so the
  numbers can be compared.'` The card reads "Bike ride", then a sentence
  about comparability.
- `info.ts:303` — `'Something you measure'`, a placeholder that shipped.

The same shape, elsewhere:

- `WelcomeCard.tsx:35` — **`What this is`** → `RaveLite chimes through the
  day.` A behaviour where a definition belongs.
- `ThemePanel.tsx:64` — `▸ THEME` followed by nothing at all. A grid of tiles
  and not one sentence.
- `TutorialCoach.tsx:30` — `This is a chime` → `This is a real chime.` The
  first card a new user reads, restating its own heading.
- `MyDaySheet.tsx:65` — `My day` → `Chimes sound inside My day…`
- `DailySetsSection.tsx:512` — `Max test` → a chest-pain warning. What a max
  test is arrives third, as a trailing clause.
- `healthChecks.ts:74,86,98,124,140` — every check title is phrased as its
  success state, so a **failing** row's title reads as a pass. The code
  comment at `:107` admits this and fixes it only for screen readers.

## Root cause 3 — the same thing said twice

In setup, the step's sub-line and the panel's own caption overlap on **five of
the six question steps**, and the step title duplicates the panel's eyebrow on
four. One pair is word for word:

```
SetupFlow.tsx:121   why: 'These add to the base program. You get the base program either way.'
PacksPanel.tsx:56        'These add to the base program. You get the base program either way.'
```

Roughly a dozen redundant lines. This is why setup reads as padded: the reader
is told everything twice, so nothing lands as important. It is a structural
fix — delete the step `why` where the panel already says it — not a rewrite.

## Root cause 4 — engineering words in the highest-traffic strings

| `path:line` | Current | Should be |
|---|---|---|
| `foregroundService.ts:85` | `Ambient pulses active` | `Chimes are on. Tap to open.` |
| `foregroundService.ts:59` | `RaveLite ambient` | `RaveLite running` |
| `pulsePayload.ts:47` | `Water pulse` | `Water chime` |
| `notifeeScheduler.ts:145` | `Fire reminders` | `Fire chimes` |
| `report.ts:114` | `Schema` / `v8` | `Data version` |
| `backup.ts:117` | `That export is from schema v9…` | `That export was made by a newer RaveLite. Update the app, then restore it.` |
| `ChimesPanel.tsx:94` | `This build has no chime player…rebuilt` | `This copy of RaveLite cannot play chime sounds…Install the latest version.` |
| `KitPanel.tsx:306` | `Show every tile` | `Show everything` |

**`Ambient pulses active` is the most-seen string in the product.** It sits in
the notification shade every waking hour, and neither word appears anywhere
else in the app.

## Not a copy problem — fix this first

**`PlanPanel.tsx:223` deletes the user's whole plan on one tap.**
`onResetDefaults` calls `resetPlanToDefault()` → `savePlan(DEFAULT_PLAN)`,
written to storage immediately. No arming, no confirmation, no undo, and the
label — `Reset to factory defaults` — is device jargon that never names what
it destroys. Every other destructive action in Settings arms first and states
the consequence. `SettingsSheet.tsx:426` is the model to copy.

Three more destructive actions state no consequence when armed:
`KitPanel.tsx:399` (deletes a place's kit and limits), `DataPanel.tsx:408`
(deletes the problem log a bug report depends on),
`SettingsSheet.tsx:607` (restoring the old plan discards the one in use).

## Developer notes that shipped as app copy

- `standards.ts:85` — *"from 2025–2026 calculator and news sites and a Space
  Force chart: the official charts would not load. Close, not final."*
  Forty-eight words, and the middle of it is the author's sourcing trouble.
- `info.ts:303` — `'Something you measure'`, a placeholder.
- `errorLog.ts:58` — renders as `storage.writing: an error that could not be
  described`: a description of a failure to describe.

## Ranked work list

1. **`PlanPanel.tsx:223`** — arm the reset and name what it deletes. Data loss.
2. **The four leaked words in notifications** — `foregroundService.ts:59,85`,
   `pulsePayload.ts:47`, `notifeeScheduler.ts:145`. Highest exposure, smallest
   diff.
3. **Make `MEASURES` and `EVENT_WHAT` exhaustive**, and make the remaining
   `what` fallbacks name the thing. A test asserting one entry per id holds it.
   Kills the fog at its source.
4. **Setup de-duplication** — delete the overlapping `why` lines and eyebrows.
   Removes ~12 lines and shortens the first run.
5. **`WelcomeCard.tsx:35`** — `RaveLite is a training app. It chimes through
   the day, and each chime asks for one small thing: ten push-ups, a minute of
   breathing, a glass of water, one drill.`
6. **One name per thing** — chime (not pulse/reminder), and pick one meaning
   for "level".
7. **Move the two real definitions to where the reader is** — "attribute"
   above the grid permanently; the modality gloss above the columns, or render
   `MODALITIES[].gist`.
8. **`healthChecks.ts` titles** → neutral nouns, with the status word shown to
   sighted users and not only to TalkBack.
9. **Errors that describe but do not direct** — `DataPanel.tsx:43,117,128,140`,
   `healthChecks.ts:150`, `backup.ts:117,124`, `LegEditor.tsx:145`.
10. **Units on numbers** — `info.ts:206,209,239`; doses measured in songs and
    albums (`library.ts:2287,2318,2519,2606`).
11. **`standards.ts:85-89`** — cut the sourcing note.
12. **Track names that name nothing** — `Variants`, `Side`, `Flow`, `Pelvis`.

## The decision that is not mine

Rule 7 as written would cut the ritual vocabulary, and some of it is
deliberate identity rather than fluff:

> `Æther — a Merkaba in lines. Fire's triangle and Water's, crossing. The
> quintessence, the fifth that holds the four.` — `heartVariants.ts:156`

As a theme-picker row it never says what changes, which is a real fault. As
identity it is the thing that makes RaveLite itself, and the store listing
leads with it. These are separable: a picker row can say **"A six-pointed
star, drawn in lines."** and the lore can live in the info card behind it,
where someone has asked for it. But that is a call about what the app *is*,
and it belongs to its author.

The astrology in `info.ts:260` (`Sign: Aries`) is a different case: it changes
nothing, explains nothing, and the code comment says it is the author's frame.
That one is safe to cut on its own merits.

## Already exemplary — the model to copy

The voice this audit is asking for already exists in the app.

- **`healthChecks.ts:72-135`** — the best writing here. A title that is a
  claim, one literal sentence that confirms or denies it, and a fix route:
  *"Android may pause RaveLite in the background. Set its battery use to
  'No restrictions'."*
- **`Guard.tsx:62-86`**, the crash screen — names what broke, bounds the
  damage, gives two next steps. Its own header comment states the rule: *"It
  says what broke rather than apologising."*
- **`dayList.ts:89-92`** — `Paused, did not sound` · `Outside My day, did not
  sound` · `Battery saver, did not sound`. Cause, then consequence, four words
  each, parallel so the reader learns the pattern once.
- **`DataPanel.tsx:183`** — `YOUR DATA` answered by its first five words:
  *"Your data is only on this phone. There is no account to recover it from."*
- **`DisclaimerCard.tsx:38`** — four declaratives, the first a definition.
  This is what `What this is` should have been.
- **`library.ts:61-70`** (Chin Tuck) — the drill type specimen: a purpose that
  names the muscle and the fault, an unambiguous dose, three imperative cues in
  performance order, and the common error negated: *"Slide your head straight
  back, not down, eyes level."*

## Method

Five parallel read-only audits, one per area, each given the same seven-rule
standard and one rule specific to its surface — a notification must be
readable in one second on a lock screen; a settings row must say what it
changes; a drill cue must be executable without a video; an error must say
what to do next. Findings were returned as `path:line` plus exact quoted text,
and the ones quoted in this document were re-verified by hand against the
source. Roughly 4,670 strings read, 250 flagged, 0 files changed.
