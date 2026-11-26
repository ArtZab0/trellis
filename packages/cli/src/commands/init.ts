import { constitutionContract, parseContract } from "@trellis/core";
import { codeownersFor, generatedHeader } from "@trellis/github";
import { Effect, FileSystem, Result, Schema } from "effect";
import { ConfigError, type Context, defineCommand, type Report } from "../registry.js";
import {
  agentsMd,
  architectureMd,
  configYaml,
  constitutionYaml,
  type InitAnswers,
  keptDirs,
  storyMd,
} from "./templates.js";

type Change = "created" | "updated" | "unchanged" | "kept";

const Args = Schema.Struct({
  stack: Schema.optionalKey(Schema.Literal("stack-ts-v1")),
  yes: Schema.optionalKey(Schema.Boolean),
  name: Schema.optionalKey(Schema.String),
  repo: Schema.optionalKey(Schema.String),
  owner: Schema.optionalKey(Schema.String),
});

const ioError = (cause: { readonly message: string }) =>
  new ConfigError({ message: cause.message });

const writeIfMissing = (root: string, path: string, text: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const file = `${root}/${path}`;
    if (yield* fs.exists(file)) return "unchanged" satisfies Change;
    const dir = file.slice(0, file.lastIndexOf("/"));
    yield* fs.makeDirectory(dir, { recursive: true });
    yield* fs.writeFileString(file, text);
    return "created" satisfies Change;
  }).pipe(Effect.mapError(ioError));

const writeCodeowners = (root: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const constitutionFile = `${root}/.trellis/constitution.yaml`;
    const parsed = parseContract(
      constitutionContract,
      constitutionFile,
      yield* fs.readFileString(constitutionFile),
    );
    if (Result.isFailure(parsed)) {
      const { file, line, message, fix } = parsed.failure;
      return yield* new ConfigError({ message: `${file}:${String(line)}: ${message}. ${fix}` });
    }
    const wanted = codeownersFor(parsed.success);
    const file = `${root}/CODEOWNERS`;
    if (!(yield* fs.exists(file))) {
      yield* fs.writeFileString(file, wanted);
      return "created" satisfies Change;
    }
    const current = yield* fs.readFileString(file);
    if (current === wanted) return "unchanged" satisfies Change;
    if (!current.startsWith(generatedHeader)) return "kept" satisfies Change;
    yield* fs.writeFileString(file, wanted);
    return "updated" satisfies Change;
  }).pipe(Effect.mapError((e) => (e instanceof ConfigError ? e : ioError(e))));

const plan = (a: InitAnswers): ReadonlyArray<readonly [string, string]> => [
  [".trellis/trellis.yaml", configYaml(a)],
  [".trellis/constitution.yaml", constitutionYaml(a)],
  ["AGENTS.md", agentsMd(a)],
  ["ARCHITECTURE.md", architectureMd(a)],
  ["spec/story.md", storyMd(a)],
  ...keptDirs.map((dir): readonly [string, string] => [`${dir}/.gitkeep`, ""]),
];

const report = (changes: ReadonlyArray<readonly [string, Change]>): Report => {
  const changed = changes.filter(([, change]) => change === "created" || change === "updated");
  const lines = changes.map(([path, change]) => `${change.padEnd(10)}${path}`);
  const kept = changes.some(([path, c]) => path === "CODEOWNERS" && c === "kept");
  const note = kept ? ["", "CODEOWNERS was not written by trellis, so it was left alone."] : [];
  return {
    ok: true,
    text: [...lines, ...note, "", `${String(changed.length)} files changed.`].join("\n"),
    json: { changes: changes.map(([path, change]) => ({ path, change })) },
  };
};

const basename = (path: string): string => path.split("/").filter(Boolean).pop() ?? "project";

/** `trellis init`: lays out a Trellis project. Never overwrites a file; running it twice changes nothing. */
export const initCommand = defineCommand({
  name: "init",
  summary: "Create .trellis/, the spec story, feature/rule folders and CODEOWNERS",
  args: Args,
  run: (args, context: Context) =>
    Effect.gen(function* () {
      const name = args.name ?? basename(context.cwd);
      const answers: InitAnswers = {
        name,
        repo: args.repo ?? `OWNER/${name}`,
        owner: args.owner ?? "@OWNER",
        stack: args.stack ?? "stack-ts-v1",
      };
      const changes: Array<readonly [string, Change]> = [];
      for (const [path, text] of plan(answers)) {
        changes.push([path, yield* writeIfMissing(context.cwd, path, text)]);
      }
      changes.push(["CODEOWNERS", yield* writeCodeowners(context.cwd)]);
      return report(changes);
    }),
});
