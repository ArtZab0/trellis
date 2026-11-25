# Milestones

Each milestone ends with a recorded demo of its exit criteria and a human sign-off. Estimates
assume a fleet of agents working in parallel with one human reviewer; they are targets, not promises.

| # | Name | Packages | Est. |
|---|---|---|---|
| M0 | Bootstrap | repo, CI, tooling | 2–3 days |
| M1 | Contracts and config | schema, core, cli (init/doctor), github (sync) | 1 week |
| M2 | Rules engine + certified stack | rules, stack-ts | 1–1.5 weeks |
| M3 | Gate, certificate, policy, GitHub App | gate, evidence (signing), core (policy), github, apps/github-app | 1.5 weeks |
| M4 | Spec system core | spec | 1.5 weeks |
| M5 | DST, machines, mutation, perf | dst, spec (machines), gate stages | 1.5 weeks |
| M6 | Features, drivers, replay, diffs, evidence | features, drive, diff, evidence | 2 weeks |
| M7 | Control plane | apps/control-plane, ledger (capture) | 2 weeks |
| M8 | Orchestration, ledger loop, drift | orchestrator, ledger (cluster, rule-smith), drift | 1.5 weeks |
| M9 | Spec interviewer, spec packs, evals → launch-ready | spec (interview), packs/*, evals | 2 weeks |

---

## M0 — Bootstrap
**Build:** workspace skeleton per AGENTS.md layout; tsconfig base; ESLint + typescript-eslint + Biome;
Vitest; dependency-cruiser with the ARCHITECTURE rules; GitHub Actions running `pnpm verify`;
CODEOWNERS protecting contracts, ADRs, `.trellis/`, `.github/`; PR template; issue labels.
**Exit:** an empty package in each slot builds and tests green; a test PR that imports `cli` from `core` fails CI; a PR touching `docs/CONTRACTS.md` requires a human code owner.

## M1 — Contracts and config
**Build:** all CONTRACTS types as Effect Schema in `packages/schema` + generated JSON Schemas;
loaders with precise error messages (file, line, path, fix); `trellis init` (scaffold `.trellis/`, generate CODEOWNERS from constitution); `trellis doctor` (checks config validity and GitHub settings drift via the `CodeHost` service); `trellis github sync` (apply rulesets, required checks, labels).
**Exit:** round-trip property tests (parse ∘ print = id) for every contract; `init` + `sync` on a scratch GitHub repo produce the documented settings; `doctor` reports a manually changed ruleset as drift.

## M2 — Rules engine + certified stack
**Build:** rule package loader; engine adapters (eslint, ast-grep, semgrep, dependency-cruiser, trellis-native); fixtures harness (bad must fire, good must not); ratchet/baseline manager; suppression ban; comment policy; structure rules (file/function size, complexity); the `stack-ts-v1` rule set (ADR-0002 list + "I/O only in live/"); oxlint engine adapter + vendored anti-slop rules + ported SlopCodeBench rules (ADR-0015, after the license check); `markdown-cap` and `prototype-lane` rules.
**Exit:** every stack rule has passing fixtures; `trellis check` on this repo is green with zero baselines; adding `// eslint-disable` anywhere fails; a ratchet can only decrease (property-tested); every vendored anti-slop rule has fixtures.

## M3 — Gate, certificate, policy, GitHub App
**Build:** gate pipeline runner (stages as Effect programs with declared inputs → digests); `classify` stage (paths → tier, diff-intent v0: removed assertions, deleted tests, raised thresholds, new deps, new suppressions); certificate + GateReport; reproHash; Sigstore signing in CI; policy evaluation (tier × trust state × certificate → approve/human/block); GitHub App posting `trellis/gate` and `trellis/policy`; the gate always loaded from `main`; check provenance (ADR-0011); `trend` stage with baselines recomputed from `main` history (ADR-0014).
**Exit:** Trellis's own PRs are certified; re-running the gate on the same commit yields an identical reproHash (tested on 20 commits); a PR deleting a test is routed to tier 3; a forged certificate is rejected; a clause covered only by implementer tests fails traceability; a duplication-heavy PR fails the trend stage.

## M4 — Spec system core
**Build:** spec loader; expression parser + type checker; runtime compiler; SMT compiler (Z3 WASM); spec lints (CONTRACTS-listed completeness rules); consistency checker (contradiction, vacuity, unreachable states); scenario → test compiler (via commands); property generation from invariants; traceability (ADR-0007); gate stages `spec-lints`, `spec-consistency`, `traceability`.
**Exit:** a sample spec with a planted contradiction is rejected with a minimal explanation; removing a permission entry fails `spec-lints`; untraced code fails the gate; every invariant in the sample spec runs as a property.

## M5 — DST, machines, mutation, perf
**Build:** DST harness (simulated Clock, Random, FileSystem with crash/torn-write/full-disk faults, Network with delay/drop/partition, process crash/restart); seed replay and shrinking; invariant hooks from the spec; bounded machine checker (reachability, deadlock, terminal-state, timeout semantics); Stryker integration with fixed seed and per-package thresholds; instruction-count perf harness in the pinned image; differential harness (generators with planted-bug self-checks, reference adapters, normalizers, allowlist) and the `differential` gate stage (ADR-0012).
**Exit:** a planted race in a sample service is found and replayed from its seed; the machine checker finds a planted dead state; mutation score is reported per package; perf budgets fail deterministically (± tolerance) across 10 runs; a planted divergence from a toy reference is found and shrunk.

## M6 — Features, drivers, replay, diffs, evidence
**Build:** feature map loader/validator; impact mapper (import graph + driver coverage); driver SDK (Playwright/CDP; HTTP; PTY); recorder (video, screenshots, rrweb, Playwright trace, perf, OTel capture); base-vs-head runner in identical seeded sandboxes; visual, accessibility-tree, behavioral and perf diffs; evidence bundle builder + artifact store client.
**Exit:** on the example app, a CSS change produces an expected visual diff in the named feature and nothing else; an unintended change in another feature raises the tier; bundles are attached to PRs.

## M7 — Control plane
**Build:** Effect HTTP API + Postgres; review inbox (ordered: tier 3, tier 2, escalations, rule proposals, tier 1 samples); replay viewer (synced base/head rrweb + video, step timeline, diff overlays, DOM/network/console/trace panes, comment on frame → PR comment + ledger event); trust dashboard (CONTRACTS metrics); feature-map view; mobile-friendly.
**Exit:** a reviewer can approve a tier 2 PR from a phone using only the inbox and replay; a frame comment appears on the PR and in the ledger.

## M8 — Orchestration, ledger loop, drift
**Build:** runner adapters (Claude Code first, then Codex); sandbox adapter (Docker first); scheduler with area leases, priorities, dedupe; budgets and circuit breaker; `trellis pause`; context-pack builder; ledger capture from GitHub webhooks + replay comments; clustering; rule-smith task generation (draft rule package PRs, labelled constitution); drift detectors (pattern, architecture, docs, tests, deps, behavior) + gardener jobs + weekly report; construction mode (workstreams, convergence, single certified merge), long-lived area agents, scorecard job, push-harder (ADR-0013, ADR-0016).
**Exit:** a human review comment repeated on 3 PRs becomes one clustered ledger item and a rule-smith PR with passing fixtures; the breaker pauses merges when a planted revert spike occurs; ORCH-06 construction-mode run on the example app succeeds.

## M9 — Spec interviewer, packs, evals → launch-ready
**Build:** interview sessions in the control plane (idea → packs → scenario questions with defaults → storyboard/prototype approval → structured spec PR); back-translation check; spec red team (agent + bounded checker); spec packs `accounts-roles`, `ledger`, `file-storage`; replay eval harness + honeypot tasks + routing stats; `stack-ts-v1` golden-path template polished; expected-pain question ranking; prototype-lane gardener; SlopCodeBench runner (required before launch).
**Exit:** a non-technical tester produces an approved, lint-clean spec for a small booking app in under 2 hours without writing YAML; honeypot tasks are detected; SlopCodeBench results (with and without Trellis) are produced on ≥ 3 problems; Trellis is ready to start Flagship A (docs/FLAGSHIPS.md).
