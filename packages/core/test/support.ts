import { Arbitrary, Effect, Result } from "effect";
import { expect } from "vitest";
import { type Contract, parseContract, printContract } from "../src/index.js";

/** The fixed seed every property test in this package uses (ADR-0001). */
export const SEED = 20261125;

/** 1,000 runs at {@link SEED}. */
export const RUNS = { runs: 1000, seed: SEED };

/** Checks `property` over values generated from `contract`'s Schema; resolves to the run's tag. */
export const check = <A>(contract: Contract<A>, property: (value: A) => void): Promise<string> =>
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

/** CORE-01: `parse(print(x))` equals `x` for generated values of `contract`. */
export const roundTrips = <A>(contract: Contract<A>): Promise<string> =>
  check(contract, (value) => {
    const parsed = parseContract(contract, "generated.yaml", printContract(value));
    expect(Result.isSuccess(parsed) ? parsed.success : parsed.failure).toEqual(value);
  });
