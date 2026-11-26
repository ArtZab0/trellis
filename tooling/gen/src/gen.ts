import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { Result } from "effect";
import { derivedFiles, schemasDir } from "./files.ts";

const derived = derivedFiles();
const problems = derived.flatMap((d) => (Result.isFailure(d) ? [d.failure] : []));
if (problems.length > 0) {
  process.stderr.write(`pnpm gen: nothing written.\n${problems.join("\n")}\n`);
  process.exit(2);
}
const files = derived.flatMap((d) => (Result.isSuccess(d) ? [d.success] : []));
mkdirSync(schemasDir, { recursive: true });
const wanted = new Set(files.map(({ path }) => basename(path)));
for (const name of readdirSync(schemasDir)) {
  if (name.endsWith(".schema.json") && !wanted.has(name)) rmSync(join(schemasDir, name));
}
for (const { path, text } of files) writeFileSync(path, text);
process.stdout.write(`pnpm gen: wrote ${String(files.length)} files\n`);
