import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { Effect, FileSystem, PlatformError } from "effect";

const attempt = <A>(method: string, path: string, run: () => A) =>
  Effect.try({
    try: run,
    catch: (cause) =>
      PlatformError.systemError({
        _tag: "Unknown",
        module: "FileSystem",
        method,
        description: cause instanceof Error ? cause.message : String(cause),
        pathOrDescriptor: path,
      }),
  });

/** The real disk, for the operations the CLI uses. */
export const nodeFileSystem = FileSystem.makeNoop({
  exists: (path) => attempt("exists", path, () => existsSync(path)),
  readFileString: (path) => attempt("readFileString", path, () => readFileSync(path, "utf8")),
  writeFileString: (path, data) =>
    attempt("writeFileString", path, () => {
      writeFileSync(path, data);
    }),
  makeDirectory: (path, options) =>
    attempt("makeDirectory", path, () => {
      mkdirSync(path, { recursive: options?.recursive ?? false });
    }),
  readDirectory: (path, options) =>
    attempt("readDirectory", path, () =>
      readdirSync(path, { recursive: options?.recursive ?? false, encoding: "utf8" }),
    ),
});
