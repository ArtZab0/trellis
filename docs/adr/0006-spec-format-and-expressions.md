# ADR-0006: Structured spec format and expression language

Status: Accepted

## Decision
- The structured spec (CONTRACTS §3) is YAML, generated and maintained by the system, approved per clause.
- Invariants, scenario outcomes and permission conditions use a small total expression language
  (CONTRACTS §3 grammar) with two compilers:
  1. **runtime**: to a pure predicate over a state snapshot (used by properties, scenarios, DST);
  2. **SMT**: to Z3 (via `z3-solver` WASM) for consistency, contradiction and vacuity checks.
- Anything not encodable in SMT is reported as `runtime-only`, never skipped silently.
- Scenarios compile to executable tests that drive the app through its **commands** (not UI) by
  default; UI-level scenario replays use feature drivers.

## Why
A spec that cannot be executed and checked is prose, and prose is where slop hides.
