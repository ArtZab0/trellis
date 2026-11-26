# AGENTS.md — Trellis repo map

Read `HANDOFF.md` first. This file is a map, not a manual. Keep it under 120 lines.

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install (pnpm, frozen lockfile in CI) |
| `pnpm verify` | typecheck + lint + certified-stack rules + tests (+ gate from M3) |
| `pnpm test --filter <pkg>` | Tests for one package |
| `pnpm trellis <cmd>` | Run the CLI from source |
| `pnpm gen` | Regenerate derived files (today: `schemas/*.schema.json`; CI fails if stale) |

## Layout

```
packages/
  schema/        contracts as Effect Schema; generates JSON Schema. Depends on nothing internal.
  core/          config + constitution loading, tiers, policy evaluation, trust state
  rules/         rule package format, engine adapters, runner, ratchets, fixtures harness
  stack-ts/      the certified TypeScript stack rule set (also enforced on this repo)
  spec/          spec format, compiler, spec lints, Z3 consistency, traceability, machine checker
  dst/           deterministic simulation harness (clock, disk, network, crash, seeds)
  features/      feature map, validator, impact mapper
  drive/         driver SDK + recorder (Playwright/CDP, rrweb, traces, perf)
  diff/          visual / structural / behavioral / perf diffs
  evidence/      evidence bundle builder, store, signing
  gate/          the deterministic gate: stages, certificate
  github/        GitHub App logic: checks, rulesets, labels, CODEOWNERS generation
  ledger/        correction capture, clustering, rule-smith task generation
  orchestrator/  agent runner adapters, scheduler, leases, sandboxes, budgets, breaker
  drift/         drift detectors + gardener job definitions
  evals/         replay evals, honeypots, model routing stats
  cli/           `trellis` CLI (thin; calls the packages above)
apps/
  control-plane/ web UI: review inbox, replay viewer, trust dashboard, spec interview
  github-app/    HTTP server wrapping packages/github
packs/
  stack-ts-v1/           golden-path template + drivers SDK defaults + perf budget types
  spec-accounts-roles/   spec pack
  spec-ledger/           spec pack
  spec-file-storage/     spec pack
schemas/         generated JSON Schemas, one per contract (`pnpm gen`; never hand-edit)
tooling/         repo-only checks and generators (lint, deps, repo, gen); not shipped
docs/            ARCHITECTURE, CONTRACTS, MILESTONES, adr/, components/, plans/, questions/
.trellis/        this repo's own Trellis config + constitution (protected)
```

## Rules that bite most often

- All I/O goes through Effect services (`Clock`, `FileSystem`, `Http`, `Process`, `Random`). Importing `node:fs`, `Date.now`, `Math.random` or `fetch` outside `packages/*/src/live/` fails lint.
- No `throw`. Return typed errors in the Effect error channel; define them with `Data.TaggedError`.
- No `any`, `as`, `!`, `null` in domain types. Use `Option`.
- Parse at boundaries with Effect Schema. Internal code trusts the parsed types.
- Dependency direction is enforced; see `docs/ARCHITECTURE.md`.
- Files ≤ 300 lines; functions ≤ 60 lines; cyclomatic complexity ≤ 10.
- Your own tests are advisory for certification (ADR-0011). Acceptance is proven by independent checks.
- Numbers you quote must come from gate or benchmark output (ADR-0016).
- Markdown only in `docs/plans/`, `docs/questions/`, package READMEs (size-capped).

## Where things go

- A new check that blocks merges → `packages/gate/src/stages/` + a contract entry if it changes the certificate.
- A new rule for user projects → `packages/stack-ts/rules/<rule-id>/` (rule package format).
- A new file format → **stop**: it's a contract change (needs a human-approved ADR).
- A decision worth remembering → `docs/adr/NNNN-title.md` (proposed; a human accepts it).
- Something unclear → `docs/questions/<task-id>.md` + an issue labelled `needs-human`.
