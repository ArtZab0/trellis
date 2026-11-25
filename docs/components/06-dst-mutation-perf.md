# Component: DST, machine checking, mutation, perf (M5)

## Deterministic simulation testing — `@trellis/dst`
- Provides simulated Effect layers: `Clock` (virtual time, advanced by the scheduler), `Random` (seeded), `FileSystem` (in-memory, with fault injection: crash before/after fsync, torn writes at byte granularity, ENOSPC, EIO, slow I/O), `Network` (in-process transport between simulated nodes: delay, drop, duplicate, reorder, partition), `Process` (crash and restart of a node, losing unsynced state).
- A **simulation** = `{ nodes: Layer[], workload: (rng) => Command stream, invariants: Expr[] (from spec) + custom checks, faults: FaultPlan, steps }`.
- Scheduler: a single-threaded deterministic event loop; every source of nondeterminism draws from the seed.
- On violation: emit seed, step, minimal shrunk command trace and a replay command `trellis dst replay --seed <s> --sim <name>`; the trace converts into a regression test automatically.
- The gate runs `gate.seeds.dst` for `bounds.dstStepsPerSeed` steps each; a nightly job runs fresh random seeds and files failures as ledger events.

## Machine checker
- Input: spec machines + implementation transition tables (extracted from XState-compatible definition objects).
- Checks: declared table ≡ implemented table; reachability; dead states; terminal correctness; timeout transitions; guards referencing defined fields; bounded exploration (depth `bounds.machineDepth`) of composed machines that share entities, checking invariants at each state.
- Output: counterexample paths as command sequences, convertible to scenario tests.

## Mutation — Stryker integration
- Fixed seed and fixed mutator set; incremental on changed files in PRs, full nightly.
- Thresholds per package from config; the score is part of the certificate. A drop > 5 points on touched files fails the stage.

## Perf — instruction-count harness
- Benchmarks declared by spec budgets (`unit: instructions | bytes | count`) run inside the pinned image under `perf stat -e instructions:u` (Linux) with JIT warm-up runs discarded; allocations via V8 heap stats.
- Pass if median of 5 runs ≤ budget × (1 + tolerance), tolerance default 2%. Wall-clock is recorded but not gating.

## Differential harness (ADR-0012)
- `@trellis/dst` hosts the shared machinery: generator API (`Generator<A> = { gen(rng): A; shrink(a): A[]; plantedBugs: PlantedBug[] }`), reference adapters by protocol (`s3`, `http`, `cli`, `file-format`), output normalizers (ignore ids/timestamps per the allowlist), and the comparison runner used by the `differential` gate stage.
- Generators can also feed DST workloads, so the same request streams drive both simulation and differential runs.

## Acceptance criteria
- **DIFF-H-01** Same seed → same input stream and same comparison report (hash compared across 5 runs).
- **DIFF-H-02** Shrinking reduces a failing 1,000-request stream to ≤ 10 requests on the toy store's planted divergence.
- **DST-01** A sample key-value service with a planted lost-update race: found within the configured seeds; replay reproduces it byte-for-byte.
- **DST-02** Torn-write fault: a sample log without checksums is caught; with checksums it passes 1M steps.
- **DST-03** Two runs with the same seed produce identical event logs (hash compared).
- **DST-04** A code path calling real `Date.now` under simulation fails lint (stack rule) and, if forced, fails the run with `NondeterminismError`.
- **MACH-01** Planted dead state and unreachable state are reported; implementation/table mismatch is reported with the differing transitions.
- **MUT-01** Removing assertions from a test file lowers the reported score and fails the stage.
- **PERF-01** A budgeted function's instruction count varies ≤ 1% across 10 runs in the image; a planted O(n²) regression fails.
