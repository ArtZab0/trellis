import { Schema } from "effect";
import { Count, Glob, NonNegative, PositiveCount, Ratio, Text } from "./common.js";

/** `.trellis/constitution.yaml`: human-owned policy (CONTRACTS §2). */
export const Constitution = Schema.Struct({
  version: Schema.Literal(1),
  humans: Schema.Array(
    Schema.String.check(
      Schema.isPattern(/^@[\w.-]+(?:\/[\w.-]+)?$/, {
        expected: 'a GitHub login or team, such as "@org/core"',
      }),
    ),
  ),
  paths: Schema.Struct({
    tier3: Schema.Array(Glob),
    tier2: Schema.Array(Glob),
    tier0: Schema.optionalKey(Schema.Array(Glob)),
  }),
  trust: Schema.Struct({
    earn: Schema.Struct({
      consecutiveCleanMerges: PositiveCount,
      minMutationScore: Ratio,
      require: Schema.Array(Schema.Literals(["driver", "properties", "spec-clauses"])),
    }),
    demoteOn: Schema.Array(Schema.Literals(["escaped_defect", "revert", "incident"])),
  }),
  automerge: Schema.Struct({
    tier0: Schema.Boolean,
    tier1: Schema.Union([
      Schema.Struct({ whenArea: Schema.Literal("earned"), samplingRate: Ratio }),
      Schema.Literal(false).annotate({
        message: "Expected false, or { whenArea: earned, samplingRate: <0..1> }",
      }),
    ]),
  }),
  breaker: Schema.Struct({
    revertRate7d: Ratio,
    escapedPer100: NonNegative,
    changeFailureRate: Ratio,
    costSpikeMultiple: NonNegative,
  }),
  dependencies: Schema.Struct({ allow: Schema.Array(Text), requireTier: Schema.Literals([2, 3]) }),
  uncertifiedZones: Schema.Array(Glob),
  trends: Schema.Struct({
    baselineCommits: PositiveCount,
    erosionMaxIncrease: NonNegative,
    verbosityMaxIncrease: NonNegative,
    linesPerClauseMax: PositiveCount,
    buildSecondsMax: PositiveCount,
  }),
  prototypes: Schema.Struct({
    globs: Schema.Array(Glob),
    defaultExpiryDays: PositiveCount,
    flagRequired: Schema.Literal(true),
  }),
  markdown: Schema.Struct({ agentWritableGlobs: Schema.Array(Glob), maxBytesPerFile: Count }),
});

/** Decoded constitution. */
export type Constitution = typeof Constitution.Type;
