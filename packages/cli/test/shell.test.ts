import { Effect, FileSystem, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { ConfigError, defineCommand, type Output, parseArgv, runCli } from "../src/index.js";
import { memoryFs } from "./memory-fs.js";

const echo = defineCommand({
  name: "echo",
  summary: "Echo a word; fail the check with --fail; fail config with --broken",
  args: Schema.Struct({
    word: Schema.optionalKey(Schema.String),
    fail: Schema.optionalKey(Schema.Boolean),
    broken: Schema.optionalKey(Schema.Boolean),
  }),
  run: (args) =>
    args.broken === true
      ? Effect.fail(new ConfigError({ message: ".trellis/trellis.yaml:3: bad" }))
      : Effect.succeed({
          ok: args.fail !== true,
          text: `said ${args.word ?? "nothing"}`,
          json: { said: args.word ?? null },
        }),
});

const run = (argv: ReadonlyArray<string>): Promise<Output> =>
  Effect.runPromise(
    runCli([echo], argv, { cwd: "/w" }).pipe(
      Effect.provideService(FileSystem.FileSystem, memoryFs(new Map())),
    ),
  );

describe("parseArgv", () => {
  it("reads --flag value, --flag=value, bare --flag and positionals", () => {
    expect(parseArgv(["echo", "x", "--word", "hi", "--a=b", "--yes"])).toEqual({
      command: "echo",
      positionals: ["x"],
      flags: { word: "hi", a: "b", yes: true },
    });
  });
});

describe("CLI shell: commands, exit codes and --json", () => {
  it("runs a registered command and prints its text; exit 0", async () => {
    expect(await run(["echo", "--word", "hi"])).toEqual({
      exitCode: 0,
      stdout: "said hi\n",
      stderr: "",
    });
  });

  it("a failed check exits 1", async () => {
    expect((await run(["echo", "--fail"])).exitCode).toBe(1);
  });

  it("no command prints usage listing the commands, exit 2", async () => {
    const out = await run([]);
    expect(out.exitCode).toBe(2);
    expect(out.stderr).toContain("Usage: trellis <command>");
    expect(out.stderr).toContain("echo");
  });

  it("an unknown command exits 2", async () => {
    expect((await run(["frobnicate"])).exitCode).toBe(2);
  });

  it("an unknown flag exits 2 and names it", async () => {
    const out = await run(["echo", "--colour", "red"]);
    expect(out.exitCode).toBe(2);
    expect(out.stderr).toContain("colour");
  });

  it("a flag of the wrong type exits 2", async () => {
    expect((await run(["echo", "--fail", "maybe"])).exitCode).toBe(2);
  });

  it("a config error exits 2 with its message on stderr", async () => {
    const out = await run(["echo", "--broken"]);
    expect(out).toEqual({ exitCode: 2, stdout: "", stderr: ".trellis/trellis.yaml:3: bad\n" });
  });

  it("--json prints one JSON document on stdout, also for errors", async () => {
    expect((await run(["echo", "--word", "hi", "--json"])).stdout).toBe('{"said":"hi"}\n');
    const failed = await run(["echo", "--broken", "--json"]);
    expect(failed.exitCode).toBe(2);
    expect(failed.stdout).toBe(
      '{"error":"ConfigError","message":".trellis/trellis.yaml:3: bad"}\n',
    );
  });
});
