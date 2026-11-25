# Component: schema, core, CLI (M1)

## Purpose
Load, validate and print every contract; give users `trellis init`, `trellis doctor`, and the CLI shell all later commands plug into.

## Interfaces
- `@trellis/schema`: one Effect Schema per contract (`TrellisConfig`, `Constitution`, `Spec`, `Feature`, `RulePackage`, `Baseline`, `TaskSpec`, `LedgerEvent`, `EvidenceBundle`, `Certificate`, `GateReport`). `pnpm gen` emits `schemas/*.schema.json`.
- `@trellis/core`:
  - `loadProject(root): Effect<Project, LoadError, FileSystem>`: reads every contract file, returns a typed `Project`.
  - `tierOf(paths, constitution, features): Tier`
  - `LoadError` is a tagged union carrying `{ file, line, column, path, message, fix }`.
- `@trellis/cli`: commands registered as `{ name, args: Schema, run: Effect }`; output is human text by default and `--json` gives machine output; exit codes 0 (ok), 1 (check failed), 2 (usage/config error).
  - `trellis init [--stack stack-ts-v1] [--yes]`
  - `trellis doctor [--fix]`
  - `trellis github sync`

## Acceptance criteria
- **CORE-01** Every contract round-trips: `parse(print(x)) ≡ x` for generated `x` (fast-check, 1,000 runs, fixed seed).
- **CORE-02** Invalid files produce a `LoadError` with file, line and a one-line fix suggestion; snapshot-tested for 20 invalid fixtures.
- **CORE-03** Unknown `version` is rejected with an upgrade hint.
- **CORE-04** `tierOf` returns the max over path tiers and feature tiers; property: adding a path never lowers the tier.
- **CLI-01** `trellis init` on an empty repo creates `.trellis/trellis.yaml`, `.trellis/constitution.yaml`, `AGENTS.md`, `ARCHITECTURE.md`, `features/`, `spec/story.md`, `rules/`, `verify/`, `docs/adr/`, `docs/plans/{active,done}`, and generated `CODEOWNERS`; it is idempotent.
- **CLI-02** `trellis doctor` exits 1 and lists each drifted GitHub setting (ruleset, required check, CODEOWNERS mismatch, app permissions) using a fake `CodeHost` in tests.
- **CLI-03** `trellis github sync` applies the documented settings through `CodeHost`; running it twice makes no changes the second time.
