# ADR-0011: Only independent checks count toward the guarantee

Status: Accepted

## Decision
- Every check carries a computed `CheckOrigin` (CONTRACTS §9): `spec-generated`, `external-suite`, `reference`, `human`, or `implementer`.
- Only the first four count toward the certificate's guarantee. `implementer` tests run and block on failure, but are listed as advisory.
- Origin is computed from evidence (generator output hashes, pinned suite digests, constitution-PR history), never from annotations an agent could write.
- The certificate reports counts per origin and `independentShare`. Every spec clause must be covered by at least one independent check (traceability uses independent checks only).

## Why
From Jarred Sumner's Bun ahead-of-time compiler work: the project was trustworthy because its tests predated it and agents couldn't have shaped them. Once the implementer writes or rewrites the tests, the tests stop being evidence.
