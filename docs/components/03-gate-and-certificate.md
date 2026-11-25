# Component: the deterministic gate + certificate (M3, stages extended in M4–M6)

## Purpose
Run every merge-blocking check as a pure function of pinned inputs and issue a signed certificate when all pass.

## Design
- A **stage** is `{ name: StageName, inputs: (project, diff) => Digest[], run: Effect<StageResult, never, GateServices> }`.
- `GateServices` provides only: read-only FileSystem over the checkout, a simulated Clock, seeded Random, process execution of pinned tools inside the image, and **no network**. The live layer enforces this; tests use an in-memory layer.
- Stages run in a fixed order; independent stages may run in parallel, but results are merged in declared order.
- Stage list (CONTRACTS §9 `StageName`). M3 ships: `classify`, `static` (typecheck), `stack-rules`, `unit`, `build`, `policy`. M4 adds `spec-lints`, `spec-consistency`, `traceability`, `properties`. M5 adds `machines`, `dst`, `mutation`, `perf`. M6 adds `verify-runs`.
- Output: `GateReport` always; `Certificate` only when all stages pass. `reproHash` = sha256 of canonical JSON (sorted keys) excluding `issuedAt` and signatures.
- CLI: `trellis gate [--stage <name>] [--base <sha>] [--json]`. CI: `.github/workflows/trellis-gate.yml` (reusable), runs in the pinned image, signs with Sigstore (ADR-0005), uploads the report and posts the `trellis/gate` check.
- **The gate code used is always taken from the default branch**, not from the PR (ADR-0008).

## Check provenance (ADR-0011, M3)
- Every test/check result is tagged with a computed `CheckOrigin`. Rules for computing it are in CONTRACTS §9.
- Traceability counts only independent origins. The certificate reports `checks.byOrigin` and `independentShare`.

## trend stage (ADR-0014, M3)
- Computes erosion, verbosity, lines per approved clause, and build time; baseline recomputed from the last N commits on `main`.
- Fails on deltas beyond `constitution.trends`; also raises the tier to ≥ 2 with reason `trend:<metric>`.

## differential stage (ADR-0012, M5)
- For each declared reference: start the reference and the project in one sandbox, run `minInputs` generated inputs from the fixed seeds, compare normalized outputs, report differences not in the allowlist with the shrunk input.
- Generator self-check: run each generator's planted-bug suite first; if any planted bug is missed, the stage fails.

## classify stage (diff-intent v0)
Raise the tier (never lower) and record reasons when the diff:
- deletes a test file or a test case, or removes `expect`/`assert` calls;
- adds a suppression, raises any threshold/budget/limit in config, or narrows a rule's scope;
- edits files matched by constitution `tier3`/`tier2` globs;
- adds a dependency or changes the lockfile;
- adds a migration or a new environment variable;
- exceeds `maxPrLines`.

## Acceptance criteria
- **GATE-01** Same commit, same image → identical `reproHash` on 20 historical commits, run on two different machines.
- **GATE-02** A stage that reads the wall clock or network in tests fails with `NondeterminismError` (verified by planting a call).
- **GATE-03** No certificate is produced if any stage fails; the report names the first failing stage and the exact command to reproduce it locally.
- **GATE-04** classify: each diff-intent signal above has a fixture PR that raises the tier with the right reason.
- **GATE-05** Signature verification rejects: wrong signer identity, modified JSON, a certificate for a different commit.
- **GATE-06** Running a PR's modified gate code does not affect that PR's verdict (fixture: a PR that edits a stage to always pass is still judged by `main`'s gate and is tier 3).
- **GATE-08** Provenance: a test added by the implementer is reported as `implementer`; the same file after a constitution PR is `human`; spec-compiler output is `spec-generated`. A clause covered only by implementer tests fails traceability.
- **GATE-09** Trend: a fixture PR that duplicates a module raises verbosity and fails; recomputing the baseline twice gives identical values.
- **GATE-10** (M5) Differential: on a toy key-value store with a planted divergence from its reference, the stage reports the shrunk input; with the divergence allowlisted, it passes; a generator whose planted bug goes undetected fails the stage.
- **GATE-07** Total gate time for the Trellis repo at M3 is ≤ 10 minutes on a standard CI runner (reported, not gating, until M5).
