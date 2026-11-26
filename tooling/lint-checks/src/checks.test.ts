import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const fixtures = join(root, "tooling/lint-checks/fixtures");

const run = (
  bin: string,
  args: ReadonlyArray<string>,
): { status: number | null; output: string } => {
  const result = spawnSync(join(root, "node_modules/.bin", bin), args, {
    cwd: root,
    encoding: "utf8",
  });
  return { status: result.status, output: result.stdout + result.stderr };
};

const biomeFormat = (name: string): { status: number | null; output: string } => {
  const dir = mkdtempSync(join(tmpdir(), "trellis-biome-"));
  copyFileSync(join(fixtures, name), join(dir, name));
  return run("biome", ["format", `--config-path=${join(root, "biome.json")}`, join(dir, name)]);
};

describe("M0-02", () => {
  it("lint fails on a file that uses any", () => {
    const result = run("eslint", ["--no-ignore", join(fixtures, "uses-any.ts")]);
    expect(result.status).toBe(1);
    expect(result.output).toContain("@typescript-eslint/no-explicit-any");
  });

  it("formatting check fails on unformatted file", () => {
    const result = biomeFormat("unformatted.ts");
    expect(result.status).toBe(1);
    expect(result.output).toContain("Formatter would have printed");
  });

  it("formatting check passes on a formatted file", () => {
    expect(biomeFormat("formatted.ts").status).toBe(0);
  });
});
