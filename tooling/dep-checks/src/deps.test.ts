import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../..", import.meta.url));

const cruise = (fixture: string): { status: number | null; output: string } => {
  const result = spawnSync(
    join(root, "node_modules/.bin/depcruise"),
    ["-c", join(root, ".dependency-cruiser.cjs"), "-T", "err", "packages"],
    { cwd: join(root, "tooling/dep-checks/fixtures", fixture), encoding: "utf8" },
  );
  return { status: result.status, output: result.stdout + result.stderr };
};

describe("M0-03", () => {
  it("fixture PR importing cli from core fails", () => {
    const result = cruise("core-imports-cli");
    expect(result.status).toBe(1);
    expect(result.output).toContain("core-allowed-imports");
  });

  it("core importing schema passes", () => {
    expect(cruise("core-imports-schema").status).toBe(0);
  });

  it("analysis package importing gate fails", () => {
    const result = cruise("analysis-imports-gate");
    expect(result.status).toBe(1);
    expect(result.output).toContain("rules-allowed-imports");
  });

  it("live/ restriction enforced for node built-ins", () => {
    const result = cruise("builtin-outside-live");
    expect(result.status).toBe(1);
    expect(result.output).toContain("node-builtins-only-in-live");
  });

  it("node built-ins inside src/live/ pass", () => {
    expect(cruise("builtin-in-live").status).toBe(0);
  });
});
