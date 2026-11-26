import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Constitution } from "@trellis/schema";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { codeownersFor, generatedHeader } from "../src/index.js";

const repo = join(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const constitution = Schema.decodeUnknownSync(Constitution)(
  parse(readFileSync(join(repo, ".trellis/constitution.yaml"), "utf8")),
);

describe("CODEOWNERS generated from the constitution", () => {
  const text = codeownersFor(constitution);
  const lines = text.trimEnd().split("\n");

  it("starts with the generated header, then the catch-all owned by the humans", () => {
    expect(lines[0]).toBe(generatedHeader);
    expect(lines[1]).toBe("* @ArtZab0");
  });

  it("names the humans on every tier 3 and tier 2 path, after the catch-all", () => {
    const globs = [...constitution.paths.tier3, ...constitution.paths.tier2];
    expect(lines.slice(2)).toHaveLength(globs.length);
    expect(lines.slice(2).every((line) => line.endsWith(" @ArtZab0"))).toBe(true);
  });

  it("roots patterns and turns dir/** into dir/", () => {
    expect(lines).toContain("/.trellis/ @ArtZab0");
    expect(lines).toContain("/docs/CONTRACTS.md @ArtZab0");
    expect(lines).toContain("/packages/*/package.json @ArtZab0");
  });

  it("covers every path the hand-written CODEOWNERS protects today (ADR-0008)", () => {
    const today = readFileSync(join(repo, "CODEOWNERS"), "utf8").trimEnd().split("\n");
    for (const line of today) expect(lines).toContain(line);
  });

  it("is deterministic and ends with a newline", () => {
    expect(codeownersFor(constitution)).toBe(text);
    expect(text.endsWith("\n")).toBe(true);
  });
});
