import { Schema } from "effect";
import { Count, Glob, NonNegative, PositiveCount, Ratio, Text } from "./common.js";
import { CheckOrigin, Digest, Sha, StageName } from "./digest.js";

const fields = <V extends Schema.Top>(verdict: V) => ({
  version: Schema.Literal(1),
  subject: Schema.Struct({ repo: Text, commit: Sha, artifact: Schema.optionalKey(Digest) }),
  inputs: Schema.Struct({
    image: Digest,
    lockfile: Digest,
    configDigest: Digest,
    specDigest: Digest,
    constitutionDigest: Digest,
  }),
  bounds: Schema.Struct({
    propertySeeds: Schema.Array(Schema.Int),
    propertyRuns: PositiveCount,
    dstSeeds: Schema.Array(Schema.Int),
    dstSteps: Count,
    machineDepth: Count,
  }),
  results: Schema.Record(
    StageName,
    Schema.Struct({
      verdict,
      summary: Schema.Record(Text, Schema.Union([Schema.Finite, Schema.String])),
    }),
  ),
  traceability: Schema.Struct({
    clauses: Count,
    clausesChecked: Count,
    codeUnits: Count,
    codeUnitsTraced: Count,
  }),
  checks: Schema.Struct({
    byOrigin: Schema.Record(CheckOrigin, Schema.Struct({ count: Count, passed: Count })),
    independentShare: Ratio,
  }),
  differential: Schema.optionalKey(
    Schema.Array(
      Schema.Struct({ reference: Text, inputs: Count, differences: Count, allowlisted: Count }),
    ),
  ),
  trends: Schema.Struct({
    erosion: Schema.Finite,
    verbosity: Schema.Finite,
    linesPerClause: NonNegative,
    buildSeconds: NonNegative,
    baselineCommit: Sha,
  }),
  uncertified: Schema.Struct({ zones: Schema.Array(Glob), lines: Count }),
  issuedAt: Text,
  reproHash: Digest,
});

/** `certificate.json`: issued only when every stage passes; signed next to the file (CONTRACTS §9). */
export const Certificate = Schema.Struct(fields(Schema.Literal("pass")));

/** Decoded certificate. */
export type Certificate = typeof Certificate.Type;

/** The certificate's shape for any build, where a stage may fail; never signed (CONTRACTS §9). */
export const GateReport = Schema.Struct(fields(Schema.Literals(["pass", "fail"])));

/** Decoded gate report. */
export type GateReport = typeof GateReport.Type;
