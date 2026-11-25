# Component: spec system (core M4, interviewer M9)

## Purpose
Turn a plain-English idea into a structured spec that is complete, consistent and executable, and make
every line of code trace back to it. Non-technical users approve scenarios; they never write YAML.

## Core (M4) — `@trellis/spec`
1. **Loader**: `spec/*.yaml` → `Spec` (CONTRACTS §3); packs are merged in (pack clauses keep `source: pack:<name>`; project clauses can override pack defaults only through an explicit `overrides:` entry, which is itself a clause needing approval).
2. **Expression front end**: parser → AST → type checker against entity fields (money vs. int, enum membership, ref paths). Errors point at clause id + column.
3. **Runtime compiler**: `Expr → (state: Snapshot) => boolean`. `Snapshot` is the read model the app exposes to checks through a generated `SpecProbe` service (every certified app implements it; the stack pack generates it from entities).
4. **SMT compiler**: `Expr → Z3 AST` with sorts for entities (uninterpreted + field functions), enums (datatypes), Int/Money (integers in minor units), Instant (Int). Quantifiers over entities are bounded by a configurable model size (default 4 instances per entity) for satisfiability checks.
5. **Spec lints** (deterministic; each has an id, message and fixture):
   - `SL-perm-complete`: every role has an explicit entry (list membership or condition) for every action on every entity and every command.
   - `SL-machine-reach`: every state is reachable from the initial state; `SL-machine-exit`: every non-terminal state has an outgoing transition; `SL-machine-owner`: every lifecycle field belongs to a machine.
   - `SL-money`: Money fields require `policies.money`; `SL-time`: Instant fields require `policies.time`.
   - `SL-input-validation`: every command input field has a constrained type (no bare `Text` without `max`).
   - `SL-retention`: every entity with `delete` permitted for anyone has a retention rule; `SL-pii`: every field listed under personal data has purpose and readers, and every Email/name-like field is listed or explicitly marked non-personal.
   - `SL-refs`: scenarios and expressions reference only defined entities, fields, states, roles, commands.
   - `SL-approved`: every clause in a certified build has `approval` (pack and default clauses are approved by the pack/user acceptance record).
6. **Consistency checker** (Z3): contradiction (invariants jointly unsatisfiable), vacuity (invariant implied false-premise / never triggered), permission conflicts (a condition both grants and denies), scenario `then` contradicting an invariant. Output is a minimal unsat core mapped back to clause ids and plain English.
7. **Check generation**:
   - each invariant → fast-check property over random command sequences (commands from the spec, actors from roles), asserting the invariant on `SpecProbe` after every step;
   - each scenario → deterministic test (given/when via commands at simulated times; then via the runtime compiler);
   - each machine → model-check job (M5) + conformance test that the implementation's transition table equals the declared one;
   - each budget → perf check (M5).
   Generated tests carry `[clause:<id>]` in their title (ADR-0007).
8. **Traceability** (ADR-0007): per-test V8 coverage → map code units to clause ids → report untraced units.

## Interviewer (M9) — control plane + agents
Pipeline (each step persisted in an interview session; LLM steps are proposals the user accepts):
1. **Idea capture**: the user writes or speaks the idea → `spec/story.md` draft.
2. **Pack selection**: agent maps the story to spec packs; user confirms in plain language ("Your app has: sign-in, roles, invoices, payments").
3. **Draft structured spec**: agent drafts entities, commands, machines, invariants from story + packs.
4. **Lint loop**: run spec lints + consistency; every finding becomes a **scenario question** (concrete situation, 2–4 options, a recommended default, "why this matters" in one sentence). Non-business findings are auto-resolved with pack defaults and listed in a "decided for you" panel.
5. **Red team**: an adversarial agent proposes edge situations; the bounded checker confirms which ones the spec leaves undecided; only confirmed gaps become questions.
6. **Approve behavior**: each scenario is shown as a storyboard (generated frames from the UI kit) or a clickable throwaway prototype; ✓ records `approval`, ✗ + note becomes a follow-up question.
7. **Back-translation**: a second model (different family) describes the structured spec in plain English without seeing the story; a diff against the story highlights mismatches as questions.
8. **Commit**: the approved spec is opened as a PR (tier 3, author = user) and becomes the build contract.

Question ranking (expected pain): each candidate question gets `P(change later) × cost of change`, using pack metadata (data model, money, permissions, external contracts = high cost; copy, colors, layout = low cost). High-pain questions are always asked and require explicit approval; low-pain ones get defaults listed in the "decided for you" panel. Data model and schema clauses can never be auto-approved.

Risk gating: if any pack in use is flagged `risk: high` (money, health, personal data), mandatory questions must be answered before step 8.

## Acceptance criteria
- **SPEC-01** Parser/type-checker: 100 valid and 100 invalid expression fixtures; errors carry clause id and column.
- **SPEC-02** Runtime and SMT compilers agree: for random small models (fast-check) every SMT-encodable invariant evaluates identically under both.
- **SPEC-03** Each spec lint has bad/good fixtures (same harness as rules).
- **SPEC-04** Planted contradictions (10 fixtures) are reported with an unsat core naming exactly the conflicting clauses.
- **SPEC-05** Sample "mini-ledger" spec: generated properties find a planted bug (unbalanced transaction path) within the fixed seeds.
- **SPEC-06** Traceability flags a planted unspecified function and passes once a clause covering it is added.
- **SPEC-07** Spec processing is deterministic: same spec → byte-identical generated tests and reports.
- **INT-01** (M9) A non-technical tester completes an interview for a small booking app in ≤ 2 hours, producing a spec that passes all lints with zero hand-written YAML.
- **INT-02** (M9) Every lint finding in an interview is either auto-resolved by a pack default (listed) or turned into a question; none are dropped.
