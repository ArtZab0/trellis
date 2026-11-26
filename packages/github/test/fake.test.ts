import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { recordedFake } from "../src/index.js";
import { codeHostContract } from "./contract.js";

const seeded = () =>
  recordedFake("acme/scratch", {
    files: { "README.md": "# scratch\n" },
    appPermissions: { contents: "write", checks: "write", administration: "read" },
  });

codeHostContract("recorded fake", () => seeded().host);

describe("recorded fake", () => {
  it("records only calls that changed something", async () => {
    const { host, calls } = seeded();
    const label = { name: "tier:0", color: "c2e0c6", description: "" };
    await Effect.runPromise(host.upsertLabel(label));
    await Effect.runPromise(host.upsertLabel(label));
    await Effect.runPromise(host.writeFile("README.md", "# scratch\n", "same"));
    expect(calls).toEqual([{ op: "upsertLabel", label }]);
  });
});
