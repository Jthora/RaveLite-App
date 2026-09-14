# Vision — The Ambient Desk-Mediator

## The scene

An A7-class Android tablet sits centered on the dev workstation,
beneath two monitors above a Mac Mini. The operator silos into
deep work for 6–15 hours at a stretch. Without intervention, the
body never moves: posture decays, conditioning drops, summer
deadlines slip.

The tablet's job is to **break through that silo on a schedule
the operator pre-authorized** — and make the response so frictionless
that compliance is the path of least resistance.

## What's missing from the current app

RaveLite already has:

- A plan editor (`HeartScreen > plan`) that schedules pulses by
  element, day, and time window.
- A circuit chamber that runs guided sequences.
- An insights view that shows weekly trends.
- A notification scheduler (`notifeeScheduler`) that fires pulses.

What it doesn't have:

- **A surface designed to be left running for hours.** All current
  screens assume an operator who picks up the device, navigates,
  and puts it down.
- **A physical-world ambient layer.** Notifications are
  flash-and-gone. There's no glanceable "what's next, when, and
  what should I do right now" panel that survives the operator
  not looking at the tablet for 45 minutes.
- **A check-in primitive that respects deep work.** Today, opening
  the app to mark a pulse done is a context switch. The Always-On
  surface should be a *single tap* commitment.
- **Memory of misses.** If the operator ignores a pulse (head-down
  in a bug), the app forgets. There's no log of "you skipped four
  Air pulses between 10:00 and 14:00."

## The felt promise

> The tablet is on. It is quiet. Every 30–90 minutes it makes a
> deliberate sound and shows one card: *what to do, why, for how
> long*. The operator either taps **Done**, taps **Skip**, or
> ignores it. Whatever happens is logged, attributed, and rolled
> into the day's adherence score.

The operator should be able to glance at the tablet from across
the desk and instantly read:

1. **What's happening right now** (or "next ping in 12m").
2. **What's queued** (the next 3–5 items).
3. **Today's score** (one number, one ring).

## Tone

- Cyber-sigil, OLED-friendly, low light. Already RaveLite's house style.
- **Quiet by default.** The dashboard does not strobe. It pulses on
  cue and rests in between.
- Sounds are short, distinct per element, and tunable in volume.
- Nothing competes with the operator's IDE in peripheral vision when
  there's nothing to do — at most a barely-there breathing glow (the
  alive layer's Whisper budget, 2–5 % opacity) that rests at night.

## North-star scenario

Operator is debugging at 14:30. Tablet has been quiet for 38
minutes. A soft Air-element chord plays. The card on the tablet
shifts: large block letters say `BREATHE & STAND · 60s`. A 60-second
ring begins drawing. Operator stands, does 60 seconds of box breathing,
taps the giant green seal. Card collapses, log entry posts, rings
update, next-up readout moves forward. Total interrupt cost: ~70
seconds. No app-switching, no menus, no decision fatigue.

That scenario, repeated, is the entire feature.
