import { describe, expect, it } from "vitest";
import {
  baselineContract,
  type Contract,
  featureContract,
  ledgerEventContract,
  ruleContract,
  specContract,
  taskContract,
} from "../src/index.js";

import { roundTrips } from "./support.js";

const contracts: ReadonlyArray<Contract<unknown>> = [
  featureContract,
  ruleContract,
  specContract,
  baselineContract,
  taskContract,
  ledgerEventContract,
  specContract,
];

describe("CORE-01 M1-02 and M1-03 contracts round-trip: parse(print(x)) equals x", () => {
  for (const contract of contracts) {
    it(`CORE-01 ${contract.name}, 1000 runs, fixed seed`, async () => {
      expect(await roundTrips(contract)).toBe("Passed");
    }, 60_000);
  }
});
