# @trellis/tooling-dep-checks

Tests that prove the package dependency rules in `.dependency-cruiser.cjs` fire. Each folder in
`fixtures/` is a small repo; the test runs dependency-cruiser on it with the root config.
