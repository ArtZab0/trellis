import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { jsonSchemaFiles } from "@trellis/schema";

/** The repo's `schemas/` directory. */
export const schemasDir = join(fileURLToPath(new URL(".", import.meta.url)), "../../../schemas");

/** Every derived file `pnpm gen` owns, as absolute path and exact text. */
export const derivedFiles = (): ReadonlyArray<{ readonly path: string; readonly text: string }> =>
  jsonSchemaFiles().map(({ file, text }) => ({ path: join(schemasDir, file), text }));
