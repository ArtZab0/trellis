import { Data, Effect, type FileSystem, Result, Schema, SchemaIssue } from "effect";
import { type Flags, parseArgv } from "./args.js";

/** What a command reports: `ok: false` means a check failed (exit 1). */
export interface Report {
  readonly ok: boolean;
  readonly text: string;
  readonly json: Schema.Json;
}

/** The command line was wrong (exit 2). */
export class UsageError extends Data.TaggedError("UsageError")<{ readonly message: string }> {}

/** The project could not be read or written (exit 2). */
export class ConfigError extends Data.TaggedError("ConfigError")<{ readonly message: string }> {}

/** Where a command runs. */
export interface Context {
  readonly cwd: string;
}

type Run = Effect.Effect<Report, UsageError | ConfigError, FileSystem.FileSystem>;

/** A registered command; its flags are checked against `args` before `run` sees them. */
export interface Command {
  readonly name: string;
  readonly summary: string;
  readonly run: (flags: Flags, context: Context) => Run;
}

/** Defines a command whose flags decode through `args`; unknown flags are a usage error. */
export const defineCommand = <A>(spec: {
  readonly name: string;
  readonly summary: string;
  readonly args: Schema.Codec<A, unknown>;
  readonly run: (args: A, context: Context) => Run;
}): Command => ({
  name: spec.name,
  summary: spec.summary,
  run: (flags, context) => {
    const decoded = Schema.decodeUnknownResult(spec.args, { onExcessProperty: "error" })(flags);
    if (Result.isSuccess(decoded)) return spec.run(decoded.success, context);
    const detail = SchemaIssue.makeFormatterDefault()(decoded.failure.issue);
    return Effect.fail(new UsageError({ message: `trellis ${spec.name}: ${detail}` }));
  },
});

/** The CLI's answer: what to print, where, and the exit code. */
export interface Output {
  readonly exitCode: 0 | 1 | 2;
  readonly stdout: string;
  readonly stderr: string;
}

const help = (commands: ReadonlyArray<Command>): string =>
  [
    "Usage: trellis <command> [--json] [flags]",
    "",
    ...commands.map((c) => `  ${c.name.padEnd(10)}${c.summary}`),
  ].join("\n");

const render = (report: Report, json: boolean): Output => ({
  exitCode: report.ok ? 0 : 1,
  stdout: `${json ? JSON.stringify(report.json) : report.text}\n`,
  stderr: "",
});

const failed = (error: UsageError | ConfigError, json: boolean): Output => ({
  exitCode: 2,
  stdout: json ? `${JSON.stringify({ error: error._tag, message: error.message })}\n` : "",
  stderr: json ? "" : `${error.message}\n`,
});

/** Runs one command line. Exit codes: 0 ok, 1 a check failed, 2 usage or config error. */
export const runCli = (
  commands: ReadonlyArray<Command>,
  argv: ReadonlyArray<string>,
  context: Context,
): Effect.Effect<Output, never, FileSystem.FileSystem> => {
  const { command, flags } = parseArgv(argv);
  const { json = false, ...rest } = flags;
  const asJson = json === true;
  const found = commands.find((c) => c.name === command);
  if (found === undefined) {
    const message =
      command === undefined ? help(commands) : `Unknown command "${command}".\n\n${help(commands)}`;
    return Effect.succeed(failed(new UsageError({ message }), asJson));
  }
  return found.run(rest, context).pipe(
    Effect.map((report) => render(report, asJson)),
    Effect.catch((error) => Effect.succeed(failed(error, asJson))),
  );
};
