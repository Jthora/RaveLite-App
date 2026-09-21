# RaveLite in public

How a one-person app becomes an app other people can use, without changing
the app the author uses.

> For Ravers and Super Heroes: training to be fit for the rave, ready for
> intensive dancing, able to defend yourself, and of balanced and
> positively energised spirit.

Written 20 Sep 2026, after the app had been in daily personal use for a
week and the operator asked to open it up.

## Decisions already made

| Decision | Made | Why |
|---|---|---|
| **Apache-2.0** (was CC0) | 20 Sep 2026 | CC0 grants no patent rights and some organisations reject it; Apache-2.0 stays permissive, adds the grant, and is what a project taking pull requests is expected to carry. Releases already out under CC0 stay CC0. |
| **Firebase App Distribution** for the beta | 20 Sep 2026 | Free, invite-based, no store review, auto-updates for testers. |
| **Today does not change** | 20 Sep 2026 | The operator's hard constraint. Everything here lives in onboarding, Settings, and data — never in the home screen's shape. |
| **Android first** | — | The always-on screen, the alarm-stream cues and the location fix are a Kotlin native module. iOS is a port, not a build flag. |

## 1. What is actually author-only, measured

Counted from the library and track catalog on 20 Sep 2026 (186 drills, 17
tracks):

| Kit the user has | Drills they can do |
|---|---|
| Floor only (no mat, no outdoor, no bar) | **99 / 186** |
| Mat, indoors | **142 / 186** |
| Mat and a doorway bar | **157 / 186** |
| Mat, yard, porch edge, bricks, streets (the author) | 186 / 186 |

Worse than the drill count: **two whole tracks die without a hang point.**

| Track | Rungs needing a hang point | Left |
|---|---|---|
| **Pull** | 4 of 4 (scap pulls, negatives, porch pull-ups, brick-pack pull-ups) | nothing |
| **Hang** | 3 of 3 (dead hang, active hang, one-arm assisted) | nothing |
| **Leg-ups** | 2 of 6 (hanging knee and leg raises) | the first two rungs and the last two |
| **Row** | 1 of 4 (inverted rows) | three |

That matters more than any other gap, because the program's own rule is
"every push is balanced by a pull". Without a substitution ladder, a
flat-dweller gets a push-only program — the exact thing the design exists
to prevent.

Other author-shaped assumptions:

- **The day**: awake 05:00–22:00, at a desk, about 20 chimes. An office
  worker can answer maybe three.
- **The goals**: USMC/USAF/USSF B+ and 200 push-ups a day. Meaningless to
  discouraging for most people.
- **The body**: the Posture, Pelvis and Breath tracks encode the author's
  own corrections (UCS, APT, Hourglass). Good defaults for desk workers,
  but presented as fact.
- **The guard test** `library.test.ts` asserts no drill needs a gym,
  weights or a pool — that is the *author's* constraint, not a universal
  one.

Good news, from the same audit: **"operator" never appears in
user-visible copy** (only in comments and docs), there is no server, no
account and no telemetry, and everything that differs between people is
already data — plan windows, track flags, library tags, goal targets.
That is why the interface does not have to change.

## 2. The model: four boxes, sorted by lifetime

Settings sprawl happens when everything becomes one flat list of toggles.
Sort by how long a choice lasts and it stays teachable.

| Box | Lifetime | How many at once | Example |
|---|---|---|---|
| **Facts** | until life changes | — | a doorway bar; a quiet flat; 05:00 wake |
| **Archetype** | months | exactly one | The Raver |
| **Packs** | weeks | many | Dance · Martial basics · Military tests |
| **Modes** | hours to days, self-expiring | zero or one | Travelling · Injured · Festival |

Facts gate what is *possible*. The archetype sets what is *emphasised*.
Packs decide what *exists*. Modes override *right now*. Those four are
also the top level of Settings, so the mental model and the menu match.

## 3. Data shapes

New module `src/domain/profile/`:

```ts
// profile/kit.ts
export type KitItem =
  | 'floor' | 'mat' | 'wall' | 'doorway' | 'chair' | 'stairs'
  | 'hangPoint'            // bar, porch edge, beam, branch
  | 'bricks'               // or any carryable load
  | 'staff' | 'rope' | 'ball'
  | 'yard' | 'streets';    // outdoor space of each kind

export type Noise = 'quiet' | 'normal' | 'free';   // quiet = no jumps, skips, staff

export interface Facts {
  kit: KitItem[];
  noise: Noise;
  /** Corrections the program leans on; all optional. */
  corrections: ('UCS' | 'APT' | 'Hourglass')[];
  heightInches?: number;
}

// profile/day.ts
export type DayShapeId = 'desk' | 'office' | 'shift' | 'weekend' | 'custom';
export interface DayShape {
  id: DayShapeId;
  /** Windows the app may chime in, local time. */
  windows: {start: string; end: string; days: number[]}[];
  /** Roughly how many chimes a day this shape can carry. */
  density: number;
}

// profile/archetype.ts
export interface Archetype {
  id: ArchetypeId;
  name: string;
  promise: string;          // one line, shown on the card
  emphasis: string[];       // three bullets
  packs: PackId[];
  tracks: Partial<Record<TrackId, boolean>>;  // overrides the defaults
  day: DayShapeId;
  goals: GoalGroupId[];     // which Goals sections show
  /** Blocks with an end date (Comeback, Festival Six). */
  block?: {weeks: number; endsOn?: 'date'};
}

// profile/mode.ts
export interface Mode {
  id: 'travelling' | 'injured' | 'festival' | 'rest' | 'deload';
  startedAt: number;
  expiresAt: number;
  /** Injured: the region that must not be loaded. */
  region?: 'shoulder' | 'elbow' | 'wrist' | 'back' | 'hip' | 'knee' | 'ankle';
  /** Temporary kit override, e.g. a hotel room. */
  kit?: KitItem[];
}

export interface Profile {
  version: 1;
  facts: Facts;
  day: DayShape;
  archetype: ArchetypeId;
  packs: PackId[];
  mode?: Mode;
  /** Set once, so setup is never shown twice. */
  setUpAt?: number;
}
```

Storage: one blob at `KEYS.profile` (`profile.state`), same pattern as
`program.state`. **Migration v8** writes the author's current behaviour as
an explicit profile — kit `['floor','mat','wall','doorway','chair','stairs','hangPoint','bricks','staff','yard','streets']`,
noise `free`, corrections all three, day `desk`, archetype `operator`,
every pack on — so an existing install changes nothing.

## 4. Gating: every place that must respect the kit

| File | Today | Must become |
|---|---|---|
| `reminders/scheduler.ts` `candidatesForSlot` | filters element, Test tag, maxSeconds, requiredTags | + allowed venues, + noise, + injured region |
| `program/tracks.ts` | fixed ladders | each rung tagged with what it needs; `requires` on the track |
| `program/progression.ts` `currentRung` | index into the ladder | index into the **available** ladder for this kit |
| `program/rounds.ts` `PARTNER_POOL` | fixed partners | filtered by kit and noise |
| `program/week.ts` morning blocks | fixed three pieces a day | substitute a piece the kit cannot do |
| `conditions/adapt.ts` `indoorAlternative` | venue-aware already | + kit-aware |
| `activity/practice.ts` `SKILL_GROUPS` | whole curriculum | hide what the kit cannot do, show what a pack adds |
| `standards/standards.ts` | all events always | only the chosen goal groups |
| `exercises/__tests__/library.test.ts` | "no gym kit" guard | "the default pack is bodyweight; packs may require kit" |

One helper does the work everywhere:

```ts
// profile/can.ts
export function canDo(drill: Exercise, profile: Profile): boolean;
export function allowedVenues(facts: Facts): Set<Venue>;
export function silenced(drill: Exercise, noise: Noise): boolean;   // jumps, skips, staff
export function loads(drill: Exercise, region: Region): boolean;    // for Injured mode
```

## 5. Track substitutions (the hard part)

Every track needs a ladder that survives a missing hang point or missing
load. Proposal — new field `ladders: {requires?: KitItem; rungs: Rung[]}[]`,
first ladder whose requirement the kit meets wins:

| Track | With a hang point | Without |
|---|---|---|
| **Pull** | scap pulls → negatives → pull-ups → weighted | **doorway rows → table rows → one-arm table rows → towel-door rows** (all existing drills except the last, which is new) |
| **Hang** | dead hang → active hang → one-arm assisted | **towel-door hold → chair-supported hold → dead-bug hold** (needs 1–2 new drills) |
| **Leg-ups** | dead bugs → leg raises → hanging knee/leg raises → wipers → dragon flags | dead bugs → leg raises → **reverse crunches** → wipers → dragon flags |
| **Row** | doorframe → one-arm → table → inverted | doorframe → one-arm → table (inverted rung hidden) |
| **Carries** (partners) | bricks | **a loaded backpack**, or hidden |
| **Squat, Push, Variants, Crunch, Side, Plank, Posture, Breath, Mobility, Stillness, Pelvis, Kick range, Flow** | unchanged | unchanged — these need nothing but floor |

New drills required: `fire.towel-door-row`, `earth.towel-door-hold`,
`earth.reverse-crunch`, `earth.backpack-carry`. Four drills unblock every
kit.

## 6. Volume that scales with the day

The adaptive ramp reads "share of prescribed sets done" over 7 days, which
stays valid at any density — but the *prescription* must shrink or a
6-chime user is permanently at 40% and never levels up.

- `TARGET_ROUNDS` (9) becomes `roundsFor(day.density)` — 9 for a desk day,
  6 for an office day, 4 for a parent day, 2 for weekend-only.
- `baseSets` per track scales with the same factor, floored at 1.
- The ramp's thresholds (85% up, 60% down) do not change: they are shares.
- Par (20 points per element) scales too, or Harmony becomes unreachable
  for short days — `DAILY_PAR = 20 * densityFactor`, rounded to 5.

## 7. Goals, per person

`GOAL_GROUPS` already splits into tests / air / heart / earth / water. The
archetype picks which groups show. The military group becomes opt-in, and
targets derive from the user's own tested max where a chart does not
apply. The push-up ramp's "200 a day" becomes `archetype.pushupGoal`,
default 100, the author's 200.

## 8. The UX

### 8.1 First run: five questions, no typing

Full-screen, one question per card, **every answer pre-selected** so Skip
is always safe:

1. **"What do you train on?"** — a tile grid of kit, using the app's own
   move icons in element colours. Each tile says what it unlocks:
   *"Bar or porch edge — unlocks 15 drills and the Pull track."*
2. **"Can you be loud?"** — Quiet flat · Normal · Free, each with its
   consequence written out.
3. **"When can you be interrupted?"** — four day shapes drawn as small
   timelines: Desk · Office · Shift · Weekends.
4. **"What are you training for?"** — the archetype cards.
5. **"Anything to fix?"** — desk posture · tilted pelvis · breathing ·
   nothing.

Then a sixth screen that is not a question: **"Here's your day"** — the
real generated chime list, a line reading `12 chimes · 6 tracks · first at
07:10`, and one button: **Start**.

**The mechanic that makes it feel designed:** a live preview strip at the
bottom of every card, updating as tiles are tapped — `9 chimes · 4 tracks
· 62 drills`. The same strip appears in Settings as a diff when anything
changes: **"+14 drills · Pull track on · 2 more chimes"**.

### 8.2 Settings is the same five cards

No second UI. Settings opens the identical cards plus the rest, in four
groups that match the model:

- **You** — kit · noise · day · corrections · body numbers
- **The day** — chime density · windows · quiet hours · weather rules
- **The program** — archetype · packs · tracks · goals · tests
- **The app** — theme · alive · notifications · data and privacy

Everything advanced (per-slot editing, ramp thresholds, par) hides behind
one **Advanced** disclosure per group. Every row gets the same **ⓘ card**
drills and tracks already use — no new explanation pattern.

### 8.3 Modes

A "Today I'm…" row at the top of Settings, and — only while a mode is
active — one chip on Today. Nothing else about Today changes.

| Mode | Does | Expires |
|---|---|---|
| Travelling | kit → floor + wall; quiet; no outdoor | in N days |
| Injured (region) | drops drills loading that region; **pauses the ramp** rather than reading rest as failure | when cleared |
| Festival | hydration, recovery, feet and sleep; volume down; dancing counted | after the weekend |
| Rest day | water and the evening review only; **streak survives** | midnight |
| Deload | the program's own deload, surfaced | end of week |

### 8.4 The tutorial is a real chime

Not a slideshow. Within a minute of setup, fire a genuine chime the kit
can certainly do ("Chin tucks · 10"), and coach the three taps that are
the whole app: **Done · +5 · Skip it**. Then open one info card. Then say
so: *"That's it. The rest is more of that."* Skippable, resumable, never
shown twice.

Hold the character sheet back until level 2 or day 7 — "your sheet
unlocked" beats a grid of zeroes.

### 8.5 Copy rules

- Every setting says what it does **to your day**, not what it is.
  "Quiet flat → no jumping, skipping or staff" not "Impact: low".
- Never imply the author's numbers are the standard. Targets are yours.
- Nothing shames a miss. The ramp already adjusts; the copy should say so.

### 8.6 Accessibility and locale, before the beta

- °C/°F, km/miles, kg/lb, 12/24-hour.
- Respect system text scaling; nothing fixed-height that holds text.
- Every control has an accessibility label naming what it does.

## 9. Archetypes

One at a time; each is a bundle of packs, tracks, a day shape and goals.

| Archetype | For | Leads with | Chimes | Goals |
|---|---|---|---|---|
| **The Raver** | fit for the floor, all night | dance, stamina, flow, hydration | ~12, late | rave endurance, no-drop flow, skips |
| **The Guardian** | able to defend yourself | strikes, blocks, kicks, strength | ~15 | pull-ups, plank, martial marks |
| **The Monk** | balanced, calm, mobile | breath, stillness, tai chi, range | ~8, quiet | breath holds, still sit, deep squat |
| **The Operator** *(author)* | the whole standard | everything, military tests | ~20 | USAF · USSF · USMC B+ |
| **The Desk Rebel** | undo the chair | posture, hips, eyes, micro-sets | ~16, work hours | posture holds, waist-height |
| **The Comeback** | back from injury or years off | joint prep, tiny doses, graded exposure | ~8, forgiving | own marks only |
| **The Flow Artist** | staff, poi, juggling, performing | dexterity, off-hand parity, presence | ~10 | no-drop time, off-hand parity |
| **The Night Shift** | inverted days | light timing, sleep protection | ~12, shifted | sleep window, own marks |
| **The Parent** | ten minutes at a time | floor-free, interruptible, kid-safe | ~6 | own marks |
| **The Festival Six** | a date on the calendar | six-week block: dance volume, feet, sleep | ~14, time-boxed | event-day readiness |

**Comeback** and **Festival Six** introduce time-boxed programs with an end
date. The block engine already exists (4-week blocks with a deload); this
exposes it with a finish line.

**Parent** is the hardest constraint and therefore the best test of whether
the architecture is honest.

## 10. Packs

Content bundles, many at once, each a list of drill ids and the tracks it
turns on. A pack is pure data, which is what makes a contributed pack
possible without touching app code.

**Shipped (20 Sep 2026):** `dance` · `martial` · `staff` · `yoga-taichi` ·
`jumps` · `military-tests` · `runs`.

**Three from this list were dropped**, with the operator's agreement:

- `hangs-pulls` and `bricks-carries` are already gated by kit in Phase 1 —
  no hang point substitutes the Pull ladder, no bricks means no carries. A
  pack over the top would be a second switch for one thing, and two
  switches for one thing is how a settings screen starts lying.
- `desk-fixes` is the Posture and Mobility tracks, which are base. As a
  pack it would be nearly empty, and turning it off would mean offering
  someone a program with no posture work.

The load-bearing rule: **a drill in no pack is always there.** Turning
every pack off leaves a complete program — push, pull, squat, hinge,
breath, posture, stillness, mobility — and a test asserts exactly that,
in every element.

## 11. Testing

| Test | Guards |
|---|---|
| **Author preset golden test** | the author's profile still generates exactly today's program — the promise that opening this up changes nothing for them |
| **Every archetype yields a valid day** | no archetype produces zero chimes, an impossible drill or an empty track |
| **Kit property test** | for each of ~8 kit combinations: every prescribed drill passes `canDo`, and every enabled track has a usable ladder |
| **Noise test** | quiet flat never sees a jump, skip or staff drill anywhere: rounds, partners, morning block, Try this now, Practice |
| **Injured test** | a named region never appears in any prescription, and the ramp pauses |
| **Density test** | a 6-chime day yields proportional sets and a reachable par |
| **Migration v8** | an existing install lands on the author preset and its program is unchanged |

## 12. Beta operations

**Distribution**

1. **Firebase App Distribution** (chosen) — invite testers by email, they
   install without a store account, auto-update on each release.
   Needs: a Firebase project, the `com.raveliteapp` app registered, a
   release keystore kept **out of the repo** (CI secret or local only),
   and a `fastlane`/gradle task or the console upload.
2. **GitHub Releases** alongside, with an APK attached, for people who
   would rather sideload or use Obtainium.
3. **F-Droid** later: needs a reproducible build and a merge request.
   Highest legitimacy with this app's likely audience.
4. **Play open testing** if it ever wants reach: $25 once, a data-safety
   declaration, and — for new personal accounts — the 12-testers-for-14-days
   rule.

**Repo, before inviting anyone**

- [x] Apache-2.0 licence, NOTICE, README licence section (20 Sep 2026)
- [x] "No warranty, not medical advice" in the README
- [x] `CONTRIBUTING.md` — what is welcome, the check commands, the house
      style (the docs and comments say *why*, tests are named as sentences)
- [x] Issue templates: bug, drill suggestion, archetype suggestion
- [x] `CODE_OF_CONDUCT.md`
- [x] A screenshot set — automated end to end via demo mode
      (`scripts/screenshots.py`), so no real training is photographed
- [x] Confirm no release keystore, no secrets (`debug.keystore` is the
      standard public one and is fine)
- [x] A `SECURITY.md` pointing at issues, since there is no server

**In the app**

- [x] A data and privacy panel in Settings: what leaves the phone (a
      rounded location to Open-Meteo, nothing else), **Export** (the whole
      store as JSON, through the system file picker), **Restore** (two-tap,
      replaces rather than merges) and **Start over** (20 Sep 2026).
      *Pulled forward from Phase 4:* release builds are debug-signed today,
      so the first properly signed build would fail to install over an
      existing app and the only fix would be an uninstall — which takes the
      journal with it. The export has to exist before the keystore does.
- [ ] A feedback route that needs no account: export + share sheet, and a
      link to the issue tracker.
- [ ] A disclaimer on first run, once, in the setup flow.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Settings soup | four boxes, five setup questions, Advanced hidden |
| A flat-dweller gets a push-only program | the substitution ladders in §5 — the highest-value work in this plan |
| The ramp stalls on short days | density scaling in §6 |
| Strangers hurt themselves | conservative defaults, disclaimer, "stop if it hurts" in cues, no archetype that starts hard |
| The author's app changes under him | the golden test in §11 |
| A signing-key change orphans an installed app | export/restore shipped before the first signed build; the restore is exact, not a merge |
| Maintenance load on one person | CONTRIBUTING sets expectations; "beta, no support promised" |
| Content quality drifts as packs arrive | the library guards stay: every drill needs purpose, cues, dose, venues, a pictogram and an attribute mapping |

## 14. Phases

**Phase 0 — presentable** *(no app changes)*
- [x] Apache-2.0, NOTICE, README licence and disclaimer
- [x] CONTRIBUTING, code of conduct, issue templates, SECURITY
- [x] README rewritten (21 Sep 2026, leading with the identity);
      screenshots automated but not yet taken for the README
- [x] Export/restore, so a key change can never cost anyone their data
      (20 Sep 2026)
- [ ] Firebase project, release keystore off-repo, first tester build

**Phase 1 — not author-only** *(the real work)*
- [x] `profile/` module: `Facts`, `canDo`, `usableDrills`, `unlockCount`,
      storage, migration v8 (20 Sep 2026)
- [x] Six stand-in drills: isometric door pull, towel door row, feet-up
      towel row, table edge hold, towel pinch hold, reverse crunch
- [x] Per-rung `instead`, and `currentRung(track, state, facts)` that takes
      the stand-in at the same step, else the highest step below it the
      room can do, else nothing — and `prescribeDay` skips a track whose
      whole ladder is out of reach
- [x] Tests: kit gating, noise, injury, unlock counts, a program for five
      rooms, and the author golden test
- [x] Gating in the scheduler, round partners, morning block, practice
      curriculum and indoor swaps — all through the one `canDo`
- [x] Kit card in Settings: tiles saying what each would unlock, and the
      noise setting

**Closed 20 Sep 2026:** the starting-rung gap below is answered by the
setup question "where are you starting" (`profile/starting.ts`), which
scales the seeded maxes once.

**What Phase 1 exposed:** substitution is at the *same step of the
ladder*, which is right — but the step a track *starts* on is calibrated
to the author. A flat-dweller's Pull therefore starts at "feet-up towel
rows", the stand-in for porch pull-ups, because that is where the author
stands. Nothing about that is specific to substitution: the author's
starting rungs were always going to be wrong for a stranger. **Setup must
set the starting rung** — "how many push-ups can you do?" — which belongs
with the archetypes in Phase 3.

**Phase 2 — fits a life**
- [x] Day shapes and density; `roundsFor`, set and par scaling, chosen in
      Settings (20 Sep 2026). One deviation from §6: par floors at 10
      rather than rounding freely to 5, because the one-set-per-track
      floor keeps the shortest day at ~⅓ of a full day, not ⅕.
- [x] Windows editor with the timeline graphic — it already existed
      (`PlanRibbon` + `WindowEditor` + `SlotEditor` + `TimeRangeSlider`);
      what it needed was to work. `ELEMENTS[id].label` does not exist, so
      every slot row in it rendered a glyph followed by nothing. Fixed at
      five call sites, with a guard test (20 Sep 2026).
- [x] Modes: travelling, injured, festival, rest; ramp pause (20 Sep 2026).
      Deload is not a stored mode — it is computed from the program week,
      so offering it as a thing to switch on would let it disagree with
      itself.
- [x] Tests: density, injured, and every mode's own promise

**Phase 3 — someone else's app**
- [x] Archetypes (10) as data, with the picker card and a two-tap take
      (20 Sep 2026). `tracksOff` is subtraction, not a whitelist.
- [x] Packs as data (7 of 10 — see §10), gated through `canDo`, with the
      curriculum derived from them so the two lists cannot drift
      (20 Sep 2026)
- [x] Goals per archetype; the push-up goal off 200 (20 Sep 2026). The
      test group follows the `military-tests` pack.
- [x] Setup flow and the live preview strip (20 Sep 2026) — the cards are
      the Settings panels themselves, so there is no second UI
- [x] The first-chime tutorial — a real chime, not a slideshow
      (20 Sep 2026)
- [x] Character sheet held back to level 2 — or seven days trained,
      whichever comes first (20 Sep 2026)
- [x] Tests: every archetype yields a valid day — plus the load-bearing
      one, that every pack off still leaves a complete program, and three
      independent guards on who gets shown setup (20 Sep 2026)
- [x] Starting rungs from setup, closing the gap Phase 1 exposed
      (20 Sep 2026)

**Phase 4 — contributors**
- [x] Pack format documented (`docs/packs.md`) with a validator that
      tells a contributor what is wrong in their words, a worked example
      that is itself under test, and the same rules applied to every pack
      this app ships — so there is no second standard for built-in
      content (20 Sep 2026). Packs ship as source and are reviewed like
      any other change; there is no sideloading in the beta, and the doc
      says so.
- [x] Units, guessed from the phone and never re-guessed (20 Sep 2026).
      Temperature keeps its existing C/F toggle; test distances stay in
      the units their charts are written in.
- [x] Text scaling pass — capped at 1.35, verified on the device at 1.3×
      (20 Sep 2026)
- [x] Data export, restore and wipe; privacy copy *(done early — see §12)*
- [~] F-Droid submission — audited and prepared (`docs/f-droid.md`):
      no proprietary dependencies, no anti-features, Flipper confirmed
      absent from the release APK, store metadata written. The submission
      itself needs a public repo, tags, screenshots and a GitLab account,
      so it waits on the operator (20 Sep 2026).

## 15. Open questions for the operator

0. ~~**How public should the positioning be?**~~ **Answered 21 Sep
   2026:** lead with the rave identity on every surface, and the name
   stays. See `docs/releasing.md` § What it says it is.
1. **Names** — are Raver / Guardian / Monk / Operator the shipping names,
   and do the six new ones earn their keep?
2. **Your preset's name** — "The Operator" is what the docs call you.
   Ship it, or keep it private?
3. **The Starcom mark** — your personal Star Commander mark is one of the
   five Core marks. Does it ship with the public app?
4. **The plan versions** — RaveLite Plan 1.0–3.0 stay out of app copy.
   Still true in public?
5. **How much do you want to own?** A public beta brings issues. Is this
   "here it is, no promises", or a project you intend to steward?
6. ~~**Does the beta include the author's data?**~~ **Answered 21 Sep
   2026:** a demo profile, seeded into a throwaway store that never
   touches the real one. `scripts/screenshots.py` uses it.
