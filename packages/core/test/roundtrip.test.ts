import { Arbitrary, Effect, Result } from "effect";
import { describe, expect, it } from "vitest";
import {
  baselineContract,
  type Contract,
  featureContract,
  ledgerEventContract,
  parseContract,
  printContract,
  ruleContract,
  taskContract,
} from "../src/index.js";

const SEED = 20261125;

const roundTrips = <A>(contract: Contract<A>): Promise<string> =>
  Effect.runPromise(
    Arbitrary.checkEffect(
      Arbitrary.schema(contract.schema),
      (value) => {
        const parsed = parseContract(contract, "generated.yaml", printContract(value));
        expect(Result.isSuccess(parsed) ? parsed.success : parsed.failure).toEqual(value);
        return true;
      },
      { runs: 1000, seed: SEED },
    ),
  ).then((result) => result._tag);

const contracts: ReadonlyArray<Contract<unknown>> = [
  featureContract,
  ruleContract,
  baselineContract,
  taskContract,
  ledgerEventContract,
];

describe("CORE-01 M1-02 contracts round-trip: parse(print(x)) equals x", () => {
  for (const contract of contracts) {
    it(`CORE-01 ${contract.name}, 1000 runs, fixed seed`, async () => {
      expect(await roundTrips(contract)).toBe("Passed");
    }, 60_000);
  }
});
