import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { describe, expect, it } from "vitest";
import { derivedFiles, schemasDir } from "./files.ts";

describe("M1-05 generated files are committed and current", () => {
  const files = derivedFiles();

  it("one JSON Schema per contract (11)", () => {
    expect(files).toHaveLength(11);
  });

  for (const { path, text } of files) {
    it(`schemas/${basename(path)} matches the Effect Schema (run pnpm gen if this fails)`, () => {
      expect(existsSync(path) ? readFileSync(path, "utf8") : "missing").toBe(text);
    });
  }

  it("schemas/ holds no stale schema files (run pnpm gen if this fails)", () => {
    const wanted = files.map(({ path }) => basename(path)).sort();
    const present = readdirSync(schemasDir)
      .filter((name) => name.endsWith(".schema.json"))
      .sort();
    expect(present).toEqual(wanted);
  });
});
