# Pulse Content Catalog

The actual micro-actions the dashboard surfaces. Each pulse is a
short, low-friction physical intervention. Mapped to elements,
durations, hour-of-day suitability, and bullet cues.

## Element → action lane

The existing pentagram + ethos already implies the mapping; making
it explicit:

| Element | Lane                          | Examples                          |
| ------- | ----------------------------- | --------------------------------- |
| Air     | Breath, posture, eye relief   | Box breathing, neck reset, 20-20-20 |
| Fire    | Power, conditioning, cardio   | Push-ups set, jump rope, sprint   |
| Earth   | Strength, stability, core     | Plank, squat hold, glute bridge   |
| Water   | Hydration, mobility, recovery | Drink water, hip flow, foam-roll  |
| Heart   | Integration, presence         | Mindful pause, stand & stretch    |

## Catalog (v1)

Each entry: id, element, label, duration, bullets, hour-suit
(0=any, otherwise hour-of-day window).

### Air

| id            | label             | dur  | bullets                                   | window |
| ------------- | ----------------- | ---- | ----------------------------------------- | ------ |
| `air.box4`    | Box breath · 60s  | 60s  | 4-in · 4-hold · 4-out · 4-hold · ×4       | any    |
| `air.neck`    | Neck reset · 45s  | 45s  | chin tuck · ear-to-shoulder L/R · slow    | any    |
| `air.eye20`   | 20-20-20 · 30s    | 30s  | look 20 ft · 20 sec · blink · soften jaw  | any    |
| `air.standtall` | Stand tall · 30s | 30s  | rise · spine long · ribs over hips        | 09–22  |

### Fire

| id              | label                    | dur  | bullets                                          | window |
| --------------- | ------------------------ | ---- | ------------------------------------------------ | ------ |
| `fire.pushup20` | 20 push-ups              | 60s  | hands shoulder-width · 5-rep micro-sets ok       | 06–22  |
| `fire.squat25`  | 25 air squats            | 75s  | feet shoulder-width · knees over toes · drive heels | 06–22 |
| `fire.jumprope` | Jump rope · 60s          | 60s  | (no rope ok — phantom) · light bounce · breath nasal | 09–21 |
| `fire.sprint`   | 30s shuttle / hallway run | 60s  | clear path · accelerate · decelerate slow         | 09–20 |

### Earth

| id              | label                    | dur  | bullets                                  | window |
| --------------- | ------------------------ | ---- | ---------------------------------------- | ------ |
| `earth.plank60` | 60s forearm plank        | 60s  | elbows under shoulders · ribs down · glutes engaged | 06–22 |
| `earth.plank2m` | 2m forearm plank         | 120s | only on plank-anchor day                 | 06–22  |
| `earth.squat-hold` | 45s wall sit          | 45s  | thighs parallel · breath even            | 09–22  |
| `earth.glute-br`| 20 glute bridges         | 60s  | feet flat · drive heels · top hold 1s    | 06–22  |

### Water

| id              | label                    | dur  | bullets                                  | window |
| --------------- | ------------------------ | ---- | ---------------------------------------- | ------ |
| `water.drink`   | Drink water · 8 oz       | 15s  | sip steadily · rinse mouth · breath out  | any    |
| `water.hipflow` | Hip flow · 90s           | 90s  | 90/90 swap · pigeon · deep lunge each side | 09–22 |
| `water.foamroll`| T-spine roll · 60s       | 60s  | foam roller across upper back · 5 passes | any    |
| `water.shake`   | Body shake · 30s         | 30s  | loose joints · tremor release · exhale   | any    |

### Heart

| id                | label                    | dur  | bullets                                | window |
| ----------------- | ------------------------ | ---- | -------------------------------------- | ------ |
| `heart.standpause`| Stand & pause · 30s      | 30s  | rise · feel feet · one slow breath     | any    |
| `heart.gratitude` | One-line gratitude · 30s | 30s  | name one thing · out loud or written   | any    |
| `heart.mandala`   | Eyes-closed centering · 60s | 60s | sit tall · soften eyes · count 6 breaths | any  |
| `heart.posture-scan` | Posture scan · 45s    | 45s  | feet · hips · ribs · shoulders · head  | 09–22  |

## Catalog discipline

- All durations ≤ 120 s. **No catalog item demands more than two
  minutes of operator time per pulse.** Above-floor work goes through
  Run-Attempt Mode or scheduled Circuit, not a routine pulse.
- `window: 06–22` means "do not auto-schedule outside this hour
  range" — independent of active-hours, which globally suppresses.
- Bullets ≤ 5 lines, ≤ 6 words each, action-first verbs.

## Storage shape

```ts
interface PulseAction {
  id: string;
  element: ElementId;
  label: string;
  durationSec: number;
  bullets: string[];
  hourWindow?: [number, number];   // local-hour inclusive
  intensity: 'micro' | 'short' | 'mid';
  // 'micro' = ≤30s, 'short' = ≤60s, 'mid' = ≤120s
}

const PULSE_CATALOG: PulseAction[] = [ /* see above */ ];
```

Lives in `src/domain/ambient/catalog.ts`. Hot-reloadable from a JSON
fixture at runtime is **not** in scope; ship as a TS const.

## How catalog feeds pulses

When a plan slot fires, the scheduler picks one catalog entry where:

1. `element === slot.element`.
2. Catalog entry's `hourWindow` includes current local hour (else
   skip).
3. Operator has not seen this exact id within the last `cooldownMin`
   (default 90 min) — to avoid repetition.
4. Intensity matches slot's `intensity` preference (default `short`).

If no candidate qualifies, the slot fires with the element's most
generic action (e.g. `heart.standpause` for heart).

## Periodization-aware overrides

A given periodization day (see
[`../03-architecture/periodization.md`](../03-architecture/periodization.md)) can specify
**preferred catalog ids** for the day. E.g. on plank-anchor day,
`earth.plank2m` is the only earth entry the scheduler picks.

## Out of catalog (v1)

- Loaded carries (Spetsnaz 10 km +50 kg territory). Phase 3+.
- Anything requiring partner / equipment beyond a desk.
- Anything in the floor-to-mat transition (sit-ups → up to standing
  burns micro-time the operator may not pay; opt in by selecting
  longer-duration pulses in slot config).
