import type { Constitution, Feature } from "@trellis/schema";
import { Arbitrary, Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { tierOf } from "../src/index.js";
import { RUNS } from "./support.js";

const base: Constitution = {
  version: 1,
  humans: ["@ArtZab0"],
  paths: {
    tier3: [".github/**", "docs/adr/**"],
    tier2: ["packages/schema/**"],
    tier0: ["docs/**"],
  },
  trust: {
    earn: { consecutiveCleanMerges: 20, minMutationScore: 0.7, require: ["driver"] },
    demoteOn: ["revert"],
  },
  automerge: { tier0: false, tier1: false },
  breaker: { revertRate7d: 0.1, escapedPer100: 1, changeFailureRate: 0.1, costSpikeMultiple: 3 },
  dependencies: { allow: [], requireTier: 2 },
  uncertifiedZones: [],
  trends: {
    baselineCommits: 20,
    erosionMaxIncrease: 0,
    verbosityMaxIncrease: 0,
    linesPerClauseMax: 40,
    buildSecondsMax: 300,
  },
  prototypes: { globs: [], defaultExpiryDays: 14, flagRequired: true },
  markdown: { agentWritableGlobs: [], maxBytesPerFile: 8000 },
};

const feature = (tier: 0 | 1 | 2 | 3, code: ReadonlyArray<string>): Feature => ({
  version: 1,
  id: `f${String(tier)}`,
  title: "t",
  area: "a",
  tier,
  owner: "@ArtZab0",
  entry: {},
  clauses: [],
  properties: [],
  touches: { code, data: [] },
});

describe("CORE-04 tierOf", () => {
  it("no paths is tier 0", () => {
    expect(tierOf([], base, [])).toBe(0);
  });

  it("uses tier3, then tier2, then tier0 globs; anything else is 1", () => {
    expect(tierOf(["docs/adr/0001.md"], base, [])).toBe(3);
    expect(tierOf(["packages/schema/src/a.ts"], base, [])).toBe(2);
    expect(tierOf(["docs/plans/x.md"], base, [])).toBe(0);
    expect(tierOf(["src/a.ts"], base, [])).toBe(1);
  });

  it("is the max over path tiers and the tiers of features touching the paths", () => {
    const features = [feature(3, ["src/billing/**"]), feature(2, ["docs/**"])];
    expect(tierOf(["src/billing/total.ts"], base, features)).toBe(3);
    expect(tierOf(["docs/plans/x.md"], base, features)).toBe(2);
    expect(tierOf(["src/other.ts"], base, features)).toBe(1);
    expect(tierOf(["src/other.ts", "docs/adr/1.md"], base, features)).toBe(3);
  });

  it("property: adding a path never lowers the tier, 1000 runs, fixed seed", async () => {
    const Path = Schema.Literals([
      "src/a.ts",
      "src/billing/total.ts",
      "docs/plans/x.md",
      "docs/adr/1.md",
      ".github/ci.yml",
      "packages/schema/src/a.ts",
    ]);
    const Glob = Schema.Literals(["src/**", "src/billing/**", "docs/**", "**/*.ts", ".github/**"]);
    const Input = Schema.Struct({
      paths: Schema.Array(Path),
      extra: Path,
      features: Schema.Array(
        Schema.Struct({ tier: Schema.Literals([0, 1, 2, 3]), code: Schema.Array(Glob) }),
      ),
    });
    const outcome = await Effect.runPromise(
      Arbitrary.checkEffect(
        Arbitrary.schema(Input),
        ({ paths, extra, features }) => {
          const fs = features.map(({ tier, code }) => feature(tier, code));
          expect(tierOf([...paths, extra], base, fs)).toBeGreaterThanOrEqual(
            tierOf(paths, base, fs),
          );
          return true;
        },
        RUNS,
      ),
    );
    expect(outcome._tag).toBe("Passed");
  }, 60_000);
});
