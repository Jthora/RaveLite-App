# Fitness Standards Reference

This folder holds **reference tables** for every PFT/grading standard
the operator wants the Always-On dashboard to score against.

## ⚠ Verification required on every standards doc

The operator explicitly asked for these standards to be looked up
and verified. The numbers in these docs come from two sources:

1. **Operator input** — what the operator wrote on the whiteboard
   or in the design brief. Reproduced verbatim, marked as such.
2. **Author memory** — common-knowledge ranges. Reproduced with
   `⚠ verify` flags wherever a specific cut score is cited.

**No standards document in this folder should drive scoring code
until each table has been cross-checked against the official source
of record** (DoD instruction, branch fitness manual, or USSF policy
memo). See [task-backlog.md](../05-roadmap/task-backlog.md) for the
verification tasks (`AOS-V##`).

## Files

- [personal-goals.md](personal-goals.md) — operator's own targets,
  age, horizon.
- [grading-table-3mi.md](grading-table-3mi.md) — operator's whiteboard
  3-mile grade table.
- [ussf.md](ussf.md) — US Space Force PFT.
- [usaf.md](usaf.md) — US Air Force PFT.
- [usmc.md](usmc.md) — USMC PFT.
- [usn.md](usn.md) — US Navy PRT.
- [usa.md](usa.md) — US Army ACFT.
- [elite-bonus.md](elite-bonus.md) — Navy SEAL final-test components,
  Russian Spetsnaz benchmarks. Operator-requested bonus tier.

## Source-of-truth contract

Each standards doc carries a `## Verification` section listing:

- The presumed canonical source.
- The operator-input columns.
- The unverified columns flagged `⚠ verify`.
- The author-memory columns flagged `⚠ verify (memory)`.

Once verified, the verifier replaces the flag with a citation
(`✓ verified <source>, <date>`) and the table becomes safe to
import into scoring code.
