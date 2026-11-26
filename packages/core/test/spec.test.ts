import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Result } from "effect";
import { describe, expect, it } from "vitest";
import { parseContract, specContract } from "../src/index.js";

const dir = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures/spec");
const files = (kind: string): ReadonlyArray<string> =>
  readdirSync(join(dir, kind))
    .filter((name) => name.endsWith(".yaml"))
    .sort();
const parse = (kind: string, name: string) =>
  parseContract(specContract, name, readFileSync(join(dir, kind, name), "utf8"));

describe("M1-03 valid spec fixtures load", () => {
  it("there are 10", () => {
    expect(files("valid")).toHaveLength(10);
  });
  for (const name of files("valid")) {
    it(`loads ${name}`, () => {
      const parsed = parse("valid", name);
      expect(Result.isSuccess(parsed) ? "ok" : parsed.failure).toBe("ok");
    });
  }
});

describe("M1-03 invalid spec fixtures fail with a located error", () => {
  it("there are 10", () => {
    expect(files("invalid")).toHaveLength(10);
  });
  for (const name of files("invalid")) {
    it(`rejects ${name}`, () => {
      const parsed = parse("invalid", name);
      expect(Result.isFailure(parsed)).toBe(true);
      if (Result.isFailure(parsed)) {
        const { _tag, file, line, column, path, message, fix } = parsed.failure;
        expect(line).toBeGreaterThan(0);
        expect(fix).not.toContain("\n");
        expect({ _tag, file, line, column, path, message, fix }).toMatchSnapshot();
      }
    });
  }
});
