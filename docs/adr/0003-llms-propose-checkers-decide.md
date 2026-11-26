# ADR-0003: LLMs propose, deterministic checkers decide

Status: Accepted

## Decision
- No LLM output can change a gate verdict or appear as a certificate result.
- The verifier agent's verdict is recorded in the evidence bundle as **advisory**. It can raise a PR's
  tier (route it to a human); it can never lower it or approve.
- The gate runs offline except for a pinned package mirror: no wall clock, no unseeded randomness, no network.
- Reproducibility is tested: a nightly job re-runs the gate on 5 random certified commits and compares `reproHash`.
  A mismatch is a P1 incident.

## Why
A guarantee is only worth something if anyone can re-run it and get the same answer.
