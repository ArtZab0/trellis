# ADR-0001: Monorepo and tooling

Status: Accepted

## Decision
- One pnpm workspace monorepo, Turborepo for task orchestration and remote cache.
- Node.js active LTS, pinned via `.nvmrc` and the gate container image.
- TypeScript strict (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `useUnknownInCatchVariables`).
- Vitest for tests, Stryker for mutation testing.
- Properties: Effect's `Arbitrary` module for properties over values of a Schema (generators come from the
  Schema, checks included, so no contract is defined twice); fast-check for hand-written properties.
  Both run with fixed seeds.
- ESLint (flat config) with typescript-eslint for type-aware rules; oxlint for fast rules and the vendored anti-slop set (ADR-0015); ast-grep for structural rules; dependency-cruiser for package boundaries.
- Biome for formatting only.
- Changesets for versioning and publishing npm packages under `@trellis/*`.

## Why
Agents are strongest in mainstream TypeScript tooling, and every tool here runs deterministically with pinned versions.

## Amendments
- 2026-11-26: schema-derived properties use Effect's `Arbitrary` instead of fast-check. Effect 4
  (ADR-0002) no longer integrates with fast-check. Approved by the owner (M1-01).
