import { Effect, Option } from "effect";
import { describe, expect, it } from "vitest";
import type { CodeHostShape, Label, Ruleset } from "../src/index.js";

/**
 * The CodeHost contract. The recorded fake and the live GitHub adapter both run this suite; the
 * live one against a scratch repo that has a `README.md` on its default branch.
 */
export const codeHostContract = (
  name: string,
  makeHost: () => CodeHostShape,
  options: { readonly appPermissions: boolean } = { appPermissions: true },
): void => {
  const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
  const ruleset: Ruleset = {
    name: "trellis-contract",
    enforcement: "active",
    branches: ["refs/heads/trellis-contract"],
    requiredChecks: ["trellis/gate", "trellis/policy"],
    requiredApprovals: 1,
    requireCodeOwnerReview: true,
    mergeQueue: false,
  };
  const label: Label = { name: "trellis-contract", color: "0e8a16", description: "contract test" };

  describe(`CodeHost contract: ${name}`, () => {
    it("upsertRuleset is idempotent and listRulesets returns what was written", async () => {
      const host = makeHost();
      await run(host.upsertRuleset({ ...ruleset, requiredApprovals: 2 }));
      expect(await run(host.upsertRuleset(ruleset))).toBe("updated");
      expect(await run(host.upsertRuleset(ruleset))).toBe("unchanged");
      const found = (await run(host.listRulesets())).filter((r) => r.name === ruleset.name);
      expect(found).toEqual([ruleset]);
    });

    it("upsertLabel is idempotent and listLabels returns what was written", async () => {
      const host = makeHost();
      await run(host.upsertLabel({ ...label, color: "b60205" }));
      expect(await run(host.upsertLabel(label))).toBe("updated");
      expect(await run(host.upsertLabel(label))).toBe("unchanged");
      const found = (await run(host.listLabels())).filter((l) => l.name === label.name);
      expect(found).toEqual([label]);
    });

    it("readFile returns the default branch's file, or none when missing", async () => {
      const host = makeHost();
      expect(Option.isSome(await run(host.readFile("README.md")))).toBe(true);
      expect(await run(host.readFile("trellis-contract/does-not-exist.txt"))).toEqual(
        Option.none(),
      );
    });

    it("writeFile commits a file once; writing the same text again changes nothing", async () => {
      const host = makeHost();
      const path = "trellis-contract/probe.txt";
      await run(host.writeFile(path, "before\n", "trellis contract: reset probe"));
      expect(await run(host.writeFile(path, "after\n", "trellis contract: probe"))).toBe("updated");
      expect(await run(host.writeFile(path, "after\n", "trellis contract: probe"))).toBe(
        "unchanged",
      );
      expect(await run(host.readFile(path))).toEqual(Option.some("after\n"));
    });

    if (options.appPermissions) {
      it("appPermissions reports an access level per permission", async () => {
        const permissions = await run(makeHost().appPermissions());
        expect(Object.keys(permissions).length).toBeGreaterThan(0);
        for (const access of Object.values(permissions)) {
          expect(["read", "write", "admin"]).toContain(access);
        }
      });
    }
  });
};
