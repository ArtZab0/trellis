# ADR-0015: Vendor existing anti-slop rules; add an oxlint engine

Status: Accepted (license check pending, see below)

## Decision
- Add an `oxlint` engine adapter to `packages/rules` alongside ESLint.
- Vendor Dillon Mulroy's anti-slop rule set (github.com/dmmulroy/anti-slop, designed to be vendored) into `packages/stack-ts/vendor/anti-slop/`, pinned to a commit hash, and wrap each rule as a Trellis rule package with fixtures.
- Port the code-quality rules published with SlopCodeBench that apply to TypeScript, as Trellis rule packages.
- Trellis's own stack rules sit on top; where rules overlap, keep the stricter one and record the choice.
- Before vendoring anything: a human confirms the license is compatible with ADR-0010 and records it in `packages/stack-ts/vendor/LICENSES.md`.

## Why
The community has already catalogued many agent failure patterns. Reusing them is faster and gives users familiar rules; oxlint is fast enough to run on every save in the inner loop.
