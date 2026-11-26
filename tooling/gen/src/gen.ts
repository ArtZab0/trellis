import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { derivedFiles, schemasDir } from "./files.ts";

const files = derivedFiles();
mkdirSync(schemasDir, { recursive: true });
const wanted = new Set(files.map(({ path }) => basename(path)));
for (const name of readdirSync(schemasDir)) {
  if (name.endsWith(".schema.json") && !wanted.has(name)) rmSync(join(schemasDir, name));
}
for (const { path, text } of files) writeFileSync(path, text);
process.stdout.write(`pnpm gen: wrote ${String(files.length)} files to schemas/\n`);
