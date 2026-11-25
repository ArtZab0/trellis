# ADR-0002: Certified stack v1 is TypeScript + Effect, and Trellis dogfoods it

Status: Accepted

## Decision
The first certified stack (`stack-ts-v1`) is:
- TypeScript strict + Trellis subset rules: no `any`, `as` (except `as const`), non-null `!`, `throw`,
  `null` in domain types, class inheritance, `let` mutation outside designated store modules,
  default exports, enums (use string literal unions), barrel re-exports of `live/`.
- **Effect** for all effects, typed errors (`Data.TaggedError`) and dependency injection (Layers).
  Real I/O is allowed only in `src/live/**`. Clock, Random, FileSystem, Http, Process, Db are services.
- Effect Schema at every boundary (HTTP, files, env, DB rows, queue messages).
- State with a lifecycle is a declared machine (XState-compatible definition object) and is checked.
- UI: React, no `useEffect`/`useLayoutEffect` in product code (allowed only in `packs/stack-ts-v1/framework`),
  state from stores and machines only, components only from the Trellis UI kit.
- Persistence: PostgreSQL via a typed query layer; migrations declarative, expand/contract only.

Trellis itself is written in this stack. Its own `.trellis/constitution.yaml` enforces it from M2.

## Why
Effect's typed errors and layers are what make "no crash paths" checkable by the compiler and let the
same code run under production, test and deterministic simulation unchanged.

## Consequences
- Contributors must learn Effect; the stack pack ships examples and agent skills for it.
- A Rust stack (`stack-rs-v1`) is future work if performance demands it (e.g. flagship A throughput).
