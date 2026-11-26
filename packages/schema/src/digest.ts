import { Schema } from "effect";

/** A content digest: `sha256:` and 64 lowercase hex characters. */
export const Digest = Schema.String.check(
  Schema.isPattern(/^sha256:[0-9a-f]{64}$/, { expected: "a digest such as sha256:<64 hex>" }),
);

/** A git commit sha (40 or 64 lowercase hex characters). */
export const Sha = Schema.String.check(
  Schema.isPattern(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/, { expected: "a full git commit sha" }),
);

/** A gate stage (CONTRACTS §9). */
export const StageName = Schema.Literals([
  "classify",
  "static",
  "stack-rules",
  "trend",
  "spec-lints",
  "spec-consistency",
  "traceability",
  "unit",
  "properties",
  "machines",
  "dst",
  "mutation",
  "perf",
  "build",
  "verify-runs",
  "differential",
  "policy",
]);

/** Where a check comes from; only independent origins count toward the guarantee (ADR-0011). */
export const CheckOrigin = Schema.Literals([
  "spec-generated",
  "external-suite",
  "reference",
  "human",
  "implementer",
]);
