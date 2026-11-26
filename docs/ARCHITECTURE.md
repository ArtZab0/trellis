# Architecture

## Five rings (what changes per project)

| Ring | Lives in | Changes when |
|---|---|---|
| 1. Core | `packages/{schema,core,gate,evidence,spec,dst,rules,ledger}` | Trellis releases |
| 2. Adapters | `packages/orchestrator/src/adapters/*`, `packages/github`, `packages/evidence/src/stores/*` | A vendor changes (agent, code host, CI, sandbox, storage) |
| 3. Engine plugins | `packages/rules/src/engines/*` | A language changes (ESLint, ast-grep, Semgrep, dependency-cruiser, Stryker, fast-check) |
| 4. Stack pack | `packs/stack-*` + `packages/stack-ts` | A framework/stack changes |
| 5. Project pack | The user's repo: `.trellis/`, `features/`, `spec/`, `rules/`, `verify/` | Every day |

Rings 1–4 talk to ring 5 **only** through the file formats in `docs/CONTRACTS.md`.

## Package dependency rules (enforced by dependency-cruiser from M0)

```
schema  ←  core  ←  rules, spec, dst, features, evidence, ledger
                      ↑
                    stack-ts (rules)      diff ← drive (features)
                      ↑                      ↑
                    gate  ←  (rules, spec, dst, features, evidence, diff, drive)
                      ↑
            github, orchestrator, drift, evals
                      ↑
                     cli, apps/*
```

- `schema` imports no internal package.
- `core` imports only `schema`.
- `gate` may import any analysis package; analysis packages never import `gate`.
- Nothing imports `cli` or `apps/*`.
- Adapters (vendor SDKs) are imported only inside `src/adapters/` or `src/live/` folders.
- `packages/*/src/live/` is the only place allowed to touch real I/O (Node APIs, network, clock).
  Everything else receives services through Effect layers, so it runs unchanged under DST.

## Runtime shape

- **CLI** (`trellis`): local and CI entry point. Every gate stage is runnable locally: `trellis gate --stage <name>`.
- **CI**: reusable GitHub Actions workflows call the CLI inside the pinned Trellis container image.
- **GitHub App** (`apps/github-app`): webhooks → classify PR, post checks, apply labels, enforce policy, capture ledger events.
- **Control plane** (`apps/control-plane`): web app (React, certified stack) + API (Effect HTTP) + Postgres.
  Holds: review inbox, replay viewer, trust dashboard, ledger, spec interview sessions, metrics.
- **Artifact store**: S3-compatible bucket for recordings, traces and bundles. (Dogfood target later: the flagship S3 store.)
- **Orchestrator**: a worker process that schedules agent tasks into sandboxes via runner adapters.

## Data that lives where

| Data | Source of truth |
|---|---|
| Config, constitution, feature map, spec, rules, baselines, ADRs, plans | The project's git repo |
| Evidence artifacts (video, rrweb, traces) | Artifact store, referenced by digest from the bundle |
| Evidence bundle manifests, certificates | Artifact store + attached to the GitHub check run |
| Ledger events, metrics, trust state, interview sessions | Control plane Postgres (exportable to the repo as JSONL) |

## Determinism boundary

```
          ┌──────────── deterministic (gate) ────────────┐
inputs →  │ pinned image · lockfile · commit · seeds     │ → verdict + certificate
          │ no LLM · no network · simulated clock        │
          └──────────────────────────────────────────────┘
  non-deterministic (allowed): agents, interviewer, rule-smith drafts, triage, crawler proposals
  → their outputs enter the repo only as PRs, which then pass the gate
```
