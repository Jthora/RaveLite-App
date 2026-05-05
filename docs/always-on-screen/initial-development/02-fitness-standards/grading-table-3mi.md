# 3-Mile Grading Table (Operator Whiteboard)

Reproduced verbatim from the operator's whiteboard. **This is operator
input, not an official standard.** It is not aligned with any specific
branch's official 3-mile cut scores (most branches grade by 1.5 or 2
miles). Treat it as the operator's personal grading lens.

## Source

Operator design brief, May 2026. Whiteboard at the dev workstation.

## Table

| Mins | Grade | MPH (≈) | Pace (min/mi) |
| ---- | ----- | ------- | ------------- |
| 18   | A+    | 10.00   | 6:00          |
| 19   | A     | 9.47    | 6:20          |
| 20   | A−    | 9.00    | 6:40          |
| 21   | B+    | 8.57    | 7:00          |
| 22   | B     | 8.18    | 7:20          |
| 23   | B−    | 7.83    | 7:40          |
| 24   | C+    | 7.50    | 8:00          |
| 25   | C     | 7.20    | 8:20          |
| 26   | C−    | 6.92    | 8:40          |
| 27   | D+    | 6.67    | 9:00          |
| 28   | D     | 6.43    | 9:20          |
| 29   | D−    | 6.21    | 9:40          |
| 30   | F+    | 6.00    | 10:00         |
| 31   | F     | 5.81    | 10:20         |

## Notes

- The operator's primary goal is **B+ (21 min) or better** —
  i.e. the 7-min-mile target.
- The MPH values in the operator brief are rounded; the table here
  recomputes them as `180 / minutes` to two decimals for internal
  consistency.
- The pace column was added by the author; verify it matches the
  operator's mental model before exposing it in the UI.

## How to use in scoring code

Lookup is by time-to-complete in seconds:

```
gradeFor3Mi(seconds: number) → 'A+'|'A'|...|'F'|'F-'
```

Brackets are inclusive on the better end (e.g. exactly 21:00 =
B+, 21:01–22:00 = B). Below 18:00 → cap at A+. Above 31:00 →
return `F` and let the UI surface "below floor; record only."

## ⚠ Verification

- Operator-input table; no canonical source claimed.
- No verification needed against an external standard, but the
  operator should confirm the cap rule (A+ for sub-18 vs. some
  notion of A++).
