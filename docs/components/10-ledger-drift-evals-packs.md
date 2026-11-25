# Components: ledger + rule-smith, drift, evals, spec packs (M8–M9)

## Ledger — `@trellis/ledger`
- Capture sources: GitHub review comments by humans; human commits on `agent/*` branches (diff agent→final); reverts; escaped-defect issues (label); incidents; verifier rejects; replay comments; drift findings.
- Clustering: embeddings + threshold, **advisory only** (it groups work; it never gates). Cluster = { id, summary, count, areas, examples }.
- Classification proposal (agent): impossible-by-API / static rule / runtime property / prose. Human confirms in the inbox.
- Rule-smith: creates a task to draft a rule package (CONTRACTS §5) with fixtures from the cluster's real examples, codemod or baseline, and message with root-cause fix. Output PR is labelled `constitution` (tier 3).
- Recurrence tracking: after a rule merges, new events matching the cluster are counted; a prose resolution violated twice auto-proposes promotion.

## Drift — `@trellis/drift`
Nightly detectors, each producing findings → gardener tasks or ledger events:
pattern (jscpd duplication, deprecated-pattern near-clones, ratchet counts), architecture (graph vs ARCHITECTURE.md, cycles, fan-in), intent (crawler vs feature map, dead drivers), docs (AGENTS.md/skills dead references, size budget), behavior (golden replays on `main`, perf trend vs 30-day baseline + bisector), tests (mutation trend, skipped/quarantined), dependencies (outdated, abandoned > 18 months, CVEs, license change), environment (image vs prod, IaC plan drift). Weekly garden report generated as markdown + digest.

## Evals — `@trellis/evals`
- Replay eval suite: mine merged, never-reverted, certified PRs → task specs at parent commit → run candidate runner/model → score (gate pass, clause checks, cost, time, rule violations, attempts).
- Honeypots: tasks whose tests contradict the spec; the only correct outcome is `escalated`. Any "success" flags the runner config and triggers re-audit of its last 50 PRs.
- Model routing stats per task type; canary flow: tier 0 → shadow tier 1 → promote.
- **SlopCodeBench runner** (required before launch): run the benchmark's problems in the certified TypeScript stack with the same agent and model, once raw and once inside Trellis (spec from the checkpoint statement, gate, area agent across checkpoints). Report checkpoint pass rate, erosion and verbosity using the benchmark's own scoring. Results are published with configs and seeds.
- **Prototype lane gardener**: on expiry, opens a PR deleting the prototype or a graduation task (interview → construction mode).

## Spec packs (M9) — `packs/spec-*`
Each pack: `pack.yaml` (name, version, risk level), entities, roles, commands, machines, invariants, scenarios, policies, mandatory questions with defaults and "why it matters", plus fixtures proving the pack lints clean and its invariants are consistent.
- `accounts-roles`: users, orgs/tenants, invitations, roles, sessions, password reset, MFA option, account deletion + retention.
- `ledger`: accounts (chart), journal entries with lines, double-entry invariant, append-only with reversals, periods + closing, multi-currency off by default, report reconciliation invariants. Risk: high.
- `file-storage`: buckets/folders, objects, versions, multipart uploads, access policies, presigned links, quotas, lifecycle rules. Risk: high (data loss).

## Acceptance criteria
- **LED-01** Three similar human comments across PRs → one cluster; rule-smith PR with passing fixtures built from the real examples.
- **DRIFT-01** Each detector has a fixture repo state that triggers it and one that doesn't.
- **EVAL-01** Replay suite of ≥ 30 tasks from Trellis's own history runs nightly with a stable score for an unchanged config (variance reported).
- **EVAL-02** All honeypots in the suite end `escalated` for the default runner config.
- **EVAL-03** SlopCodeBench runner produces both scores on at least 3 problems end to end, reproducibly from recorded configs.
- **PACK-01** Each launch pack loads, lints clean, is consistent (Z3), and ships ≥ 10 scenarios and ≥ 5 invariants.
