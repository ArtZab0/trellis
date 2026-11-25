# Component: orchestrator (M8)

## Purpose
Run agent work as tasks: schedule, sandbox, budget and stop it, independent of agent vendor.

## Interfaces
- `Runner` service: `run(task: TaskSpec, ctx: ContextPack, sandbox: Sandbox): Effect<TaskResult, RunnerError>`. Adapters: `claude-code` (headless CLI), `codex` (CLI), then `cursor`, `openhands`.
- `Sandbox` service: `create(image, seed, egressAllowlist) / exec / copyIn / copyOut / destroy`. Adapters: `docker` first; `e2b`, `modal`, `firecracker` later. Sandboxes never receive production credentials; Git credentials are installation tokens scoped to `agent/*` branches with ≤ 1 h lifetime.
- **Context pack** builder: feature entries for named features; spec clauses (plain English + ids); rules scoped to touched globs with their messages; open ledger clusters for the area; related ADRs and active plan; skills for the relevant drivers; hard cap on size (default 30k tokens) with priority order above.
- **Scheduler**: priority queue (incident > escaped-defect fix > constitution work > planned > gardening); area leases (max K concurrent per area); dedupe by (feature set, goal hash); retries up to `budget.attempts`, then `escalated` with a one-paragraph summary and best replay.
- **Budgets**: per task / day / month (config); cost is metered from runner usage reports; exceeding any cap stops new tasks.
- **Circuit breaker**: evaluates constitution `breaker` thresholds every 15 min from control plane metrics; open → pause outer loop, set all policy decisions to `needs-human`, notify. `trellis pause` / `trellis resume` manual controls.
- **Agent roles** (prompts + skills live in `packs/stack-ts-v1/agents/`): planner, implementer, verifier (advisory), rule-smith, gardener, fuzzer, bisector, triager.
- Every agent action is appended to the audit log (task, runner, model, tools called, files written, commands run, cost).

## Build modes, area agents, scorecard (ADR-0013, ADR-0016)
- **Construction mode**: `trellis workstream open <name> --spec-slice <clauses>` creates `build/<name>`, a swarm plan, and leases; agents commit directly to the branch with stages 0–2 only; `trellis workstream converge` switches to area agents running the full gate until green; `trellis workstream merge` opens the single tier 2 PR.
- **Area agents**: one persistent session per area (`areaAgent` in TaskSpec), checkpointed to a summary file every N turns, restartable. Verification, evals and honeypots always use fresh agents.
- **Scorecard job**: hourly in construction mode, daily otherwise; reads gate and benchmark outputs only; posts to the control plane and digest with previous values.
- **Push harder**: control-plane action creates a follow-up task with `target` set; outcome recorded for evals.

## Acceptance criteria
- **ORCH-06** Construction mode on the example app: 10 parallel agents on one workstream, convergence to a green full gate, single merge PR with a certificate.
- **ORCH-07** No agent-reported number appears in the scorecard (scorecard inputs are only gate/benchmark artifacts; verified by schema).
- **ORCH-08** An area agent restarted from its checkpoint continues a task without re-reading the whole area (token use on restart ≤ 30% of a cold start, reported).
- **ORCH-01** A task on the example app runs end to end with the claude-code adapter in Docker: branch, PR, evidence, result recorded.
- **ORCH-02** Two tasks on the same area beyond K wait for the lease; dedupe merges identical tasks (property over random task streams).
- **ORCH-03** A task exceeding its USD budget is stopped and marked escalated; the day cap blocks further tasks.
- **ORCH-04** Breaker opens on a synthetic revert spike and closes only by manual resume.
- **ORCH-05** Untrusted content handling: when an issue body is included in context, the runner config drops network-write and secret-bearing tools (verified with a planted prompt-injection fixture that tries to push to `main` and exfiltrate an env var — both must fail).
