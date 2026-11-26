import { Schema } from "effect";
import { Count, Glob, Text, Tier } from "./common.js";

/** `rules/<id>/rule.yaml`: a rule package (CONTRACTS §5). */
export const RulePackage = Schema.Struct({
  version: Schema.Literal(1),
  id: Schema.String.check(
    Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      expected: 'a kebab-case id such as "no-throw"',
    }),
  ),
  kind: Schema.Literals([
    "api-ban",
    "boundary",
    "structure",
    "semantic",
    "ratchet",
    "type",
    "comment",
    "suppression",
  ]),
  engine: Schema.Literals(["eslint", "ast-grep", "semgrep", "dependency-cruiser", "trellis"]),
  scope: Schema.Struct({
    include: Schema.Array(Glob),
    exclude: Schema.optionalKey(Schema.Array(Glob)),
  }),
  tier: Tier,
  message: Text,
  fixtures: Schema.Struct({ bad: Text, good: Text }),
  codemod: Schema.optionalKey(Text),
  baseline: Schema.optionalKey(Text),
  origin: Schema.optionalKey(Schema.Array(Text)),
});

/** Decoded rule package. */
export type RulePackage = typeof RulePackage.Type;

/** `baseline.json`: a ratchet's recorded violations (CONTRACTS §5). */
export const Baseline = Schema.Struct({
  version: Schema.Literal(1),
  rule: Text,
  count: Count,
  locations: Schema.Array(Schema.Struct({ file: Text, hash: Text })),
});

/** Decoded baseline. */
export type Baseline = typeof Baseline.Type;
