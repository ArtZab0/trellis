import { Schema } from "effect";
import { ClauseId, Glob, Text, Tier } from "./common.js";

const Property = Schema.Struct({
  id: Text,
  says: Text,
  impl: Schema.String.check(
    Schema.isPattern(/^(?:stack:[\w.-]+|[^#\s]+#[\w$]+)$/, {
      expected: 'an implementation as "path#export" or "stack:<id>"',
    }),
  ),
});

/** `features/<area>/<name>.yaml`: one feature in the feature map (CONTRACTS §4). */
export const Feature = Schema.Struct({
  version: Schema.Literal(1),
  id: Text,
  title: Text,
  area: Text,
  tier: Tier,
  owner: Text,
  entry: Schema.Struct({
    route: Schema.optionalKey(Text),
    command: Schema.optionalKey(Text),
    endpoint: Schema.optionalKey(Text),
    path: Schema.optionalKey(Schema.Array(Text)),
  }),
  driver: Schema.optionalKey(Text),
  clauses: Schema.Array(ClauseId),
  properties: Schema.Array(Property),
  budgets: Schema.optionalKey(Schema.Array(Schema.Struct({ metric: Text, max: Schema.Finite }))),
  touches: Schema.optionalKey(
    Schema.Struct({ code: Schema.Array(Glob), data: Schema.Array(Text) }),
  ),
  flags: Schema.optionalKey(Schema.Array(Text)),
  dependsOn: Schema.optionalKey(Schema.Array(Text)),
});

/** Decoded feature. */
export type Feature = typeof Feature.Type;
