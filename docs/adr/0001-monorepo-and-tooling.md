# ADR-0001: Monorepo and tooling

Status: Accepted

## Decision
- One pnpm workspace monorepo, Turborepo for task orchestration and remote cache.
- Node.js active LTS, pinned via `.nvmrc` and the gate container image.
- TypeScript strict (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `useUnknownInCatchVariables`).
- Vitest for tests, fast-check for properties, Stryker for mutation testing.
- ESLint (flat config) with typescript-eslint for type-aware rules; oxlint for fast rules and the vendored anti-slop set (ADR-0015); ast-grep for structural rules; dependency-cruiser for package boundaries.
- Biome for formatting only.
- Changesets for versioning and publishing npm packages under `@trellis/*`.

## Why
Agents are strongest in mainstream TypeScript tooling, and every tool here runs deterministically with pinned versions.
