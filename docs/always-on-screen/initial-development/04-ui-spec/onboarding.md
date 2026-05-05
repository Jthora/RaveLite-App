# Onboarding (First Launch)

What happens the first time the operator opens the Always-On
surface. Designed to land with a working setup in ≤ 90 seconds.

## Goals

- Operator finishes onboarding with: an active-hours range, a target
  goal + deadline, a default daily plan, and the FGS notification
  acknowledged.
- Zero "skip" buttons that leave the surface non-functional.
- Reads like RaveLite house style — terse, ceremonial, no
  cheerful-app sing-song.

## Sequence

### Step 1 — Active Hours

```
┌──────────────────────────────────────┐
│  ACTIVE HOURS                         │
│                                       │
│  When may the tablet page you?        │
│                                       │
│   [09:00] ─────────●──── [23:00]      │
│                                       │
│   Days:  M  T  W  T  F  S  S          │
│         ✓  ✓  ✓  ✓  ✓  ✓  ✓          │
│                                       │
│  Outside this window, the surface     │
│  goes silent. No misses are counted.  │
│                                       │
│              [ Next → ]                │
└──────────────────────────────────────┘
```

### Step 2 — The Goal

```
┌──────────────────────────────────────┐
│  THE GOAL                             │
│                                       │
│  Anchor event:                        │
│   ◉ 3-mile run · personal table       │
│   ○ 1.5-mile run · USAF (preview)     │
│   ○ 3-mile run · USMC (preview)       │
│   ○ Custom...                         │
│                                       │
│  Target time: [21:00]                  │
│  Deadline date: [2026-06-01]           │
│                                       │
│              [ Next → ]                │
└──────────────────────────────────────┘
```

The "(preview)" tag is shown for any standard whose age-band cut
scores have not been verified. The operator can still pick it; the
goal panel will show "scoring tentative" badge.

### Step 3 — Daily Plan Seed

```
┌──────────────────────────────────────┐
│  DAILY RHYTHM                         │
│                                       │
│  How often should the tablet page     │
│  you within active hours?             │
│                                       │
│   ○ Light    · every 90 min           │
│   ◉ Regular  · every 60 min           │
│   ○ Dense    · every 45 min           │
│   ○ Custom — open Plan editor         │
│                                       │
│  Each ping is ≤ 2 minutes.            │
│                                       │
│              [ Next → ]                │
└──────────────────────────────────────┘
```

The selection seeds a plan via the existing plan editor. The
operator can edit it later from Heart > Plan, untouched.

### Step 4 — Periodization Offer

```
┌──────────────────────────────────────┐
│  WEEKLY ARC                           │
│                                       │
│  Use the 4-week training template?    │
│                                       │
│   ◉ Yes · seed Mon–Sun anchors        │
│   ○ No · I'll define my own           │
│                                       │
│  The template guards against ramp     │
│  injury and includes one deload week. │
│                                       │
│              [ Next → ]                │
└──────────────────────────────────────┘
```

If yes, the periodization template (see
[`../03-architecture/periodization.md`](../03-architecture/periodization.md)) is installed
with `startDate = today`, `endDate = deadline date`. If the deadline
is < 28 days away, the template compresses Week 4 deload to 4 days
and surfaces a warning.

### Step 5 — Foreground Service Permission

```
┌──────────────────────────────────────┐
│  STAY-AWAKE PERMISSION                │
│                                       │
│  RaveLite needs to keep a small       │
│  notification active while the        │
│  Always-On surface is open.           │
│                                       │
│  This is what stops Android from      │
│  pausing the audio cues mid-session.  │
│                                       │
│  The notification cannot be swiped    │
│  away — that's how it stays alive.    │
│                                       │
│      [ Grant permission ]              │
└──────────────────────────────────────┘
```

Tapping triggers the OS prompt. If denied, the surface still
launches but in **Calm mode only** (no FGS, OS may sleep audio).
A persistent badge on the status strip says `LIMITED MODE`.

### Step 6 — Land

The surface drops to its normal idle state, NowCard showing the
first scheduled pulse (or "next pulse in N min" countdown). A
faint banner at the top: **Welcome. Today is Day 1 of 30.**

## Skip rules

- All steps after Step 1 can be skipped, but skipping any step
  surfaces a yellow "incomplete setup" pill on the status strip
  until resolved.
- Step 1 (active hours) cannot be skipped — without it the
  suppression model has no anchor.

## Re-running onboarding

Operator can re-open the flow from Settings → "Re-run onboarding."
Re-running does not delete existing journal data; it overwrites
plan template, active-hours, and goal target only.

## State persistence

`KEYS.onboarding.completedAt` (epoch ms) is set when Step 6 is
reached. Subsequent launches skip onboarding entirely.

## Tone calibration

- "Goal" not "Mission."
- "Deadline date" not "Race day!"
- "Active hours" not "When can we ping you?"
- "Pages you" / "Paging" preferred over "notify."
- Glyphs match the existing element/sigil vocabulary.
- No exclamation points anywhere in onboarding copy.
