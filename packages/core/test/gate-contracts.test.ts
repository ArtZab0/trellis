import { type Canonicalizable, canonicalJson, reproHash } from "@trellis/schema";
import { Arbitrary, Effect, Result } from "effect";
import { describe, expect, it } from "vitest";
import {
  type Contract,
  certificateContract,
  evidenceContract,
  gateReportContract,
  parseContract,
  printContract,
} from "../src/index.js";

const SEED = 20261125;
const RUNS = { runs: 1000, seed: SEED };

const check = <A>(contract: Contract<A>, property: (value: A) => void): Promise<string> =>
  Effect.runPromise(
    Arbitrary.checkEffect(
      Arbitrary.schema(contract.schema),
      (value) => {
        property(value);
        return true;
      },
      RUNS,
    ),
  ).then((result) => result._tag);

const reversedKeys = (value: Canonicalizable): Canonicalizable => {
  if (Array.isArray(value)) return value.map(reversedKeys);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .reverse()
      .flatMap(([key, item]) => (item === undefined ? [] : [[key, reversedKeys(item)]])),
  );
};

const contracts: ReadonlyArray<Contract<unknown>> = [
  evidenceContract,
  certificateContract,
  gateReportContract,
];

describe("CORE-01 M1-04 contracts round-trip: parse(print(x)) equals x", () => {
  for (const contract of contracts) {
    it(`CORE-01 ${contract.name}, 1000 runs, fixed seed`, async () => {
      const property = (value: unknown): void => {
        const parsed = parseContract(contract, "generated.json", printContract(value));
        expect(Result.isSuccess(parsed) ? parsed.success : parsed.failure).toEqual(value);
      };
      expect(await check(contract, property)).toBe("Passed");
    }, 60_000);
  }
});

describe("M1-04 canonical JSON is key-sorted and stable", () => {
  it("sorts keys at every depth and drops whitespace", () => {
    expect(canonicalJson({ b: 1, a: { d: [3, { f: true, e: null }], c: "x" } })).toBe(
      '{"a":{"c":"x","d":[3,{"e":null,"f":true}]},"b":1}',
    );
  });

  it("prints -0 as 0", () => {
    expect(canonicalJson({ a: -0 })).toBe('{"a":0}');
  });

  it("is independent of key order and re-canonicalizes to itself, 1000 runs", async () => {
    const property = (value: typeof certificateContract.schema.Type): void => {
      const text = canonicalJson(value);
      expect(canonicalJson(reversedKeys(value))).toBe(text);
      const back = parseContract(certificateContract, "canonical.json", text);
      expect(Result.isSuccess(back) ? canonicalJson(back.success) : back.failure).toBe(text);
    };
    expect(await check(certificateContract, property)).toBe("Passed");
  }, 60_000);
});

describe("M1-04 reproHash excludes issuedAt and signatures", () => {
  it("ignores issuedAt and reproHash, and changes when anything else changes, 1000 runs", async () => {
    const property = (cert: typeof certificateContract.schema.Type): void => {
      const hash = reproHash(cert);
      expect(reproHash({ ...cert, issuedAt: `${cert.issuedAt}x`, reproHash: hash })).toBe(hash);
      expect(
        reproHash({ ...cert, subject: { ...cert.subject, repo: `${cert.subject.repo}x` } }),
      ).not.toBe(hash);
    };
    expect(await check(certificateContract, property)).toBe("Passed");
  }, 60_000);
});
