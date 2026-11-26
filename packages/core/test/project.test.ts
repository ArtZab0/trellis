import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Effect, FileSystem, PlatformError } from "effect";
import { describe, expect, it } from "vitest";
import { loadProject } from "../src/index.js";

const projects = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures/projects");

const notFound = (method: string, path: string) =>
  PlatformError.systemError({
    _tag: "NotFound",
    module: "FileSystem",
    method,
    description: "File not found",
    pathOrDescriptor: path,
  });

/** The fixture tree on disk, read-only, behind the FileSystem service. */
const diskFs = FileSystem.makeNoop({
  exists: (path) => Effect.succeed(existsSync(path)),
  readFileString: (path) =>
    existsSync(path)
      ? Effect.succeed(readFileSync(path, "utf8"))
      : Effect.fail(notFound("readFileString", path)),
  readDirectory: (path, options) =>
    Effect.succeed(readdirSync(path, { recursive: options?.recursive ?? false, encoding: "utf8" })),
});

const load = (name: string) =>
  Effect.runPromise(
    loadProject(join(projects, name)).pipe(
      Effect.provideService(FileSystem.FileSystem, diskFs),
      Effect.result,
    ),
  );

describe("M1-06 loadProject on fixture repos", () => {
  it("full: returns a typed Project with every contract file", async () => {
    const result = await load("full");
    expect(result._tag).toBe("Success");
    if (result._tag === "Success") {
      const project = result.success;
      expect(project.config.project.name).toBe("trellis");
      expect(project.constitution.humans).toEqual(["@ArtZab0"]);
      expect(project.features.map((f) => f.id)).toEqual(["billing.invoice"]);
      expect(project.rules.map((r) => r.id)).toEqual(["no-throw"]);
      expect(project.baselines.map((b) => b.count)).toEqual([1]);
      expect(project.specs.map((s) => s.id)).toEqual(["ledger"]);
      expect(project.tasks.map((t) => t.id)).toEqual(["T-1"]);
    }
  });

  it("minimal: missing features/, rules/, spec/ and tasks/ count as empty", async () => {
    const result = await load("minimal");
    expect(result._tag === "Success" && result.success.features).toEqual([]);
  });

  it("broken: fails with every file's LoadError, in path order", async () => {
    const result = await load("broken");
    expect(result._tag).toBe("Failure");
    if (result._tag === "Failure") {
      const found = result.failure.errors.map((e) => [
        e._tag,
        e.file.slice(projects.length + 1),
        e.path,
      ]);
      expect(found).toEqual([
        ["InvalidContract", "broken/.trellis/constitution.yaml", "extra"],
        ["InvalidContract", "broken/features/a/bad-tier.yaml", "tier"],
        ["InvalidContract", "broken/rules/bad-rule/rule.yaml", "id"],
        ["InvalidContract", "broken/tasks/T-1.yaml", "mode"],
      ]);
    }
  });

  it("no-config: a missing .trellis/trellis.yaml is a ReadFailed with a fix", async () => {
    const result = await load("no-config");
    expect(result._tag === "Failure" && result.failure.errors.map((e) => e._tag)).toEqual([
      "ReadFailed",
    ]);
  });
});
