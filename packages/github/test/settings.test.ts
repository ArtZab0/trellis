import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Constitution, type Feature } from "@trellis/schema";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  applySettings,
  desiredSettings,
  findDrift,
  type RecordedFake,
  recordedFake,
  requiredAppPermissions,
} from "../src/index.js";

const repo = join(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const constitution = Schema.decodeUnknownSync(Constitution)(
  parse(readFileSync(join(repo, ".trellis/constitution.yaml"), "utf8")),
);
const feature = (area: string): Feature => ({
  version: 1,
  id: `${area}.x`,
  title: "x",
  area,
  tier: 1,
  owner: "@ArtZab0",
  entry: {},
  clauses: [],
  properties: [],
});
const want = desiredSettings(constitution, [
  feature("billing"),
  feature("auth"),
  feature("billing"),
]);
const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const fake = (permissions = requiredAppPermissions): RecordedFake =>
  recordedFake("acme/app", { appPermissions: permissions });
const kinds = async (f: RecordedFake) =>
  (await run(findDrift(f.host, want))).map((d) => `${d.kind}:${d.subject}`);

describe("desiredSettings", () => {
  it("one active ruleset on the default branch requiring trellis/gate and trellis/policy", () => {
    expect(want.ruleset).toMatchObject({
      enforcement: "active",
      branches: ["~DEFAULT_BRANCH"],
      requiredChecks: ["trellis/gate", "trellis/policy"],
      requireCodeOwnerReview: true,
    });
  });

  it("policy labels plus one area label per feature area, sorted and deduplicated", () => {
    expect(want.labels.map((l) => l.name)).toEqual([
      "tier:0",
      "tier:1",
      "tier:2",
      "tier:3",
      "constitution",
      "needs-human",
      "area:auth",
      "area:billing",
    ]);
  });
});

describe("findDrift", () => {
  it("an untouched repo drifts on the ruleset, every label and CODEOWNERS", async () => {
    expect(await kinds(fake())).toEqual([
      "ruleset:trellis",
      ...want.labels.map((l) => `label:${l.name}`),
      "codeowners:CODEOWNERS",
    ]);
  });

  it("names each required check a ruleset is missing", async () => {
    const f = fake();
    await run(applySettings(f.host, want));
    await run(f.host.upsertRuleset({ ...want.ruleset, requiredChecks: ["trellis/gate"] }));
    expect(await kinds(f)).toEqual(["required-check:trellis/policy"]);
  });

  it("flags a ruleset that differs otherwise, a recoloured label and a stale CODEOWNERS", async () => {
    const f = fake();
    await run(applySettings(f.host, want));
    await run(f.host.upsertRuleset({ ...want.ruleset, requiredApprovals: 0 }));
    await run(f.host.upsertLabel({ name: "tier:3", color: "000000", description: "x" }));
    await run(f.host.writeFile("CODEOWNERS", "* @someone\n", "hand edit"));
    expect(await kinds(f)).toEqual(["ruleset:trellis", "label:tier:3", "codeowners:CODEOWNERS"]);
  });

  it("reports missing or too-weak app permissions as drift a human must fix", async () => {
    const f = fake({ ...requiredAppPermissions, contents: "read", checks: "admin" });
    await run(applySettings(f.host, want));
    const drift = await run(findDrift(f.host, want));
    expect(drift).toEqual([
      {
        kind: "app-permissions",
        subject: "contents",
        detail: "needs write, has read",
        fixable: false,
      },
    ]);
  });
});

describe("CLI-03 applySettings", () => {
  it("fixes every fixable drift, and a second run changes nothing", async () => {
    const f = fake();
    const first = await run(applySettings(f.host, want));
    expect(first.length).toBe(want.labels.length + 2);
    const callsAfterFirst = f.calls.length;
    expect(await run(applySettings(f.host, want))).toEqual([]);
    expect(f.calls.length).toBe(callsAfterFirst);
    expect(await kinds(f)).toEqual([]);
  });
});
