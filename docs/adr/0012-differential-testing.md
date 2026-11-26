# ADR-0012: Differential testing against reference implementations

Status: Accepted

## Decision
- A project may declare reference implementations (`trellis.yaml` `references`). The `differential` gate stage replays generated inputs against the reference and the project in the same sandbox and fails on any difference not in the reviewed allowlist.
- References are open-source and pinned by image digest. No paid cloud services in the gate (determinism and cost).
- Generators are seeded, shrink failing inputs, and are themselves tested: a set of planted bugs per generator must be detected (self-check), or the stage fails.
- The allowlist is a constitution-protected file; each entry has a reason and an approver.
- Flagship references: Ceph RADOS Gateway for the S3 store; Beancount for the accounting app.

## Why
A reference implementation is an oracle no agent can game. Jarred Sumner validated a multi-million-line compiler by requiring identical behavior across three execution modes and fuzzing with generated programs.
