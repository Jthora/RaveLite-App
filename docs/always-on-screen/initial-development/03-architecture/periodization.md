# 30-Day Periodization

A 4-week training arc with deload, sized to the operator's stated
deadline ("get fit for summer · one month"). The dashboard owns the
*compliance*; this doc owns the *programming*.

## Goals (re-stated)

- Primary: **3 miles ≤ 21:00** by end of Day 30.
- Secondary: USAF/USMC-relevant minimums comfortably exceeded
  (push-ups, plank, crunches, pull-ups).
- Operator state on Day 0: abs visible, conditioning de-trained,
  age 39, no current injury.

## Risks

- Reactivation at 39 with a one-month window is **the maximal
  injury risk** for ramp errors. The plan defaults to conservative
  intensity progression and one full deload week (Week 4).
- Tendon load (Achilles, knee) climbs with mileage. The plan caps
  weekly run mileage growth at ≤ 10% week-over-week.
- Ammo-lift and load-carry not in scope. Defer to month 2.

## Weekly template

| Day  | Anchor                             | Element bias          | Notes                          |
| ---- | ---------------------------------- | --------------------- | ------------------------------ |
| Mon  | Run — easy 30 min                   | Fire (cardio)         | Conversational pace.           |
| Tue  | Upper — push-ups + pull-ups + planks | Fire/Earth            | 4 sets each, RPE 7.           |
| Wed  | Mobility + posture                  | Water/Air             | No hard work. Hip + T-spine.   |
| Thu  | Run — intervals (5×400m)            | Fire (cardio)         | Goal-pace work.                |
| Fri  | Upper + core circuit                | Fire/Earth            | Push/plank/squat triplets.     |
| Sat  | **Anchor — 3-mi time trial**        | Fire (cardio)         | Logged via Run-Attempt Mode.   |
| Sun  | Walk + stretch                       | Heart/Water           | Active recovery only.          |

Across the day, the dashboard's regular pulses (catalog v1) run
on top of the anchor; they're micro-doses, not the main work.

## Phase progression (the arc)

### Week 1 — Reactivate (Days 1–7)
- Anchor mileage cap: 8 miles total.
- Sat trial: **baseline 3-mi** at conversational pace. **Record this
  number.** It is the floor.
- Push-ups: 3×8–12. Plank: 3×30–45 s. Pull-ups: 3 sets to RPE 8.
- Goal: zero soreness > 24 h. If yes, week 1 stays a second week.

### Week 2 — Build (Days 8–14)
- Anchor mileage cap: 10 miles.
- Tue intervals introduced: 4×400m at slightly faster than goal pace.
- Sat trial: same distance, push pace 2–3% faster than Week 1.
- Push-ups: 4×10–15. Plank: 3×45–60 s.

### Week 3 — Sharpen (Days 15–21)
- Anchor mileage cap: 11 miles.
- Tue intervals: 5×400m at goal pace (7-min/mi → 1:45 / lap).
- Sat trial: **first goal-pace attempt.** Aim 21:30.
- Plank long-hold day: Wednesday, 2-min hold target.

### Week 4 — Deload + Test (Days 22–30)
- **First half (Days 22–25)**: ~60% volume of Week 3. Easy runs,
  full mobility, sleep priority.
- **Day 26 (Wed) — final tune-up**: 3×400m at goal pace, then home.
- **Day 28 or 29 (operator's choice) — TIME TRIAL for record**:
  3 miles, all-out. Logged. This is the summer-deadline number.
- **Day 30** — celebration / debrief day. No work.

## How the dashboard supports periodization

### Plan editor extension (Phase 2)

`Plan` gains an optional `template` field:

```ts
interface PlanTemplate {
  id: string;
  name: string;
  weeklyDays: PlanTemplateDay[];   // 7 entries, Mon-first
  startDate: string;               // ISO YYYY-MM-DD
  endDate: string;                 // ISO; for the deadline countdown
}

interface PlanTemplateDay {
  weekday: number;             // 0-6
  anchorActionId?: string;     // e.g. 'fire.run30easy', 'anchor.run3mi-trial'
  preferredCatalogIds?: string[];   // overrides catalog.element pool
}
```

Stored at `KEYS.planTemplate`. The dashboard reads `endDate` for
deadline countdown.

### New "anchor" catalog entries

Distinct from the regular pulse catalog — these are the day's main
event, surfaced as a different card style:

| id                       | label                          | duration       | hint     |
| ------------------------ | ------------------------------ | -------------- | -------- |
| `anchor.run3mi-easy`     | Easy run · 30 min               | guided window  | conversational pace |
| `anchor.run-intervals-5x400` | Intervals · 5×400m         | guided window  | goal pace per lap   |
| `anchor.run3mi-trial`    | 3-mile time trial               | manual stop    | run-attempt mode    |
| `anchor.upper-block`     | Upper-body block                | ~30 min        | push/pull/plank     |
| `anchor.mobility`        | Mobility flow                   | ~25 min        | hips + T-spine      |
| `anchor.recovery-walk`   | Walk + stretch                  | ≥ 20 min       | RPE 3               |

Anchor entries fire **once per day**, at the operator's chosen
anchor-time slot, regardless of the regular pulse cadence.

## Periodization UI surfaces

- A small **"Today's Anchor"** card at the top of the Goal Panel
  showing the day's anchor (e.g. "Wed · Mobility").
- A **week strip** below the deadline countdown, marking each day
  with an anchor glyph and ✓/—/× state.
- The trial day shows a special **TRIAL** color and prompts run-attempt
  mode directly from the card.

## Out of scope for periodization v1

- Auto-adjusting mileage from soreness self-report. (Phase 3.)
- Weather-aware rescheduling.
- Heart-rate driven intensity. (Operator has no HRM in this design.)
- Strength-cycle progression curves (linear, undulating, etc.) —
  the plan above hand-picks weekly progressions; auto-cycling is
  a Phase 3 problem.
