import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Arbitrary, Effect, Result } from "effect";
import { describe, expect, it } from "vitest";
import {
  type Contract,
  configContract,
  constitutionContract,
  parseContract,
  printContract,
} from "../src/index.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixtures = join(here, "fixtures");
const read = (path: string): string => readFileSync(path, "utf8");
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

const contractFor = (name: string): Contract<unknown> =>
  name.startsWith("config") ? configContract : constitutionContract;

describe("CORE-01 every contract round-trips: parse(print(x)) equals x", () => {
  it("CORE-01 TrellisConfig, 1000 runs, fixed seed", async () => {
    expect(await roundTrips(configContract)).toBe("Passed");
  }, 60_000);

  it("CORE-01 Constitution, 1000 runs, fixed seed", async () => {
    expect(await roundTrips(constitutionContract)).toBe("Passed");
  }, 60_000);
});

describe("valid files load", () => {
  it("the example trellis.yaml loads", () => {
    const parsed = parseContract(
      configContract,
      "trellis.yaml",
      read(join(fixtures, "valid/trellis.yaml")),
    );
    expect(Result.isSuccess(parsed)).toBe(true);
    expect(Result.isSuccess(parsed) && parsed.success.mode).toBe("maintenance");
  });

  it("this repo's .trellis/constitution.yaml loads", () => {
    const file = join(here, "../../../.trellis/constitution.yaml");
    expect(Result.isSuccess(parseContract(constitutionContract, file, read(file)))).toBe(true);
  });
});

const invalid = readdirSync(join(fixtures, "invalid"))
  .filter((name) => /^(config|constitution)-\d\d-/.test(name))
  .sort();

describe("CORE-02 invalid files produce a LoadError with file, line and a one-line fix", () => {
  it("CORE-02 has 20 invalid fixtures", () => {
    expect(invalid).toHaveLength(20);
  });

  it.each(invalid)("CORE-02 %s", (name) => {
    const parsed = parseContract(contractFor(name), name, read(join(fixtures, "invalid", name)));
    expect(Result.isFailure(parsed)).toBe(true);
    if (Result.isFailure(parsed)) {
      const { _tag, file, line, column, path, message, fix } = parsed.failure;
      expect(file).toBe(name);
      expect(line).toBeGreaterThan(0);
      expect(fix).not.toBe("");
      expect(fix).not.toContain("\n");
      expect({ _tag, line, column, path, message, fix }).toMatchSnapshot();
    }
  });
});

describe("CORE-03 unknown version is rejected with an upgrade hint", () => {
  it("CORE-03 version 2", () => {
    const name = "config-version-2.yaml";
    const parsed = parseContract(configContract, name, read(join(fixtures, "invalid", name)));
    expect(Result.isFailure(parsed) && parsed.failure._tag).toBe("UnsupportedVersion");
    expect(Result.isFailure(parsed) && parsed.failure.fix).toMatch(
      /^Upgrade Trellis to a release that reads version 2/,
    );
    expect(Result.isFailure(parsed) && parsed.failure.line).toBe(1);
  });
});
