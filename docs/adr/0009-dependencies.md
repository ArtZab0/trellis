# ADR-0009: Dependency allowlist for the Trellis repo

Status: Accepted (additions need a human-approved PR)

Runtime: `effect`, `@effect/platform`, `@effect/platform-node`, `@effect/schema` (or the schema module of `effect` if merged), `@effect/sql`, `@effect/sql-pg`, `yaml`, `z3-solver`, `@octokit/*`, `@sigstore/*`, `playwright`, `rrweb`, `rrweb-player`, `odiff-bin`, `pixelmatch`, `pngjs`, `minimatch`, `ulid`, `react`, `react-dom`, `xstate`, `@aws-sdk/client-s3`.

Dev/tooling: `typescript`, `@types/node` (major version matches the pinned Node LTS), `vitest`, `fast-check`, `@fast-check/vitest`, `@stryker-mutator/*`, `eslint`, `typescript-eslint`, `@ast-grep/napi`, `dependency-cruiser`, `@biomejs/biome`, `turbo`, `@changesets/cli`, `vite`, `jscpd`, `semgrep` (binary, in image).

Added by ADR-0012/0015: `oxlint`; vendored `dmmulroy/anti-slop` (pinned commit, license confirmed by a human first); container images (pinned by digest, used only inside sandboxes): Ceph RADOS Gateway, Beancount.

Anything else: open an issue labelled `needs-human` with the package name, purpose, weekly downloads, age, maintainers, license and install scripts.
