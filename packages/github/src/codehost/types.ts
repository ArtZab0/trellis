import { Data, Schema } from "effect";

/** A branch ruleset, in the terms Trellis configures (a subset of GitHub's model). */
export const Ruleset = Schema.Struct({
  name: Schema.String,
  enforcement: Schema.Literals(["active", "evaluate", "disabled"]),
  branches: Schema.Array(Schema.String),
  requiredChecks: Schema.Array(Schema.String),
  requiredApprovals: Schema.Int,
  requireCodeOwnerReview: Schema.Boolean,
  mergeQueue: Schema.Boolean,
});

/** Decoded ruleset. */
export type Ruleset = typeof Ruleset.Type;

/** An issue/PR label. `color` is 6 hex digits without `#`. */
export const Label = Schema.Struct({
  name: Schema.String,
  color: Schema.String,
  description: Schema.String,
});

/** Decoded label. */
export type Label = typeof Label.Type;

/** Access levels a GitHub App can hold on a permission. */
export type Access = "read" | "write" | "admin";

/** A code host call failed. */
export class CodeHostError extends Data.TaggedError("CodeHostError")<{
  readonly operation: string;
  readonly message: string;
  readonly status?: number;
}> {}

/** A mutating call, as the recorded fake logs it. */
export type Call =
  | { readonly op: "upsertRuleset"; readonly ruleset: Ruleset }
  | { readonly op: "upsertLabel"; readonly label: Label }
  | { readonly op: "writeFile"; readonly path: string; readonly text: string };
