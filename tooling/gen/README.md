# @trellis/tooling-gen

`pnpm gen` regenerates derived files: today, one JSON Schema per contract in `schemas/`, made
from the Effect Schemas in `@trellis/schema`. Its test fails CI when a committed file is stale or
missing; the fix is always `pnpm gen`, never a hand edit.
