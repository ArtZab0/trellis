# Component: rules engine + certified stack rules (M2)

## Purpose
Run every structural rule over a repo through one manifest format, regardless of the engine, and ship the `stack-ts-v1` rule set.

## Interfaces
- `@trellis/rules`
  - `loadRules(project): Effect<RulePackage[]>` from the stack pack, spec packs and `rules/`.
  - `runRules(project, changedFiles?): Effect<RuleReport>` → `{ violations: Violation[], ratchets: RatchetResult[] }`; `Violation = { rule, file, line, col, message, fix? }`.
  - Engine adapters implement `Engine = { id, run(rules, files): Effect<Violation[]> }`: `eslint`, `ast-grep`, `semgrep`, `dependency-cruiser`, `trellis` (native checks: size, complexity, comments, suppressions).
  - `testRule(pkg)`: runs fixtures; `bad/` must produce ≥ 1 violation per file, `good/` must produce 0.
  - Ratchets: `baseline.json` locations are content-hashed so moved code stays matched; the count may only decrease; `trellis rules rebaseline` is allowed only to decrease and requires tier 3 otherwise.
- `@trellis/stack-ts`: rule packages for ADR-0002, plus:
  - `no-ambient-io` (Node built-ins, `fetch`, `Date`, `Math.random`, `process.env` outside `src/live/**`)
  - `no-suppressions` (`eslint-disable*`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `.skip`, `.only`, `xit`, `it.todo` in committed code)
  - `comment-policy` (only `WHY: <ADR link>` notes, public doc comments, license headers)
  - `size-limits` (file ≤ 300 lines, function ≤ 60, cyclomatic ≤ 10, params ≤ 4)
  - `no-use-effect-in-product`, `ui-kit-only` (JSX intrinsic elements only inside the UI kit)
  - `schema-at-boundary` (HTTP handlers, env reads, DB row mapping must call a Schema decoder)
  - `machine-for-lifecycle` (string-literal status fields with > 2 values must be owned by a declared machine)

## Additions (ADR-0013, ADR-0015)
- `oxlint` engine adapter; vendored anti-slop rules wrapped as rule packages with fixtures; TypeScript-applicable SlopCodeBench quality rules ported.
- `markdown-cap`: agent-authored `.md` files only under `constitution.markdown.agentWritableGlobs`, each ≤ `maxBytesPerFile`; plans in `docs/plans/done/` older than 30 days are archived by the gardener.
- `prototype-lane`: code under `constitution.prototypes.globs` must be reachable only behind a flag check (verified from the flag adapter's call sites); certified code may not import from prototype globs.

## Acceptance criteria
- **RULES-08** oxlint adapter: same determinism guarantee as RULES-02; every vendored anti-slop rule has bad/good fixtures.
- **RULES-09** `markdown-cap` and `prototype-lane` have fixtures; importing a prototype module from a certified zone fails.
- **RULES-01** Every rule in `stack-ts` passes `testRule`; CI runs fixtures for all rules on every PR.
- **RULES-02** The same repo + same rules give byte-identical `RuleReport` JSON across 5 runs.
- **RULES-03** A rule package without both fixture dirs fails to load with a clear error.
- **RULES-04** Ratchet property: for any sequence of commits, a passing run never has `count` greater than the previous baseline.
- **RULES-05** `no-suppressions` cannot be disabled by config; attempting it is a load error.
- **RULES-06** Error messages are rendered from `message.md` and include the root-cause fix; snapshot-tested.
- **RULES-07** `trellis check` on the Trellis repo is green with zero baselines at M2 exit.
