import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { constitutionContract, parseContract } from "@trellis/core";
import { codeownersFor } from "@trellis/github";
import { jsonSchemaFiles } from "@trellis/schema";
import { Result } from "effect";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "../../..");

/** The repo's `schemas/` directory. */
export const schemasDir = join(root, "schemas");

/** A file `pnpm gen` owns: absolute path and exact text, or why it could not be derived. */
export type Derived = Result.Result<{ readonly path: string; readonly text: string }, string>;

const codeowners = (): Derived => {
  const file = join(root, ".trellis/constitution.yaml");
  const parsed = parseContract(constitutionContract, file, readFileSync(file, "utf8"));
  if (Result.isFailure(parsed)) {
    const { line, message, fix } = parsed.failure;
    return Result.fail(`${file}:${String(line)}: ${message}. ${fix}`);
  }
  return Result.succeed({ path: join(root, "CODEOWNERS"), text: codeownersFor(parsed.success) });
};

/** Every derived file: one JSON Schema per contract, and CODEOWNERS from the constitution. */
export const derivedFiles = (): ReadonlyArray<Derived> => [
  ...jsonSchemaFiles().map(({ file, text }) =>
    Result.succeed({ path: join(schemasDir, file), text }),
  ),
  codeowners(),
];
