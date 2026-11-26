import { Context, type Effect, type Option } from "effect";
import type { Access, CodeHostError, Label, Ruleset } from "./types.js";

type Op<A> = Effect.Effect<A, CodeHostError>;

/**
 * Everything Trellis reads or changes on a code host, for one repo (ADR-0004). Upserts match by
 * name and are no-ops when nothing differs, so applying the same settings twice changes nothing.
 */
export interface CodeHostShape {
  readonly repo: string;
  readonly listRulesets: () => Op<ReadonlyArray<Ruleset>>;
  readonly upsertRuleset: (ruleset: Ruleset) => Op<"created" | "updated" | "unchanged">;
  readonly listLabels: () => Op<ReadonlyArray<Label>>;
  readonly upsertLabel: (label: Label) => Op<"created" | "updated" | "unchanged">;
  /** A file on the default branch, such as `CODEOWNERS`. */
  readonly readFile: (path: string) => Op<Option.Option<string>>;
  /** Commits a file to the default branch. */
  readonly writeFile: (
    path: string,
    text: string,
    message: string,
  ) => Op<"created" | "updated" | "unchanged">;
  /** The permissions the Trellis GitHub App holds on this repo. */
  readonly appPermissions: () => Op<Readonly<Record<string, Access>>>;
}

/** The code host service. */
export class CodeHost extends Context.Service<CodeHost, CodeHostShape>()("trellis/CodeHost") {}
