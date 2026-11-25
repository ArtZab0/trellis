# Flagships and the example app

The framework is done when it can build these. Use them to check that design decisions hold up.
Do **not** start the flagships before M9 is signed off.

## Example app (built during M6; the test bed for M6–M9)
`examples/notes` — a small certified-stack web app with 5 features (`notes.create`, `notes.edit`,
`notes.search`, `notes.share`, `auth.session`), a spec with ≥ 3 invariants, 1 machine (note sharing
lifecycle), 5 scenarios and drivers for every feature. Every component's acceptance tests that mention
"the example app" use it.

## Flagship A — S3-compatible object store (Act 2)
A replacement for MinIO's abandoned community edition, including a web admin console.

Requirements the framework must support:
- multi-node DST with crash, torn-write, full-disk and partition faults (component 06);
- an external conformance suite (Ceph s3-tests) as a gate stage: a declared feature list and a pass threshold, with excluded tests listed in the certificate;
- HTTP-level drivers and recording (no UI) plus UI drivers for the console;
- the `file-storage` spec pack;
- instruction-count budgets on hot paths (PUT/GET small objects, multipart complete, listing).

Reference implementation (differential, ADR-0012): Ceph RADOS Gateway, pinned by digest. Generated request
streams cover object operations, multipart, versioning and policies. Built in construction mode (ADR-0013).

Published targets: zero unlisted differences from Ceph RGW across ≥ 1M generated requests; ≥ 95% s3-tests on the declared feature set; 0 acknowledged writes lost over ≥ 10M simulated operations; feature set = buckets, objects, multipart, versioning, presigned URLs, users + policies, OIDC login, web console; single node + 3-node replication.

## Flagship B — small-business accounting (Act 3)
Specified end-to-end by a **non-technical tester** through the interviewer; humans only approve the constitution.

Requirements the framework must support:
- the interviewer (component 05) and the `ledger` + `accounts-roles` packs;
- money-safe expressions (minor units, rounding policy) in specs and properties;
- report reconciliation invariants (balance sheet balances; P&L ties to retained earnings) as DST invariants;
- bank CSV/OFX import with golden-file properties;
- a client-shareable feature-map view.

Reference implementation (differential, ADR-0012): Beancount, pinned by digest. Generated journals are imported
into both; trial balance, balance sheet and income statement must match to the cent. Built in construction mode.

Published targets: zero unlisted differences from Beancount across ≥ 100k generated journals; 0 double-entry violations under properties + DST; append-only audit trail; reports reconcile; interview minutes published; zero spec YAML written by hand.

## SlopCodeBench (required before launch)
The same agent and model run SlopCodeBench raw and inside Trellis; checkpoint pass rate, erosion and verbosity
are published with configs and seeds (component 10). Launch does not happen until these results exist.

## Control experiment
One week: a skilled vibe coder builds Flagship B's core with a top agent and no Trellis. Both
builds are run against the same generated property suite and DST seeds; results published.
The framework must be able to run a spec's generated checks against an external codebase that
implements a thin `SpecProbe` adapter — keep that path working (component 05, item 3).
