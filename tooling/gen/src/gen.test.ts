import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative } from "node:path";
import { Result } from "effect";
import { describe, expect, it } from "vitest";
import { derivedFiles, schemasDir } from "./files.ts";

describe("generated files are committed and current (run pnpm gen if these fail)", () => {
  const derived = derivedFiles();
  const files = derived.flatMap((d) => (Result.isSuccess(d) ? [d.success] : []));
  const schemas = files.filter(({ path }) => path.startsWith(schemasDir));

  it("every derived file could be derived", () => {
    expect(derived.flatMap((d) => (Result.isFailure(d) ? [d.failure] : []))).toEqual([]);
  });

  it("M1-05: one JSON Schema per contract (11)", () => {
    expect(schemas).toHaveLength(11);
  });

  for (const { path, text } of files) {
    it(`${relative(`${schemasDir}/..`, path)} matches its source`, () => {
      expect(existsSync(path) ? readFileSync(path, "utf8") : "missing").toBe(text);
    });
  }

  it("schemas/ holds no stale schema files", () => {
    const wanted = schemas.map(({ path }) => relative(schemasDir, path)).sort();
    const present = readdirSync(schemasDir)
      .filter((name) => name.endsWith(".schema.json"))
      .sort();
    expect(present).toEqual(wanted);
  });
});
