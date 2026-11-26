import { Effect, FileSystem } from "effect";
import { type LoadError, ReadFailed } from "./errors.js";
import { type Contract, parseContract } from "./parse.js";

/** Reads and parses a contract file through the `FileSystem` service. */
export const loadContract = <A>(
  contract: Contract<A>,
  file: string,
): Effect.Effect<A, LoadError, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const text = yield* fs.readFileString(file).pipe(
      Effect.mapError(
        (cause) =>
          new ReadFailed({
            file,
            line: 1,
            column: 1,
            path: "",
            message: cause.message,
            fix: "Check that the file exists and is readable.",
          }),
      ),
    );
    return yield* Effect.fromResult(parseContract(contract, file, text));
  });
