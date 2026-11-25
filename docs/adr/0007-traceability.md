# ADR-0007: Definition of traceability

Status: Accepted

## Decision
Traceability is computed, never declared:
- **Clause → check**: every clause id must be the id of at least one generated or hand-written test
  (test title contains `[clause:<id>]`). Missing = gate failure.
- **Code → clause**: the gate runs all clause checks with per-test coverage. A *code unit* (exported
  function, command handler, machine transition, UI component in `src/features/**`) is traced if at
  least one clause check executes it. Untraced code units in certified zones fail the gate as
  "unspecified behavior".
- Framework code in `packs/*/framework` and generated code are exempt from code → clause but not from other rules.

## Why
"Every line exists because the spec asked for it" is the deterministic version of "no slop features".
