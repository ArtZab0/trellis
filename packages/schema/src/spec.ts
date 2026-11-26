import { Schema } from "effect";
import { ClauseId, SemVer, Text } from "./common.js";
import { ClauseFields, Duration, Expr, FieldType, Ident, Step } from "./spec-parts.js";

const Policies = Schema.Struct({
  money: Schema.optionalKey(
    Schema.Struct({
      minorUnits: Schema.Literal(true),
      rounding: Schema.Literals(["half-even", "half-up"]),
      currencies: Schema.Array(Text),
    }),
  ),
  time: Schema.optionalKey(
    Schema.Struct({
      storage: Schema.Literal("utc"),
      display: Schema.Union([Schema.Literals(["org-local", "user-local"]), Text]),
    }),
  ),
  retention: Schema.optionalKey(
    Schema.Record(
      Ident,
      Schema.Struct({ keep: Duration, then: Schema.Literals(["delete", "anonymize"]) }),
    ),
  ),
  personalData: Schema.optionalKey(
    Schema.Record(
      Schema.String.check(
        Schema.isPattern(/^[A-Za-z][A-Za-z0-9_]*\.[A-Za-z][A-Za-z0-9_]*$/, {
          expected: 'an "Entity.field" key',
        }),
      ),
      Schema.Struct({ purpose: Text, readableBy: Schema.Array(Ident) }),
    ),
  ),
});

const State = Schema.Struct({
  on: Schema.optionalKey(Schema.Record(Ident, Ident)),
  terminal: Schema.optionalKey(Schema.Literal(true)),
  timeout: Schema.optionalKey(Schema.Struct({ after: Duration, to: Ident })),
});

/** `spec/*.yaml`: the structured spec, approved clause by clause (CONTRACTS §3). */
export const Spec = Schema.Struct({
  version: Schema.Literal(1),
  id: Text,
  packs: Schema.Array(Schema.Struct({ name: Text, version: SemVer })),
  policies: Policies,
  entities: Schema.Record(
    Ident,
    Schema.Struct({ fields: Schema.Record(Ident, FieldType), key: Schema.Array(Ident) }),
  ),
  roles: Schema.Array(Ident),
  permissions: Schema.Record(
    Ident,
    Schema.Record(Ident, Schema.Union([Schema.Array(Ident), Expr])),
  ),
  commands: Schema.Record(
    Ident,
    Schema.Struct({
      input: Schema.Record(Ident, FieldType),
      actor: Schema.Array(Ident),
      effects: Schema.Array(Text),
      clauses: Schema.Array(ClauseId),
    }),
  ),
  machines: Schema.Record(
    Ident,
    Schema.Struct({ entity: Ident, initial: Ident, states: Schema.Record(Ident, State) }),
  ),
  invariants: Schema.Array(Schema.Struct({ ...ClauseFields, expr: Expr })),
  scenarios: Schema.Array(
    Schema.Struct({
      ...ClauseFields,
      given: Schema.Array(Step),
      when: Schema.Array(Step),
      then: Schema.Array(Expr),
    }),
  ),
  budgets: Schema.Array(
    Schema.Struct({
      ...ClauseFields,
      metric: Text,
      max: Schema.Finite,
      unit: Schema.Literals(["instructions", "bytes", "ms", "count"]),
    }),
  ),
});

/** Decoded spec. */
export type Spec = typeof Spec.Type;
