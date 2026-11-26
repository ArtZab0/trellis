import { Schema } from "effect";
import { ClauseId, Text } from "./common.js";

/** An identifier: entity, role, field, command, state or event name. */
export const Ident = Schema.String.check(
  Schema.isPattern(/^[A-Za-z][A-Za-z0-9_]*$/, { expected: 'an identifier such as "Invoice"' }),
);

/** A duration such as `30d`, `12h` or `500ms`. */
export const Duration = Schema.String.check(
  Schema.isPattern(/^\d+(?:ms|s|m|h|d|w)$/, { expected: 'a duration such as "30d" or "12h"' }),
);

/** An expression in the spec expression language; kept as source text until M4 parses it. */
export const Expr = Text;

const Bounds = { min: Schema.optionalKey(Schema.Finite), max: Schema.optionalKey(Schema.Finite) };

/** A field's type (CONTRACTS §3). */
export type FieldType =
  | "Id"
  | "Text"
  | "Bool"
  | "Int"
  | "Decimal"
  | "Money"
  | "Currency"
  | "Instant"
  | "Date"
  | "Duration"
  | "Email"
  | "Url"
  | { readonly enum: ReadonlyArray<string> }
  | { readonly ref: string }
  | { readonly list: FieldType }
  | { readonly optional: FieldType }
  | {
      readonly type: "Text";
      readonly min?: number;
      readonly max?: number;
      readonly pattern?: string;
    }
  | { readonly type: "Int" | "Decimal" | "Money"; readonly min?: number; readonly max?: number };

/** A field's type (CONTRACTS §3). */
export const FieldType: Schema.Codec<FieldType> = Schema.Union([
  Schema.Literals([
    "Id",
    "Text",
    "Bool",
    "Int",
    "Decimal",
    "Money",
    "Currency",
    "Instant",
    "Date",
    "Duration",
    "Email",
    "Url",
  ]),
  Schema.Struct({ enum: Schema.Array(Text) }),
  Schema.Struct({ ref: Ident }),
  Schema.Struct({ list: Schema.suspend(() => FieldType) }),
  Schema.Struct({ optional: Schema.suspend(() => FieldType) }),
  Schema.Struct({ type: Schema.Literal("Text"), ...Bounds, pattern: Schema.optionalKey(Text) }),
  Schema.Struct({ type: Schema.Literals(["Int", "Decimal", "Money"]), ...Bounds }),
]);

/** Fields every spec clause carries (CONTRACTS §3). */
export const ClauseFields = {
  id: ClauseId,
  says: Text,
  source: Schema.Union([
    Schema.Literals(["user", "default", "redteam", "incident"]),
    Schema.TemplateLiteral(["pack:", Schema.String]),
  ]),
  approval: Schema.optionalKey(
    Schema.Struct({
      by: Text,
      at: Text,
      via: Schema.Literals(["scenario-replay", "prototype", "text"]),
    }),
  ),
};

/** A scenario step: an action by a role, or a move of simulated time. */
export const Step = Schema.Union([
  Schema.Struct({
    do: Text,
    as: Schema.optionalKey(Ident),
    with: Schema.optionalKey(Schema.Record(Ident, Schema.Json)),
  }),
  Schema.Struct({ at: Text }),
]);
