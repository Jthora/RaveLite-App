# Elite / Bonus Standards

Operator-flagged stretch benchmarks. These are not a primary scoring
context; they're displayed as **trophy badges** on the dashboard
when the operator's anchor performance crosses their threshold.

## Operator input (verbatim)

> Bonus grades include:
>
> - US Navy SEALs have: {4 Miles ≤ 32 minutes} as a requirement for
>   final test.
> - Russian Spetsnaz have: {3 KM ≤ 12 minutes} and
>   {10 KM (+50 KG) ≤ 1 Hr}.

## Navy SEAL — final-test components (⚠ verify)

The SEAL/SWCC selection final test has historically included a
combined 4-mile timed run on hard surface, plus other events. Cite
the **NSW PST (Physical Screening Test)** and the **BUD/S final
graded events** as the canonical sources.

| Event             | Operator threshold | Notes                            |
| ----------------- | ------------------ | -------------------------------- |
| 4-mile run        | ≤ 32:00            | ⚠ verify (8-min/mile pace)      |
| 2-mile swim (fins)| (not in operator brief) | ⚠ verify if surfaced       |
| Push-ups, 2 min   | (not in operator brief) | ⚠ verify if surfaced       |
| Pull-ups, max     | (not in operator brief) | ⚠ verify if surfaced       |

For the dashboard's purposes only the **4-mile ≤ 32:00** badge
is in scope this wave.

## Russian Spetsnaz — operator-flagged benchmarks (⚠ verify)

These figures circulate widely on the internet; canonical Russian
sources are inconsistent and not in English. Treat as operator-folk
benchmarks.

| Event                    | Operator threshold     | Notes                  |
| ------------------------ | ---------------------- | ---------------------- |
| 3 km run                 | ≤ 12:00                | ⚠ verify (~6:25/mi)    |
| 10 km loaded carry +50 kg| ≤ 60:00                | ⚠ verify; high injury risk on a one-month timeline. **Defer.** |

## Integration into Always-On

When an operator's recorded result on the corresponding distance
crosses an elite threshold, the dashboard surfaces a **badge**
on the goal panel:

- `SEAL_4MI` — best 4-mile time ≤ 32:00.
- `SPETSNAZ_3KM` — best 3 km time ≤ 12:00.
- `SPETSNAZ_10KM_LOAD` — deferred (out of scope this wave).

Badges are awarded on rolling 30-day best, **not** on a single
attempt — to avoid the operator chasing a single lucky run.

## ⚠ Verification

- SEAL 4-mile threshold: `⚠ verify` against current NSW PST scoring
  or BUD/S final-test grading sheet.
- Spetsnaz figures: `⚠ verify`. Document the source you used; if
  you can't find a canonical Russian-MoD reference, label the badges
  as "popular benchmark" rather than "official."
- Reconfirm whether operator wants any other elite tier (USAF PJ,
  British SAS, Canadian JTF2, Australian SASR) before adding more
  badges.
