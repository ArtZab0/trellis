# Component: feature map, drivers, replay recording, diffs, evidence (M6)

## Feature map — `@trellis/features`
- Loader/validator for CONTRACTS §4; checks unique ids, driver/property resolution, clause ids exist in the spec, every app route is claimed (route list provided by the stack pack's router introspection).
- **Impact mapper**: changed files → feature ids, from (a) static import graph reverse-reachability to feature entry modules and (b) per-driver runtime coverage recorded on `main`. Output lists `named` (from task) vs `impacted`.

## Drivers — `@trellis/drive`
- `defineDriver({ feature, steps: Step[] })` where each step is `{ id, title, action: Effect<void, DriverError, Page | Http | Pty> }`. Steps are named; the recorder snapshots after each.
- Runtimes: Playwright over CDP (web, Electron), HTTP/gRPC client, PTY (CLI). Mobile (Maestro) is post-launch.
- `trellis drive <feature> [--at <sha>] [--record] [--viewport desktop,mobile] [--theme light,dark] [--seed N]`.

## Recorder
Per run: video, screenshot per step, accessibility-tree snapshot per step, rrweb recording, Playwright trace, console + network log, perf profile, OTel spans/logs from the app (collector in the sandbox), machine transition log if exposed via `SpecProbe`. All stored content-addressed.

## Base-vs-head runner
- Builds base and head in identical sandboxes (same image digest, seed data, frozen clock start, record/replay HTTP fakes, egress denied).
- Runs every impacted feature's driver on both. Diffs:
  - **visual**: per step/viewport/theme with odiff; agent may declare expected-change regions in the PR (`.trellis/expected-diffs.yaml`), anything outside is "unexpected";
  - **structural**: accessibility-tree diff (role, name, state);
  - **behavioral**: requests (method, path, status, body schema), console errors, machine transitions, analytics events;
  - **perf**: per-step metrics vs budget and vs 30-day baseline on `main`.
- Unexpected diff in a feature not named by the task → tier raised to 2 with reason `unexpected-impact:<feature>`.
- `verify-runs` gate stage: fails on any failed property, console error, failed request, a11y violation (axe), or unexpected diff not acknowledged by a human.

Note: browser rendering can be slightly nondeterministic. Mitigations: pinned browser build, fonts bundled in image, animations disabled, fixed device scale factor, and a tolerance per diff kind recorded in the certificate bounds.

## Evidence — `@trellis/evidence`
- Builds CONTRACTS §8 bundles; uploads artifacts via an `ArtifactStore` service (S3 adapter); attaches the bundle digest + link to the `trellis/gate` check.

## Acceptance criteria
- **FEAT-01** Validator catches unclaimed routes, dangling driver paths, unknown clause ids (fixtures).
- **FEAT-02** Impact mapper on the example app: editing a shared util maps to exactly the features whose drivers execute it.
- **DRV-01** `trellis drive` produces all artifact kinds for the example app's 5 features from a clean machine.
- **DIFF-01** CSS change in feature A → expected visual diff in A only; planted change bleeding into feature B → tier 2 with `unexpected-impact:B`.
- **DIFF-02** Running base-vs-head on an unchanged commit pair yields zero diffs across 10 repetitions (determinism of the replay setup).
- **EVD-01** Bundle validates against the schema; every digest resolves in the store.
