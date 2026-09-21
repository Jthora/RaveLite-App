# How military can this app get?

**Researched 21 Sep 2026.** Short answer: it can take somebody most of the
way to almost every service fitness test, and all the way to some. It
cannot honestly claim "any branch, any programme", and the reason is
interesting — it is the app's own premise, not a gap in the code.

## How many tests are there?

Two tiers, and they behave very differently.

### Tier 1 — annual service tests (eight)

| Test | Branch | Events |
|---|---|---|
| **AFT** (Army Fitness Test) | Army | 3-rep-max hex bar deadlift · hand-release push-ups · sprint-drag-carry · plank · 2-mile run |
| **CFT** (Combat Field Test) | Army, combat arms | 1-mile run · 30 dead-stop push-ups · 100 m sprint · 16 × 40 lb sandbag to a 65" platform · 50 m carry — pass/fail, age- and sex-neutral |
| **PRT** | Navy | push-ups · plank · 1.5-mile run *(or 500-yd swim, 2000 m row, 12-min bike)* |
| **PFA** | Air Force | push-ups or HR push-ups · sit-ups, crunches or plank · 1.5-mile run or HAMR shuttle |
| **HPA** | Space Force | as PFA, but a 2-mile run, twice a year |
| **PFT** | Marines | pull-ups or push-ups · plank · 3-mile run |
| **CFT** | Marines | 880-yd run · 2 min ammo can lifts · 300-yd maneuver-under-fire shuttle |
| **PFT** | Coast Guard | push-ups · plank · 1.5-mile run, 12-min swim or 2000 m row — service-wide from 1 Jul 2026 |

The app has **three** of these today: USAF, USSF and USMC PFT, plus some
USMC CFT events. Army, Navy and Coast Guard are missing entirely.

### Tier 2 — selection screeners (dozens)

These are entry gates, not annual tests, and each pipeline has its own:

- **Navy SEAL PST** — 500-yd swim · push-ups · sit-ups · pull-ups · 1.5-mile run
- **Pre-RASP** — 53 push-ups · 63 sit-ups · 4 pull-ups · 2-mile ≤ 14:30 · 6-mile ruck @ 35 lb ≤ 1:30
- **Ranger School RPA 2.0** — since Apr 2025: a 14-minute combat circuit, 4-mile run and chin-ups, with no push-ups or sit-ups at all
- **AF Special Warfare PAST/IFT**, Special Forces, MARSOC, and so on

"Dozens" is the honest count, and it grows if you include allied
services.

## What the app can and cannot do

The app's premise is **a body, a floor, and whatever is in the room** —
enforced by the pack validator, which rejects any drill mentioning a gym,
weights or a pool. That premise does most of the work here, and also sets
the ceiling.

**Fully trainable today** — push-ups, hand-release push-ups, dead-stop
push-ups, sit-ups, crunches, planks, pull-ups, chin-ups, runs at every
distance, sprints, shuttle runs. That is **every event** of the Navy PRT,
Air Force PFA, Space Force HPA, Marine PFT and Coast Guard PFT (bar the
swim option), and the running and pressing halves of everything else.

**Trackable but not trainable** — hex bar deadlift, sandbag lifts, ammo
can lifts, sled drags, rucks, swimming. The app can hold a result, grade
it and chart it. It cannot prescribe the training, because prescribing it
would mean recommending equipment the app promises not to need.

**That is a real limit, not a missing feature.** A soldier preparing for
the AFT needs a hex bar. Pretending otherwise would be the one thing this
app must never do: lie about what it is preparing you for.

## What I would build

A **`military-tests` pack per service**, replacing the single one that
exists. Packs are exactly the right shape for this — pure data, no app
code, and already validated and documented.

1. **Split the existing pack** into `usaf`, `ussf`, `usmc`. No new
   content, just honest grouping.
2. **Add `army`, `navy`, `uscg`.** Bodyweight and run events come free;
   equipment events are added as *trackable* with an explicit line saying
   what you will need and where.
3. **Add a `selection` pack** for the screeners, which are mostly
   bodyweight and running and therefore mostly in scope. Pre-RASP and the
   SEAL PST are almost entirely trainable in this app; only the swim and
   the ruck are not.
4. **Every scoring table gets a `checkedOn` date** and a source link.

## The thing to be careful about

**These standards are moving fast right now.** In the last eighteen
months: the AFT replaced the ACFT (Jun 2025), Ranger School moved to RPA
2.0 (Apr 2025), the Army added the Combat Field Test (Apr 2026), the
Coast Guard went service-wide (Jul 2026), and the Pentagon codified
standards across all branches (31 Aug 2026).

A wrong table is worse than no table when somebody is training to keep
their job. So:

- Every table carries the date it was checked and where it came from.
- The app already says "close, not final" on its existing marks. That
  line stays, and gets more prominent, not less.
- Tables live in packs, so a correction is a data change a contributor
  can make — not an app release.

## Answering the question directly

> Can anyone who wants to join any publicly-known training programme use
> this app to pass a physical fitness exam from any military branch?

For the **Navy, Air Force, Space Force, Marines and Coast Guard annual
tests**: yes, honestly, once the packs are written — every scored event
is bodyweight or running.

For the **Army AFT** and both **combat fitness tests**: partly. The app
can run the whole programme except the loaded events, and should say so
plainly rather than quietly omitting them.

For **selection pipelines**: mostly, with the same caveat, plus swimming
and rucking — and nobody should be told an app prepared them for BUD/S.

That is a good answer. It is not "everything", and the app is better for
not claiming it.
