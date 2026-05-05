# Ambient UX Principles

Ground rules for designing a surface that lives in the operator's
peripheral vision for hours. These principles supersede normal
mobile-app UX defaults wherever they conflict.

## P-1 — Quiet is the resting state

The dashboard is silent and dim by default. Any sound or animation
must be **earned by an event** (scheduled pulse, response confirmation,
goal-deadline alarm). No looping animations. No idle sound design.

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

Always-on screen behavior is gated on the device being plugged in.
On battery, the page falls back to standard screen-timeout to protect
battery health. The page surfaces this distinction in a small,
non-shaming corner badge.

## P-11 — Element coherence

Color, glyph, and sound for an element must match across notifications,
the now-card, the activity log, and the rings. The existing `ELEMENTS`
map remains the single source of truth.

## P-12 — Honest motion

Motion communicates time and state. A 60-second action shows a 60-second
ring; a 45-second action shows a 45-second ring. No "for show" animations.
