# What you train with — a brainstorm

The kit list has eleven items and one axis: *things you have*. It works,
and the tile UI is the clearest thing in Settings. But it cannot say
several things that are true of the operator's own training, which is a
sign it is too small.

## The gap that matters most: limits

Every constraint described so far is a **limit**, not a possession:

> "a buggy backyard (mosquitos)… a fitness area with a low ceiling in the
> basement… no fitness gear so I'm forced to use body weights only"

The model has exactly one limit — `noise` — and it is doing the work of
all of them. Everything else is phrased as absence, which is not the same
thing: *not having a yard* and *having a yard full of mosquitos in July*
produce completely different programs.

**Limits subtract from what a room can do, and they are the reason a
substitution exists.** They deserve to be first-class.

Candidates, all of which change what can be prescribed:

| Limit | Removes |
|---|---|
| **Low ceiling** | jumps, overhead presses, staff spins above the head |
| **Neighbours below** | anything with impact — skips, jumps, bounding |
| **People around** | floor work, loud breathing, anything that looks odd |
| **Tight space** | anything needing more than arm's length |
| **Bugs outside** | static outdoor work in season; the app already tracks this per-day |
| **No shoes** | sprinting, bounding, kerb work |

The low ceiling is the strongest case. It is a hard physical limit, it is
extremely common (basements, lofts, vans), and nothing in the app can
express it today.

## The second gap: hang points are not one thing

`hangPoint` is a single tile, but the operator's own note says:

> "except for 'up and over' since the hangings are literally just below
> the porch and the grips are reachable without me jumping, so my feet
> effectively touch the ground unless I bend my knees"

That is a **low** hang point. It allows rows, dead hangs with bent knees
and assisted pull-ups; it forbids full hangs, leg raises and anything
needing clearance. A high bar allows all of it. One tile cannot say
which, so the program has to guess — and currently guesses high.

Splitting into **low** (feet reach the floor) and **high** (you hang
clear) is one extra tile and fixes a real mis-prescription.

## Everything else, by category

Current items marked ✓.

**Surfaces** — what is under you
✓ somewhere to stand · ✓ a mat or carpet · grass · sand · hard outdoors

**Structures** — what you push, pull or step on
✓ a wall or doorframe · ✓ a sturdy chair or step · ✓ stairs ·
a table or desk edge · a bench · a kerb · a railing or post

**Hang points** — *split from one item*
a low bar or edge (feet reach) · a high bar (you hang clear) ·
a beam or branch · a playground frame

**Load** — something heavy enough to matter
✓ bricks or a loaded pack · water jugs or bottles · a sandbag ·
rocks or logs

**Tools** — things you hold
✓ a staff · ✓ a ball · a skipping rope · a resistance band ·
a towel · poi · a sword or sabre

**Space** — where you can go
✓ a yard or garden · ✓ streets to walk or run · a park · a hallway ·
a stairwell · a balcony

That is roughly **thirty items across six groups**, plus six limits.

## A loose end worth fixing

Several stand-in drills — `fire.towel-door-row`, `earth.towel-pinch-hold`
— assume a towel that is not in the kit list at all. They are offered to
everyone. That is probably right (everyone has a towel), but it should be
a decision rather than an omission.

## The UI

The tiles stay. They are the clearest thing in Settings and the
`+N drills` unlock count is the best idea in the whole panel — it teaches
the entire model in three words.

What changes is only the arrangement:

- **Six labelled groups**, each a tile grid of four to seven. A group is
  scannable; thirty loose tiles are not.
- **Limits get their own section, visually distinct** — drawn as
  something taken away rather than something gained, so nobody reads them
  as features. Their count reads `−N drills`.
- **Start from a room, not a blank list.** Three or four presets — *a
  quiet flat · a house with a yard · a basement · a park nearby* — tick a
  sensible set, and then the tiles refine it. Nobody should face thirty
  switches cold.
- **The unlock count stays on every tile**, because it is what makes the
  list worth reading.

## What I would not do

- **No gym equipment.** The pack validator already rejects any drill
  mentioning weights or machines, and the whole premise is a body, a
  floor and whatever is in the room. A dumbbell tile would be the first
  crack in that.
- **No pool.** Water is Flow and Fascia here, deliberately.
- **Do not let limits become difficulty.** A limit removes drills; it
  must never scale the program down, because that is what the day shape
  is for and two things doing one job is how this app starts lying.

---

# Round two — what the data says, and places

Measured 21 Sep 2026 against the expanded model as built (not yet
committed).

## Three findings

**1. Twelve of the thirty tiles unlock nothing.** Sand, bench, rail, beam,
frame, water jugs, sandbag, band, poi, hallway, stairwell, balcony — all
`+0`. Staff and rope unlock one drill each. A tile that does nothing
teaches somebody that tiles do nothing.

| Group | Tiles, with what each unlocks from a bare room |
|---|---|
| Under you | mat **+42** · grass **+30** · sand 0 |
| Around you | chair +3 · stairs +2 · kerb +5 · bench 0 · rail 0 |
| To hang from | low +7 · high +7 · beam 0 · frame 0 |
| Something heavy | bricks +3 · jugs 0 · sandbag 0 |
| In your hands | ball +2 · staff +1 · rope +1 · band 0 · poi 0 |
| Where you can go | park **+32** · yard **+30** · streets +4 · hallway 0 · stairwell 0 · balcony 0 |

**2. Global limits are wrong for the author, measurably.** The author's
basement has a low ceiling; the backyard has sky. Ticking *low ceiling*
removes six jumps — jump squats, broad jumps, tuck jumps, skater bounds,
pogo hops, vertical jumps — that are all doable in the yard. The limit is
true of a room, and the model applies it to a person.

**3. Some limits are enormous.** *Not much room* removes about 80 of the
author's ~185 drills; *people around* removes about 60. That is a sign they are
too blunt as a single switch — an office is tight, a yard is not.

## The idea: places, not a list

The author already describes training this way — four places, named on
17 Sep: **the mat, the backyard, the neighborhood, the house.** Each has
its own kit *and* its own limits:

| Place | Has | Won't allow |
|---|---|---|
| The mat (basement) | mat, floor, wall | low ceiling: no jumps, hangs, running, staff |
| The backyard | grass, bricks, room for the staff | mosquitoes from late summer; in view (no tablet out there) |
| The porch | a **low** hang point — feet reach the ground | nothing up-and-over; assisted, inverted, tucked only |
| The house | stairs, a chair, a wall, a hallway | low ceiling downstairs |
| The neighborhood | a hill, a kerb, the block loop | — |

A drill is doable if **any** place allows it. Low ceiling stops being a
fact about the person and becomes a fact about the basement, and the
jumps come back — in the yard, where they belong.

What places unify, that are currently separate:

- **Kit and limits** — both become properties of somewhere.
- **Venues** — the library already tags drills `mat`, `yard`, `porch`,
  `house`, `neighborhood`. Places are what venues were reaching for.
- **Weather** — rain already moves outdoor drills inside. That is "use a
  different place", and the indoor place's limits should apply when it
  does. Today they cannot, because there is no indoor place.
- **Time of day, later** — the morning session is in the yard; desk hours
  are at the desk. A chime could offer only what the place you are
  probably in allows.
- **Modes** — travelling is just a temporary place: a hotel room.

## A better walkthrough

The user asked for a better way to *go through* the options. Places give
it a shape people already think in:

1. **Where do you train?** Pick from templates — a mat or bedroom floor,
   a basement, a yard, a porch or balcony, a hallway and stairs, a park,
   the streets, a desk at work. Most people pick two to four.
2. **For each place, what is there?** Pre-filled from the template; only
   that place's groups are shown. A basement never asks about sand. Each
   list is five to eight tiles, not thirty-one.
3. **Ask, don't tile, where a distinction is subtle.** "Can your feet
   touch the ground while you hang?" is a clearer question than two tiles
   called *low* and *high*. The answer sets the tile; the tile is there
   to change it later.

The tiles stay — they are the part the operator likes. Places just decide
which tiles belong on which page.

## Filling the empty tiles

Three ways, in order of cost:

**Implication, not content.** Some items are really other items: a beam
or branch *is* a high hang point, a playground frame is a high hang
point with bars, a balcony has a rail, a stairwell has stairs, a park
usually has grass, a bench and a frame. Letting an item imply others
turns several zeros into real numbers with no new drills.

**The band is the single most valuable empty tile.** Pull-aparts and
face pulls are the textbook work for Screen Shoulders (UCS); banded
bridges and clamshells for Tipped Pelvis (APT); band dislocates for
mobility. It feeds the flaws system directly, costs almost nothing to
own, and is exactly what the author's own corrections call for.

**New drills for the rest**, with the obvious candidates:

| Item | Drills it could carry |
|---|---|
| Bench | step-ups, incline push-ups, bench dips, box jumps (outdoors) |
| Rail or post | rail rows, supported single-leg work, calf raises, standing splits |
| Water jugs | farmer carries, goblet squats, halos, suitcase carries |
| Sandbag | bear-hug carries, shouldering, sandbag squats and cleans |
| Sand | sand sprints, barefoot balance, soft-landing jumps |
| Hallway | shuttle runs, walking lunges, bear crawls, footwork lines |
| Stairwell | stair runs and sprints — real conditioning |
| Poi | poi spinning — see below |

## The group only RaveLite would have: flow toys

Staff is one tile in *In your hands* and poi is empty. But flow arts is a
whole toy culture that no fitness app models, and this app is for
ravers: **staff, double staff, poi, hoop, fans, levitation wand, rope
dart, contact ball, buugeng, dragon staff.** A *Flow toys* group, fed by
the existing staff and dance packs, is the most on-brand thing the kit
could grow into — and it is the only group where the operator is the
expert, not the app.

Two non-object candidates in the same spirit: **a speaker** (dance to a
beat, the beat-recognizer's future home) and **a mirror** (form for
dance, martial and flow).

## Honest empty tiles

Until an item has drills, its tile should not pretend. Two options:
hide it, or say **"No drills yet — suggest one"** and open the drill
issue template. The second turns a dead tile into a contribution, which
is what the pack format was built for.

## "The thing that would add most"

`unlockCount` already knows. One line above the tiles — *"The thing that
would add most here: a mat, +42 drills"* — tells a new person where to
start, and tells the author nothing they need, because it disappears
once the big ones are ticked.

## Recommendation

Build **places**. It fixes a real mis-prescription against the author
(six yard jumps lost to a basement ceiling), it gives the walkthrough the
shape people already think in, it shrinks every tile list to one room's
worth, and it is the model weather and time-of-day were always going to
need. The flat expansion built on 21 Sep is not wasted: its items,
groups, labels, symbols and limits all carry over — they just move from
the person to the place.

---

# Decided, and built — 21 Sep 2026

The operator chose **places**, **drills for every tile**, and all four
content groups at once.

## The model (`domain/profile/kit.ts`)

- A person has **places**, each of a kind — a room, a basement, the rest
  of the house, a desk at work, a stairwell, a yard, a porch or balcony,
  a park, the streets, a beach. Each place has its own things and its
  own limits.
- **What you carry** — bricks, jugs, a sandbag, a band, a rope, a ball
  and nine flow toys — is claimed once and counts in every place.
- A drill is doable if **one** place allows it: its venue, what it needs
  and no limit against it, all in the same place.
- Needs can be **any of**: a shoulder roll needs grass, a mat or sand; a
  face pull needs a band and something to tie it to.
- **Hanging is a question** per place — no, feet touch, I hang clear,
  both — not two tiles.
- A profile from before places reads as one place, exactly as before.
  Migration v10 splits a stored flat kit into a room (with the old limits
  on it), a yard, a porch and the streets, and the author's program comes
  out identical (tested against the golden week).

## The content (`domain/exercises/kit/`)

68 new drills — 21 for things you carry, 27 for things a place has, 20
for flow toys. Every tile anyone can tick now unlocks at least one drill
somewhere, and a test holds it there. Beam became something to balance
on; balcony went, because a porch or balcony is a place, not a tile.

## Found on the way

- **A fresh install never saw setup.** Migrations run from v0 on a new
  phone, v8 wrote the author's kit into it, and setup does not show once
  a profile exists. v8 now only writes it into an install with history,
  and an unsaved profile is the stranger's bare room.
- **Editing kit while travelling saved the hotel room over it.** The
  panels loaded facts with the mode applied and saved them back.
- **"Try this now" ignored kit** — it ranked every drill in the element.
- **A profile read before migrations stayed old all session.** The
  background notification handler hydrated storage without migrating,
  and the profile cache kept whatever was read first. It migrates now,
  and migrations clear the cache.
- **v9 was spent.** A development build ran an earlier v9 (the hang split
  alone) on the author's phone, so places are v10.
- **Shadow rope and curb walk were gated on things they do not need**,
  and the tucked L-sit on a hang point it never uses.

## Still open

- Naming a place ("The mat", "The backyard") — the kind's name is used.
- Weather could close outdoor places instead of swapping drills.
- Time of day could guess which place you are in.
- Dragon staff, a speaker and a mirror were left out: no drills yet that
  would be honest.
