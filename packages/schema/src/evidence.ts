import { Schema } from "effect";
import { NonNegative, PositiveCount, Ratio, Text, Tier, Count } from "./common.js";
import { Digest, Sha, StageName } from "./digest.js";

const Run = Schema.Struct({
  feature: Text,
  side: Schema.Literals(["base", "head"]),
  seed: Schema.Int,
  artifacts: Schema.Struct({
    video: Schema.optionalKey(Digest),
    rrweb: Schema.optionalKey(Digest),
    trace: Schema.optionalKey(Digest),
    screenshots: Schema.Array(Digest),
    perf: Schema.optionalKey(Digest),
  }),
  properties: Schema.Array(
    Schema.Struct({
      id: Text,
      verdict: Schema.Literals(["pass", "fail"]),
      counterexample: Schema.optionalKey(Digest),
    }),
  ),
});

/** `evidence.json`: what was run on a PR and what it produced (CONTRACTS §8). */
export const EvidenceBundle = Schema.Struct({
  version: Schema.Literal(1),
  repo: Text,
  pr: Schema.optionalKey(PositiveCount),
  base: Sha,
  head: Sha,
  task: Schema.optionalKey(Text),
  tier: Schema.Struct({ value: Tier, reasons: Schema.Array(Text) }),
  features: Schema.Struct({ named: Schema.Array(Text), impacted: Schema.Array(Text) }),
  stages: Schema.Record(
    StageName,
    Schema.Struct({ verdict: Schema.Literals(["pass", "fail", "skipped"]), detail: Digest }),
  ),
  runs: Schema.Array(Run),
  diffs: Schema.Array(
    Schema.Struct({
      feature: Text,
      kind: Schema.Literals(["visual", "structural", "behavioral", "perf"]),
      expected: Schema.Boolean,
      detail: Digest,
    }),
  ),
  verifier: Schema.optionalKey(
    Schema.Struct({
      runner: Text,
      model: Text,
      verdict: Schema.Literals(["approve", "reject", "escalate"]),
      notes: Schema.String,
    }),
  ),
  cost: Schema.Struct({
    usd: NonNegative,
    tokensIn: Count,
    tokensOut: Count,
    verifyShare: Ratio,
  }),
});

/** Decoded evidence bundle. */
export type EvidenceBundle = typeof EvidenceBundle.Type;
