# @trellis/tooling-gen

`pnpm gen` regenerates derived files: one JSON Schema per contract in `schemas/` (from the Effect
Schemas in `@trellis/schema`), and the repo's `CODEOWNERS` (from `.trellis/constitution.yaml`).
Its test fails CI when a committed file is stale or missing; the fix is always `pnpm gen`, never a
hand edit.
