import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const dir = join(root, ".github/workflows");
const workflows = readdirSync(dir)
  .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
  .map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") }));

describe("M0-04", () => {
  it("a workflow runs pnpm verify", () => {
    expect(workflows.some((w) => /^\s*- run: pnpm verify\s*$/m.test(w.text))).toBe(true);
  });

  it.each(workflows)("actions pinned by SHA: $name", ({ text }) => {
    const uses = [...text.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1] ?? "");
    expect(uses.length).toBeGreaterThan(0);
    for (const ref of uses) {
      expect(ref).toMatch(/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/);
    }
  });

  it.each(workflows)("permissions read-all by default: $name", ({ text }) => {
    expect(text).toMatch(/^permissions: read-all$/m);
  });
});
