# USMC — PFT Standards

⚠ **Verification status: UNVERIFIED**. Operator input plus
author-memory of the USMC PFT structure (Marine Corps Order 6100.13).
Verify against the current MCO before scoring code consumes them.

## Operator input (verbatim)

> USMC Male PFT:
>
> Perfect:
> - 20 pull-ups
> - 100 crunches (in 2-minute timespan)
> - 3 miles in 18 mins (10 mph)
>
> Minimum (36–40):
> - 3 pull-ups
> - 50 crunches (in 2-minute timespan)
> - 3 miles in 31 mins (5.8 mph)
>
> Also:
> - 91 lifts (30 lb) of ammo box above head

## Components (USMC PFT — ⚠ verify)

| Slot   | Standard event              | Alternative              |
| ------ | --------------------------- | ------------------------ |
| Upper  | Pull-ups (max set)          | Push-ups, 2 min (capped) |
| Core   | Crunches, 2 min             | Plank (max-hold)         |
| Cardio | 3-mile run (timed)          | 5 km row / bike (verify) |
| Combat | (CFT, separate from PFT)    | n/a                      |

## Operator's age-band table (input — ⚠ verify, age band 36–40)

| Event              | Minimum (⚠)  | Perfect (⚠)  |
| ------------------ | ------------ | ------------ |
| Pull-ups (max)     | 3            | 20           |
| Crunches, 2 min    | 50           | 100          |
| 3-mile run         | 31:00        | 18:00        |

## CFT note

The operator's "91 lifts of 30 lb ammo box above head" reference
is a **CFT** (Combat Fitness Test) event — distinct from the PFT.
The CFT canonical events are typically:

- **MTC** — Movement-to-Contact (880 yd run, ⚠ verify).
- **AL** — Ammo Lift (30-lb ammunition can presses, 2 min, ⚠ verify).
- **MANUF** — Maneuver Under Fire (combined obstacle/casualty drag,
  ⚠ verify).

The operator's "91 lifts" cited number is the **age-banded perfect
ammo-lift score**; verify against MCO before encoding.

## Plank alternative (recent updates — ⚠ verify)

The USMC has phased in plank as a crunches alternative on the PFT.
Whether plank is currently a graded option or a pilot remains to
be verified for the operator's age band.

## Integration into Always-On

When USMC is the active anchor:

- Primary cardio anchor = **3-mile run**, scored against operator's
  age 36–40 male perfect/minimum range.
- Pull-ups and crunches show as secondary anchors with their own
  trailing-best chips.
- CFT events are surfaced under a separate "Combat" panel and not
  rolled into the PFT composite.

## ⚠ Verification

- Operator's age-band table: `⚠ verify` against current MCO 6100.13.
- Plank alternative status: `⚠ verify`.
- CFT event definitions and ammo-lift table: `⚠ verify`.
- Pull-up vs. push-up scoring delta (push-ups historically scored
  lower): `⚠ verify`.

Verification source: current MCO 6100.13 and Marine Corps Total
Force System (MCTFS) PFT/CFT scoring charts.
