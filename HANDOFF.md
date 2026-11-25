# Trellis — Handoff to Coding Agents

You are building **Trellis**: an open-source, agent-agnostic framework that certifies AI-written
software is not slop. It does this by construction:

1. a **certified stack** narrow enough that every class of slop is impossible or mechanically decidable;
2. a **deterministic gate** that certifies every build (LLMs propose, deterministic checkers decide);
3. a **spec system** that lets non-technical people produce a complete, consistent spec through
   scenario approval instead of writing it.

The full product spec lives in the Trellis doc (owner shares the link). This package is the
build contract. Where this package and the doc disagree, **this package wins**; raise a question.

## Read in this order

1. `HANDOFF.md` (this file): mission, rules, process
2. `AGENTS.md`: map of the repo you will create
3. `docs/ARCHITECTURE.md`: packages, layers, allowed dependencies
4. `docs/CONTRACTS.md`: file formats and core types. **Frozen; change only through a human-approved ADR.**
5. `docs/adr/`: decisions already made
6. `docs/MILESTONES.md`: what to build in which order, with exit criteria
7. `docs/components/*.md`: per-component specs with acceptance criteria
8. `tasks/backlog.yaml`: ready-to-pick tasks for M0–M3
9. `docs/FLAGSHIPS.md`: what the framework must support for launch (S3 store, accounting app)

## Non-negotiable rules

1. **Determinism.** Any check that can block a merge or appear in a certificate must give the same
   verdict for the same inputs. No LLM calls, network calls (other than the pinned package mirror),
   wall-clock reads or unseeded randomness inside the gate. LLMs may *generate* code, tests, specs
   and rule drafts; they never *judge*.
2. **Dogfood the certified stack.** Trellis is written in the certified TypeScript stack it enforces
   (ADR-0002). From M2 the stack rules run on this repo; from M3 the gate is a required check here.
3. **Contracts are frozen.** Do not change `docs/CONTRACTS.md`, ADRs, `.trellis/constitution.yaml`,
   `CODEOWNERS` or `.github/` without a PR labelled `constitution` that a human approves.
4. **No suppressions.** No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `.skip`, `.only`,
   or raised thresholds. If a rule is wrong, open a `constitution` PR to change the rule.
5. **Never weaken a test to make it pass.** If a test conflicts with the spec, stop and escalate.
6. **Small PRs.** ≤ 400 changed lines, excluding generated files and fixtures. Split otherwise.
7. **Evidence in every PR.** Every PR description has: task id, acceptance criteria → how each is
   verified, test output summary, and (once M6 lands) the evidence bundle link.
8. **No comments that justify workarounds.** Comments are allowed only as `WHY:` notes that link to
   an ADR, and as public-API doc comments. Fix the root cause or escalate.
9. **Your own tests don't certify your code.** Write them; they must pass. But acceptance criteria
   are satisfied only by independent checks (ADR-0011): spec-generated, external suites, reference
   comparisons, or tests a human approved. Never edit those to make your code pass.
10. **Never report your own measurements.** Performance, size, coverage and trend numbers come from
    the gate or benchmark jobs (ADR-0016). Quote their output; don't estimate.
11. **Aim high.** When a task has a measurable target, try the ambitious approach first. Don't talk
    yourself out of an idea with an estimate; measure it with the harness.
12. **Markdown is capped.** Write markdown only in `docs/plans/`, `docs/questions/` and package
    READMEs, within the size limit. No design-doc sprawl.

## Bootstrap (the gate doesn't exist yet)

| Phase | Merge rule on this repo |
|---|---|
| M0–M1 | Conventional CI (typecheck, lint, test). A human approves every PR. |
| M2 | Certified-stack rules + suppression ban required. A human approves every PR. |
| M3 onward | `trellis/gate` and `trellis/policy` are required checks; Trellis certifies itself. Auto-merge allowed only for Tier 0, and only after a human enables it per package. |
| M6 onward | Evidence bundles required on every PR. |

## Working protocol

1. Pick the highest-priority task in `tasks/backlog.yaml` whose `depends_on` are all done and
   that no other agent has claimed. Claim it by opening a draft PR named `agent/<task-id>-<slug>`.
2. For multi-PR work, write a plan in `docs/plans/active/<task-id>.md` (goal, steps, decisions log).
3. Write tests from the acceptance criteria **first**, then implement.
4. Run `pnpm verify` locally (typecheck, lint, test, plus the gate once it exists) before pushing.
5. Mark the PR ready. Fill the PR template. Respond to review by changing code, not by arguing in comments.
6. When done, move the plan to `docs/plans/done/` and set the task's status to `done` in the backlog.

## When to stop and escalate (open an issue labelled `needs-human`)

- The task requires changing a contract, an ADR, or a protected path.
- Two requirements conflict, or a requirement is ambiguous in a way that changes behavior.
- A test appears wrong.
- You failed the same acceptance criterion 3 times.
- A dependency outside the approved list (`docs/adr/0009-dependencies.md`) seems necessary.

Then continue with another unblocked task. Do not guess on contracts.

## Definition of done (every task)

- [ ] All acceptance criteria have an automated test that is named with the criterion id.
- [ ] Typecheck, lint, certified-stack rules and tests pass; there are zero suppressions.
- [ ] New public APIs have doc comments and an example in the package README.
- [ ] Determinism: running the package's tests twice with the same seed gives identical output (CI checks this from M3).
- [ ] Mutation score ≥ 0.70 on new code in `core`, `gate`, `spec`, `dst`, `policy` (from M5).
- [ ] The PR is ≤ 400 lines, or the split is explained.

## What humans own

- The constitution, contracts, ADRs, the dependency allowlist.
- Approving Tier 2 and 3 PRs.
- Milestone sign-off (each milestone's exit criteria are demonstrated in a short recorded demo).
