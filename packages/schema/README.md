# @trellis/schema

Contracts from `docs/CONTRACTS.md` as Effect Schema definitions. Depends on no internal package.

| Export | Contract |
|---|---|
| `TrellisConfig` | `.trellis/trellis.yaml` (§1) |
| `Constitution` | `.trellis/constitution.yaml` (§2) |
| `Text`, `Glob`, `Count`, `PositiveCount`, `NonNegative`, `Ratio`, `SemVer`, `PinnedImage` | Shared field types |

```ts
import { Schema } from "effect";
import { Constitution } from "@trellis/schema";

const constitution = Schema.decodeUnknownSync(Constitution)(input);
constitution.humans; // ReadonlyArray<string>
```
