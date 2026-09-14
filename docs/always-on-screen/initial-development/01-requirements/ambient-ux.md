# Ambient UX Principles

Ground rules for designing a surface that lives in the operator's
peripheral vision for hours. These principles supersede normal
mobile-app UX defaults wherever they conflict.

> **Amended 2026-09-14.** The operator asked for the app to feel subtly
> alive — breathing, responsive to touch — while staying quiet enough to
> sit beside an IDE all day. P-1 and P-12 now allow one budgeted ambient
> motion (the *alive layer*); everything else still has to be earned by
> an event. See `03-architecture/always-on-strategy.md` › Alive layer.

> **Amended again 2026-09-14 (Today home).** The surface is Heart › Today.
> P-2's single card is the chime card at the top of Today. P-7 and P-8
> hold: missed chimes are dimmed in the day's list, never counted or
> headlined. A chime budget now applies — about twenty a day; see
> `03-architecture/always-on-strategy.md` › Chime load.

## P-1 — Quiet is the resting state

The dashboard is quiet and dim by default. Sound and strong motion must
be **earned by an event** (scheduled pulse, response confirmation,
goal-deadline alarm). No idle sound design.

The single exception is the **alive layer**: a slow breathing glow in
the element's color, within a strict budget — Whisper 2–5 % opacity
(default), Glow 4–9 %, or Still (no breathing). It moves in discrete
steps, adds at most a few percent on touch, and rests completely at
night, during a manual pause, and when Android's "Remove animations" is
on.

## P-2 — One thing at a time

The center of the screen presents exactly one card. Multi-card carousels,
tabs-within-the-page, or dueling CTAs are forbidden. Decisions made
glancing across a desk are made on one read.

## P-3 — Read range = 1.5 m

Type, glyphs, and CTA buttons must be legible at ~1.5 m without the
operator standing or leaning. This means:

- Headline action text ≥ 28 sp.
- Time-to-next readout ≥ 22 sp, tabular numerals.
- CTA buttons ≥ 96 dp tall, ≥ 200 dp wide.

## P-4 — Sloppy-tap tolerance

Targets are oversize because the operator is reaching across the desk.
Minimum target 96 × 96 dp. Adjacent targets separated by ≥ 24 dp.
Accidental taps are reversible (FR-9.3).

## P-5 — Cues are distinct, terse, and tunable

A cue is a sound + optional haptic + a screen-state change. Each
element has its own cue sound. All cues are < 1.2 s. Volume is per-device
and per-element.

## P-6 — Disturbance budget

A pulse interrupts. Total interrupt budget per pulse = the cue itself.
Once the operator engages the action, the experience continues silently
(except for any explicitly chosen audio guidance inside the action,
e.g. a circuit's leg countdown).

## P-7 — Refuse to demand attention twice

If the operator does not respond to a pulse within its window, the
pulse logs `ignored` and **does not re-fire**. No second ping, no
escalating alarms. The next scheduled pulse takes over.

(An OS backup chime is not a second ping: it only sounds when the app
was killed and the live chime never happened.)

## P-8 — No streak shame

The dashboard never leads with what was missed. Misses are accessible
in the activity log but never become the headline number. Headlines
are forward-looking ("next: Air · 12m") or completion-positive
("today: 6 sealed").

## P-9 — Power-button parity

Pressing the device's hardware screen-lock button must always work.
The dashboard must not fight the OS for the lock state. On unlock,
the surface restores cleanly.

## P-10 — Plug-in awareness

The screen is held on all day, so the device is expected to be on its
charger (the Stay Alive checklist asks the operator to confirm it).
Automatic plug detection and a battery fallback are not built yet.

## P-11 — Element coherence

Color, glyph, and sound for an element must match across notifications,
the now-card, the activity log, and the rings. The existing `ELEMENTS`
map remains the single source of truth.

## P-12 — Honest motion

Motion communicates time and state. A 60-second action shows a 60-second
ring; a 45-second action shows a 45-second ring. The alive layer's
breathing (P-1) is the only ambient motion and must stay inside its
budget; while a pulse is active it quickens to 0.4 Hz because that *is*
state. Nothing else animates just for show.
