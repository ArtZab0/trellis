import { Effect, Schema } from "effect";
import { Count, NonNegative, PinnedImage, PositiveCount, Ratio, SemVer, Text } from "./common.js";

const Agent = Schema.Struct({
  id: Text,
  runner: Schema.Literals(["claude-code", "codex", "cursor", "openhands"]),
  model: Schema.optionalKey(Text),
});

const Reference = Schema.Struct({
  id: Text,
  image: PinnedImage,
  protocol: Schema.Literals(["s3", "http", "cli", "file-format"]),
  generators: Schema.Array(Text),
  allowlist: Text,
  minInputs: PositiveCount,
});

/** `.trellis/trellis.yaml`: project config (CONTRACTS §1). */
export const TrellisConfig = Schema.Struct({
  version: Schema.Literal(1),
  project: Schema.Struct({
    name: Text,
    repo: Schema.String.check(
      Schema.isPattern(/^[\w.-]+\/[\w.-]+$/, { expected: 'a GitHub repo as "owner/name"' }),
    ),
  }),
  stack: Schema.Struct({ pack: Text, version: SemVer }),
  specPacks: Schema.Array(Schema.Struct({ name: Text, version: SemVer })),
  adapters: Schema.Struct({
    codeHost: Schema.Literal("github"),
    ci: Schema.Literal("github-actions"),
    sandbox: Schema.Literals(["docker", "e2b", "modal", "firecracker"]),
    agents: Schema.Array(Agent),
    artifactStore: Schema.Struct({ kind: Schema.Literal("s3"), endpoint: Text, bucket: Text }),
    flags: Schema.optionalKey(
      Schema.Struct({ kind: Schema.Literal("openfeature"), provider: Text }),
    ),
    telemetry: Schema.optionalKey(Schema.Struct({ kind: Schema.Literal("otel"), endpoint: Text })),
  }),
  mode: Schema.Literals(["maintenance", "construction"]).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed("maintenance")),
  ),
  references: Schema.optionalKey(Schema.Array(Reference)),
  gate: Schema.Struct({
    image: PinnedImage,
    seeds: Schema.Struct({
      properties: Schema.Array(Count),
      dst: Schema.Array(Count),
      mutation: Count,
    }),
    bounds: Schema.Struct({
      machineDepth: PositiveCount,
      dstStepsPerSeed: PositiveCount,
      propertyRuns: PositiveCount,
    }),
    thresholds: Schema.Struct({ mutation: Ratio, maxPrLines: PositiveCount }),
  }),
  budgets: Schema.Struct({
    usdPerTask: NonNegative,
    usdPerDay: NonNegative,
    usdPerMonth: NonNegative,
  }),
});

/** Decoded project config. */
export type TrellisConfig = typeof TrellisConfig.Type;
