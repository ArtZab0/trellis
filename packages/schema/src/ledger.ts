import { Schema } from "effect";
import { PositiveCount, Text } from "./common.js";

const Ulid = Schema.String.check(
  Schema.isPattern(/^[0-9A-HJKMNP-TV-Z]{26}$/, { expected: "a ULID (26 Crockford base32 chars)" }),
);

const Instant = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/, {
    expected: "an ISO instant in UTC, such as 2026-11-25T19:45:34Z",
  }),
);

/** One line of the correction ledger, stored as JSONL (CONTRACTS §7). */
export const LedgerEvent = Schema.Struct({
  version: Schema.Literal(1),
  id: Ulid,
  at: Instant,
  kind: Schema.Literals([
    "review-comment",
    "human-edit",
    "revert",
    "escaped-defect",
    "incident",
    "verifier-reject",
    "reprompt",
    "replay-comment",
    "drift",
  ]),
  repo: Text,
  pr: Schema.optionalKey(PositiveCount),
  commit: Schema.optionalKey(
    Schema.String.check(Schema.isPattern(/^[0-9a-f]{7,64}$/, { expected: "a git commit sha" })),
  ),
  feature: Schema.optionalKey(Text),
  area: Schema.optionalKey(Text),
  text: Text,
  diff: Schema.optionalKey(Schema.String),
  cluster: Schema.optionalKey(Text),
  resolution: Schema.optionalKey(
    Schema.Struct({
      kind: Schema.Literals(["api", "rule", "property", "prose", "wontfix"]),
      ref: Text,
    }),
  ),
});

/** Decoded ledger event. */
export type LedgerEvent = typeof LedgerEvent.Type;
