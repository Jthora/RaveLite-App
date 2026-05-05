# US Air Force — PFT Standards

⚠ **Verification status: UNVERIFIED**. Numbers below are operator
input from the design brief plus author-memory of the AFI 36-2905
framework. Verify against the **current AFI 36-2905** and the
component-alternative scoring tables before scoring code consumes
them.

## Operator input (verbatim, age 38 reference)

> AF Male PFT (38 y/o) is:
>
> - 1.5 mile: minimum 13:36 (6.7 mph), perfect 9:12 (9.8 mph)
> - Push-ups: minimum 27, perfect 51
> - Sit-ups: minimum 42, perfect 52
> - Forearm planks: minimum 1:50, perfect 3:20
>
> *(Operator note: "check these numbers... they aren't exactly
> correct. Consider I'm age 39 now")*

## Operator's age-39 working table (input — ⚠ verify)

| Component       | Minimum (⚠)      | Perfect (⚠)      |
| --------------- | ---------------- | ---------------- |
| 1.5-mile run    | 13:36            | 9:12             |
| Push-ups, 1 min | 27               | 51               |
| Sit-ups, 1 min  | 42               | 52               |
| Forearm plank   | 1:50             | 3:20             |

## Component alternatives (current AFI framework — ⚠ verify)

The USAF allows operators to choose among component alternatives:

- Cardio: **1.5-mile run** OR **20-m HAMR shuttle** OR **2 km walk**.
- Core: **1-min sit-ups** OR **1-min cross-leg reverse crunches**
  OR **forearm plank**.
- Upper: **1-min push-ups** OR **1-min hand-release push-ups**.

The component scores combine to a 100-point composite; passing
threshold is typically 75 with no component below its tier-minimum.
**All scoring weights `⚠ verify`.**

## Age-band notes

- The operator was 38 at brief authorship and is 39 at the time of
  this document. AFI age bands typically span 35–39 and 40–44, so
  the operator stays in the same band for the immediate horizon —
  but should re-check at the 40th birthday transition.

## Integration into Always-On

When the operator selects USAF as the active PFT (FR-8), the
dashboard:

- Surfaces 1.5-mile run as the primary anchor.
- Surfaces push-ups, plank (operator's whiteboard preference over
  sit-ups), and a sit-up alternative as secondary anchors.
- Computes component scores **against the operator's working table
  above** until verified scoring tables replace it.
- Displays a `⚠ tentative scoring` badge until verification lands.

## ⚠ Verification

- Cardio alt list: `⚠ verify`
- Core alt list: `⚠ verify`
- Upper alt list: `⚠ verify`
- Age-band 35–39 male cut scores: operator-input, `⚠ verify`
- Composite passing threshold: `⚠ verify`

Verification source: current AFI 36-2905 (or successor publication)
and the official USAF fitness scoring charts hosted by AFPC.
