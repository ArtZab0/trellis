import { Schema } from "effect";
import { ClauseId, NonNegative, PositiveCount, Text, Tier } from "./common.js";

/** `tasks/*.yaml`: a task for the orchestrator (CONTRACTS §6). */
export const TaskSpec = Schema.Struct({
  version: Schema.Literal(1),
  id: Text,
  goal: Text,
  features: Schema.Array(Text),
  accept: Schema.Union([Schema.Array(ClauseId), Schema.Array(Text)]),
  tierCeiling: Tier,
  budget: Schema.Struct({ usd: NonNegative, wallMinutes: PositiveCount, attempts: PositiveCount }),
  agent: Schema.optionalKey(Schema.Struct({ runner: Text, model: Schema.optionalKey(Text) })),
  mode: Schema.Literals(["maintenance", "construction"]),
  workstream: Schema.optionalKey(Text),
  areaAgent: Schema.optionalKey(Text),
  target: Schema.optionalKey(Schema.Struct({ metric: Text, value: Schema.Finite, setBy: Text })),
  dependsOn: Schema.optionalKey(Schema.Array(Text)),
});

/** Decoded task spec. */
export type TaskSpec = typeof TaskSpec.Type;
