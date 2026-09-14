# Layout

> **Superseded 2026-09-14.** The tablet zone layout below is historical.
> The surface is now one page per element on a phone in portrait, with no
> sub-tabs. Heart › Today: status line (with ⚙ Settings), chime card,
> balance strip with week dots, water, Daily Sets meters, the day's list,
> then "+ Log a session" and Practice. See [../10-today-home.md](../10-today-home.md).

A 7-inch class tablet at landscape orientation, viewed from ~1.5 m.
The page is **single-screen, no scroll inside the primary zone.**
The activity log is the only scrollable surface and lives below
the fold-equivalent.

## Zones (landscape)

```
┌──────────────────────────────────────────────────────────────────┐
│  [STATUS STRIP]  mode · plug · active-hrs · pause · deadline-d    │
├──────────────────────────────────────────────────────────────────┤
│  [30-DAY STRIP]  ▓▓ ▓▓ ▓░ ░░ … □ ⬢ □ □  · best 3-mi · trend       │
├────────────────────────────────────────────┬─────────────────────┤
│                                            │                     │
│                                            │   [PFT GOAL PANEL]  │
│            [NOW CARD]                      │   primary anchor    │
│   element glyph · headline · ring · CTAs   │   ring + best chips │
│                                            │                     │
├────────────────────────────────────────────┤                     │
│  [UPCOMING STRIP]  next 3–5 items           │                     │
├────────────────────────────────────────────┴─────────────────────┤
│  [ADHERENCE RINGS]  total + per-element                           │
├──────────────────────────────────────────────────────────────────┤
│  [ACTIVITY LOG]  scrollable; today's resolutions, newest first    │
└──────────────────────────────────────────────────────────────────┘
```

In run-attempt mode the entire surface reflows to a single dominant
timer — see [run-attempt-mode.md](run-attempt-mode.md).

## Zone responsibilities

### Status strip (top)
- Mode badge: `LIVE` / `CALM` / `BATTERY SAVER`.
- Plug-state icon.
- **Active-hours chip** (e.g. `09:00–23:00`); long-press for inline
  edit. See [../01-requirements/active-hours.md](../01-requirements/active-hours.md).
- **Pause control** (`PAUSE 1H`, long-press to engage / unset).
- **Deadline countdown** chip when a goal deadline is set
  (e.g. `21 d`).
- Time of day (large, tabular numerals; the tablet's clock).

### 30-day strip (under status strip)
- 30 cells, one per day of the active arc. Today is outlined.
- See [30day-progress.md](30day-progress.md) for cell encoding
  and tap behavior.
- Collapses to a 12 dp ribbon while a pulse is active so the
  now-card owns the screen.

### Now card (center-left, primary)
- Owns ~60% of horizontal space.
- See [components.md](components.md) for the spec.
- Two states: `idle` (countdown to next pulse) and `active` (action card).

### PFT goal panel (right rail)
- Owns ~40% of horizontal space.
- Always visible.
- Headline ring = active anchor goal progress.
- Below ring: best-of-rolling-30-days chips for push-ups, plank,
  pull-ups, crunches.
- Tapping any chip opens its log-attempt sheet.

### Upcoming strip (under now-card)
- Horizontal row of 3–5 chips: glyph + ETA.
- Tapping a chip *previews* the card (FR-3.3); does not fire.

### Adherence rings (mid-band)
- One large total ring; five small element rings beside it.
- Hairline = today's expected denominator at this hour
  (so the total ring fills "on schedule" by end of day).

### Activity log (bottom, scrollable)
- Newest-first list of today's resolutions.
- Each row: time, element glyph, label, outcome chip,
  time-to-respond.
- Tap row → reverse-window sheet (within 60 s of resolution).

## Portrait fallback

If the operator orients the tablet portrait, zones reflow:

```
┌─────────────────────────┐
│ STATUS STRIP            │
├─────────────────────────┤
│ 30-DAY STRIP            │
├─────────────────────────┤
│                         │
│       NOW CARD          │
│                         │
├─────────────────────────┤
│  UPCOMING STRIP         │
├─────────────────────────┤
│  ADHERENCE RINGS        │
├─────────────────────────┤
│  PFT GOAL PANEL         │
├─────────────────────────┤
│  ACTIVITY LOG           │
└─────────────────────────┘
```

Portrait is supported but **landscape is the design intent.**
Document this as a tooltip on first portrait launch.

## Phone fallback

On phone-class screens (< 600 dp width), the surface degrades:
- PFT goal panel collapses behind a chip on the now-card.
- Adherence rings shrink to a single sparkline.
- Activity log gains a separate sub-tab.

Phone is supported for occasional use, not the design target.

## Spacing & type

Reuse the existing `palette` / `radius` / `spacing` / `type` tokens.
Add one named scale step:

- `type.ambient.headline` — 32 sp, 700 weight, tabular numerals.
- `type.ambient.cta` — 22 sp, 600 weight, letter-spacing 0.6.
- `type.ambient.meta` — 12 sp, 500 weight, tabular.
