import { Effect, FileSystem, PlatformError } from "effect";

const notFound = (method: string, path: string) =>
  PlatformError.systemError({
    _tag: "NotFound",
    module: "FileSystem",
    method,
    description: "No such file",
    pathOrDescriptor: path,
  });

/** An in-memory file tree: files map path to text; a directory exists if anything is under it. */
export const memoryFs = (files: Map<string, string>): FileSystem.FileSystem => {
  const dirs = new Set<string>();
  const isDir = (path: string): boolean =>
    dirs.has(path) || [...files.keys()].some((file) => file.startsWith(`${path}/`));
  return FileSystem.makeNoop({
    exists: (path) => Effect.succeed(files.has(path) || isDir(path)),
    readFileString: (path) => {
      const text = files.get(path);
      return text === undefined
        ? Effect.fail(notFound("readFileString", path))
        : Effect.succeed(text);
    },
    writeFileString: (path, data) =>
      Effect.sync(() => {
        files.set(path, data);
      }),
    makeDirectory: (path) =>
      Effect.sync(() => {
        dirs.add(path);
      }),
    readDirectory: (path) =>
      Effect.succeed(
        [...files.keys()]
          .filter((file) => file.startsWith(`${path}/`))
          .map((file) => file.slice(path.length + 1)),
      ),
  });
};
