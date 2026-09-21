# Contributing to RaveLite

RaveLite is a five-element altar for Ravers and Super Heroes — one
person's training app, opened up. Contributions are welcome; so is
forking it and making it yours, which is what Apache-2.0 is for.

Before proposing anything, know what it is aiming at: a ritual companion
for the raver as urban shaman, not a fitness tracker with a theme. When
a change could go either way, pick the one that feels more like a rite
and less like a productivity tool. The README's three working principles
are the test.

Be warned up front: this is a **beta with no support promise**. Issues
may sit. A pull request may be declined because it pulls the app away
from what it is. None of that is personal.

## What is most welcome

1. **Drills and packs.** New exercises with a purpose, cues, a dose,
   venues and an attribute mapping. This is pure data and the easiest
   thing to land. See "Adding a drill" below.
2. **Kit coverage.** Substitutions for people without a hang point, a
   yard, a mat or bricks. The app's rule — a pull for every push — must
   hold for someone in a studio flat.
3. **Bugs with a repro.** Especially anything about chimes not firing on
   a particular OEM; Android's background rules differ wildly.
4. **Accessibility and locale.** Units, text scaling, screen-reader
   labels.

## What is likely to be declined

- **Changes to the Today screen's shape.** It is deliberately one page:
  chime, elements, water, sets, the day's list. New things go in a sheet
  opened from it, not on it.
- **Accounts, servers, analytics, ads.** Nothing leaves the phone except
  a location rounded to about 10 km, sent to Open-Meteo for the forecast.
  That is the whole network surface and it stays that way.
- **Gamification that punishes.** Streaks that shame, red screens, guilt
  copy. The program adapts to what you did; it does not scold.
- **Equipment the default program assumes.** Packs may require kit; the
  base program is bodyweight, a floor and a wall.

## Running it

```sh
cd RaveLiteApp
yarn install
yarn android            # a connected device or emulator
```

Checks, which CI and review both expect to pass:

```sh
npx jest --maxWorkers=2     # the whole suite
npx tsc --noEmit            # 9 known errors in the circuit editors; no new ones
npx eslint <files you touched>
```

On a low-memory machine run them one at a time rather than in parallel.

## House style

- **Comments say why, not what.** The code says what it does. A comment
  earns its place by explaining a decision, a constraint or a trap.
- **Tests are named as sentences** describing the behaviour: `it('slides
  an attribute that has been left alone for a fortnight')`.
- **Guards over conventions.** If something must stay true — every drill
  has a pictogram, no sweaty drill lands in a daytime round, the author's
  own program is unchanged — write the test that fails when it stops
  being true.
- **Domain first.** Rules live in `src/domain`, not in components. A
  screen should read a model and render it.
- **No new explanation patterns.** Anything that needs explaining gets an
  info card (`domain/info`), the same as drills, tracks and attributes.

## Adding a drill

1. Append it to its element's section in
   `src/domain/exercises/library.ts` — appending matters: each element's
   first drill is the circuit fallback.
2. Give it `purpose` (one line, why), `dose`, `cues` (how, in order),
   `targets`, `venues` and `approxSeconds`.
3. Map its pictogram in `src/domain/exercises/moves.ts` and what it
   trains in `src/domain/attributes/trains.ts`. Tests fail without both.
4. Keep it doable with the kit it claims. A `house` drill may not need
   height, a run-up or a swinging staff.
5. `npx jest src/domain/exercises` — the library guards check ids,
   elements, completeness, equipment words and plan coverage.

## Commits and pull requests

- One idea per commit. The subject says what changed for the user; the
  body says why it was wrong before.
- Say what you ran. "515 tests pass, tsc unchanged, lint clean" is the
  review.
- If it changes what the app asks of somebody, say so in the PR: this
  app is a thing people do every day.

## Safety

Exercise advice reaches real bodies. Anything you add should fail safely:
name the escape ("knee pain means back out"), start conservative, and
never assume the reader is already strong. RaveLite is not medical advice
and neither is your contribution.

## Adding a curriculum

Drills, grouped the way they are taught, are added as **packs** — pure
data, no app code. See [docs/packs.md](docs/packs.md) for the format, the
rules that get a pack rejected, and a working example to copy.
