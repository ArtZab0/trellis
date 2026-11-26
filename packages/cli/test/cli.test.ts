import { loadProject } from "@trellis/core";
import { codeownersFor, generatedHeader } from "@trellis/github";
import { Effect, FileSystem } from "effect";
import { describe, expect, it } from "vitest";
import { commands, type Output, runCli } from "../src/index.js";
import { memoryFs } from "./memory-fs.js";

const root = "/work/acme";

const run = (files: Map<string, string>, argv: ReadonlyArray<string>): Promise<Output> =>
  Effect.runPromise(
    runCli(commands, argv, { cwd: root }).pipe(
      Effect.provideService(FileSystem.FileSystem, memoryFs(files)),
    ),
  );

const expected = [
  ".trellis/trellis.yaml",
  ".trellis/constitution.yaml",
  "AGENTS.md",
  "ARCHITECTURE.md",
  "spec/story.md",
  "features/.gitkeep",
  "rules/.gitkeep",
  "verify/.gitkeep",
  "docs/adr/.gitkeep",
  "docs/plans/active/.gitkeep",
  "docs/plans/done/.gitkeep",
  "CODEOWNERS",
];

describe("CLI-01 trellis init", () => {
  it("creates every listed file and folder in an empty repo", async () => {
    const files = new Map<string, string>();
    const out = await run(files, ["init", "--yes", "--owner", "@acme/core", "--repo", "acme/acme"]);
    expect(out.exitCode).toBe(0);
    expect([...files.keys()].map((f) => f.slice(root.length + 1)).sort()).toEqual(
      [...expected].sort(),
    );
  });

  it("writes a project that loadProject reads, and CODEOWNERS generated from its constitution", async () => {
    const files = new Map<string, string>();
    await run(files, ["init", "--owner", "@acme/core", "--repo", "acme/acme"]);
    const project = await Effect.runPromise(
      loadProject(root).pipe(Effect.provideService(FileSystem.FileSystem, memoryFs(files))),
    );
    expect(project.config.project).toEqual({ name: "acme", repo: "acme/acme" });
    expect(files.get(`${root}/CODEOWNERS`)).toBe(codeownersFor(project.constitution));
    expect(files.get(`${root}/CODEOWNERS`)).toContain("/.trellis/ @acme/core");
  });

  it("is idempotent: a second run changes nothing and says so", async () => {
    const files = new Map<string, string>();
    await run(files, ["init"]);
    const before = new Map(files);
    const second = await run(files, ["init", "--json"]);
    expect(files).toEqual(before);
    expect(second.exitCode).toBe(0);
    expect(second.stdout).not.toContain('"created"');
    expect(second.stdout).not.toContain('"updated"');
  });

  it("never overwrites existing files, including a hand-written CODEOWNERS", async () => {
    const mine = "* @someone\n";
    const files = new Map([
      [`${root}/AGENTS.md`, "# mine\n"],
      [`${root}/CODEOWNERS`, mine],
    ]);
    const out = await run(files, ["init"]);
    expect(files.get(`${root}/AGENTS.md`)).toBe("# mine\n");
    expect(files.get(`${root}/CODEOWNERS`)).toBe(mine);
    expect(out.stdout).toContain("CODEOWNERS was not written by trellis");
  });

  it("regenerates a CODEOWNERS it wrote when the constitution changes", async () => {
    const files = new Map<string, string>();
    await run(files, ["init", "--owner", "@a"]);
    const path = `${root}/.trellis/constitution.yaml`;
    files.set(path, (files.get(path) ?? "").replace('["@a"]', '["@b"]'));
    await run(files, ["init"]);
    expect(files.get(`${root}/CODEOWNERS`)).toMatch(new RegExp(`^${generatedHeader}\\n\\* @b\\n`));
  });
});

describe("trellis init errors (shell behaviour itself is in shell.test.ts)", () => {
  it("an unsupported --stack exits 2", async () => {
    expect((await run(new Map(), ["init", "--stack", "stack-go"])).exitCode).toBe(2);
  });

  it("an invalid constitution is a config error, exit 2, with file and line", async () => {
    const files = new Map([[`${root}/.trellis/constitution.yaml`, "version: 1\nhumans: nope\n"]]);
    const out = await run(files, ["init"]);
    expect(out.exitCode).toBe(2);
    expect(out.stderr).toMatch(/constitution\.yaml:\d+:/);
  });

  it("--json reports each path and what happened to it", async () => {
    const out = await run(new Map(), ["init", "--json"]);
    expect(out.stdout).toContain('{"path":"CODEOWNERS","change":"created"}');
  });
});
