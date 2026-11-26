import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const read = (path: string): string => readFileSync(join(root, path), "utf8");

const owners = (codeowners: string): ReadonlyMap<string, ReadonlyArray<string>> =>
  new Map(
    codeowners
      .split("\n")
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length > 1 && !(parts[0] ?? "").startsWith("#"))
      .map((parts) => [parts[0] ?? "", parts.slice(1)]),
  );

const humans: ReadonlyArray<string> = ["@ArtZab0"];

describe("M0-05", () => {
  it.each(["/docs/CONTRACTS.md", "/docs/adr/", "/.trellis/", "/.github/"])(
    "contracts/ADRs/.trellis/.github owned by humans: %s",
    (path) => {
      const assigned = owners(read("CODEOWNERS")).get(path) ?? [];
      expect(assigned.length).toBeGreaterThan(0);
      expect(assigned.every((owner) => humans.includes(owner))).toBe(true);
    },
  );

  it("PR template present", () => {
    const template = read(".github/pull_request_template.md");
    for (const section of [
      "## Task",
      "## Acceptance criteria → verification",
      "## Test output",
      "## Evidence bundle",
    ]) {
      expect(template).toContain(section);
    }
  });
});
