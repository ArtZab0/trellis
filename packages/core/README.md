# @trellis/core

Loads contract files and returns typed values or a `LoadError` that says where the problem is and
how to fix it.

```ts
import { Effect, Result } from "effect";
import { constitutionContract, loadContract, parseContract } from "@trellis/core";

// Pure: text in, Result out.
const parsed = parseContract(constitutionContract, ".trellis/constitution.yaml", text);
// Failure: { file, line, column, path: "humans[0]", message, fix }

// Through the FileSystem service (real, in-memory or simulated).
const program = loadContract(constitutionContract, ".trellis/constitution.yaml");
```

`LoadError` is one of `ReadFailed`, `InvalidYaml`, `InvalidContract`, `UnsupportedVersion`, each
with `{ file, line, column, path, message, fix }`. Lines and columns are 1-based.
`printContract(value)` writes YAML that `parseContract` reads back unchanged (CORE-01).
