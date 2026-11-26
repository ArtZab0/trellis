import type {
  Baseline,
  Constitution,
  Feature,
  RulePackage,
  Spec,
  TaskSpec,
  TrellisConfig,
} from "@trellis/schema";
import { Data, Effect, FileSystem, Result } from "effect";
import {
  baselineContract,
  configContract,
  constitutionContract,
  featureContract,
  ruleContract,
  specContract,
  taskContract,
} from "../load/contracts.js";
import type { LoadError } from "../load/errors.js";
import { loadContract } from "../load/load.js";
import type { Contract } from "../load/parse.js";

/** Every contract file of a Trellis project, parsed. */
export interface Project {
  readonly root: string;
  readonly config: TrellisConfig;
  readonly constitution: Constitution;
  readonly features: ReadonlyArray<Feature>;
  readonly rules: ReadonlyArray<RulePackage>;
  readonly baselines: ReadonlyArray<Baseline>;
  readonly specs: ReadonlyArray<Spec>;
  readonly tasks: ReadonlyArray<TaskSpec>;
}

/** A project failed to load; every file's problem is listed, in path order. */
export class ProjectLoadFailed extends Data.TaggedError("ProjectLoadFailed")<{
  readonly errors: ReadonlyArray<LoadError>;
}> {}

type Fs = FileSystem.FileSystem;
type Loaded<A> = Effect.Effect<ReadonlyArray<Result.Result<A, LoadError>>, never, Fs>;

const isYaml = (name: string): boolean => name.endsWith(".yaml") || name.endsWith(".yml");

const listFiles = (
  dir: string,
  keep: (relative: string) => boolean,
): Effect.Effect<ReadonlyArray<string>, never, Fs> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const present = yield* fs.exists(dir).pipe(Effect.orElseSucceed(() => false));
    if (!present) return [];
    const names = yield* fs
      .readDirectory(dir, { recursive: true })
      .pipe(Effect.orElseSucceed((): ReadonlyArray<string> => []));
    return names
      .map((name) => name.replaceAll("\\", "/"))
      .filter(keep)
      .sort()
      .map((name) => `${dir}/${name}`);
  });

const loadAll = <A>(contract: Contract<A>, files: ReadonlyArray<string>): Loaded<A> =>
  Effect.forEach(files, (file) => Effect.result(loadContract(contract, file)));

const ruleDir = (file: string): string => file.slice(0, file.lastIndexOf("/"));

const loadBaselines = (rules: ReadonlyArray<readonly [string, RulePackage]>): Loaded<Baseline> =>
  loadAll(
    baselineContract,
    rules.flatMap(([file, rule]) =>
      rule.baseline === undefined ? [] : [`${ruleDir(file)}/${rule.baseline}`],
    ),
  );

const successes = <A>(results: ReadonlyArray<Result.Result<A, LoadError>>): ReadonlyArray<A> =>
  results.flatMap((result) => (Result.isSuccess(result) ? [result.success] : []));

const failures = (results: ReadonlyArray<Result.Result<unknown, LoadError>>) =>
  results.flatMap((result) => (Result.isFailure(result) ? [result.failure] : []));

/**
 * Reads every contract file under `root`: `.trellis/trellis.yaml`, `.trellis/constitution.yaml`,
 * `features/**`, `rules/<id>/rule.yaml` (and the baselines they name), `spec/*.yaml` and
 * `tasks/*.yaml`. Missing optional directories count as empty.
 */
export const loadProject = (root: string): Effect.Effect<Project, ProjectLoadFailed, Fs> =>
  Effect.gen(function* () {
    const at = (path: string): string => `${root}/${path}`;
    const config = yield* Effect.result(loadContract(configContract, at(".trellis/trellis.yaml")));
    const constitution = yield* Effect.result(
      loadContract(constitutionContract, at(".trellis/constitution.yaml")),
    );
    const features = yield* loadAll(featureContract, yield* listFiles(at("features"), isYaml));
    const ruleFiles = yield* listFiles(at("rules"), (name) => /^[^/]+\/rule\.ya?ml$/.test(name));
    const rules = yield* loadAll(ruleContract, ruleFiles);
    const loadedRules = ruleFiles.flatMap((file, i) => {
      const result = rules[i];
      if (result === undefined || Result.isFailure(result)) return [];
      const pair: readonly [string, RulePackage] = [file, result.success];
      return [pair];
    });
    const baselines = yield* loadBaselines(loadedRules);
    const specs = yield* loadAll(specContract, yield* listFiles(at("spec"), isYaml));
    const tasks = yield* loadAll(taskContract, yield* listFiles(at("tasks"), isYaml));
    const errors = [
      ...failures([config, constitution]),
      ...failures(features),
      ...failures(rules),
      ...failures(baselines),
      ...failures(specs),
      ...failures(tasks),
    ];
    if (Result.isFailure(config) || Result.isFailure(constitution) || errors.length > 0) {
      return yield* new ProjectLoadFailed({ errors });
    }
    return {
      root,
      config: config.success,
      constitution: constitution.success,
      features: successes(features),
      rules: successes(rules),
      baselines: successes(baselines),
      specs: successes(specs),
      tasks: successes(tasks),
    };
  });
