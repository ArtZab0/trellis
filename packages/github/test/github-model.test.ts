import { Arbitrary, Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { fromGitHub, Ruleset, toGitHub } from "../src/index.js";
import { GitHubRuleset } from "../src/codehost/github-model.js";

describe("GitHub ruleset mapping", () => {
  it("fromGitHub(toGitHub(r)) equals r, 1000 runs, fixed seed", async () => {
    const outcome = await Effect.runPromise(
      Arbitrary.checkEffect(
        Arbitrary.schema(Ruleset),
        (ruleset) => {
          const github = Schema.decodeUnknownSync(GitHubRuleset)({ id: 1, ...toGitHub(ruleset) });
          expect(fromGitHub(github)).toEqual(ruleset);
          return true;
        },
        { runs: 1000, seed: 20261125 },
      ),
    );
    expect(outcome._tag).toBe("Passed");
  });

  it("only adds a merge_queue rule when mergeQueue is on", () => {
    const base: Ruleset = {
      name: "main",
      enforcement: "active",
      branches: ["~DEFAULT_BRANCH"],
      requiredChecks: ["trellis/gate"],
      requiredApprovals: 1,
      requireCodeOwnerReview: true,
      mergeQueue: false,
    };
    const types = (r: Ruleset) => toGitHub(r).rules.map((rule) => rule.type);
    expect(types(base)).toEqual(["pull_request", "required_status_checks"]);
    expect(types({ ...base, mergeQueue: true })).toContain("merge_queue");
  });
});
