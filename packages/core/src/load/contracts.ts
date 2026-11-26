import {
  Baseline,
  Constitution,
  Feature,
  LedgerEvent,
  RulePackage,
  Spec,
  TaskSpec,
  TrellisConfig,
} from "@trellis/schema";
import type { Contract } from "./parse.js";

/** `.trellis/trellis.yaml`. */
export const configContract: Contract<TrellisConfig> = {
  name: "TrellisConfig",
  version: 1,
  schema: TrellisConfig,
};

/** `.trellis/constitution.yaml`. */
export const constitutionContract: Contract<Constitution> = {
  name: "Constitution",
  version: 1,
  schema: Constitution,
};

/** `features/<area>/<name>.yaml`. */
export const featureContract: Contract<Feature> = { name: "Feature", version: 1, schema: Feature };

/** `rules/<id>/rule.yaml`. */
export const ruleContract: Contract<RulePackage> = {
  name: "RulePackage",
  version: 1,
  schema: RulePackage,
};

/** `rules/<id>/baseline.json`. */
export const baselineContract: Contract<Baseline> = {
  name: "Baseline",
  version: 1,
  schema: Baseline,
};

/** `tasks/*.yaml`. */
export const taskContract: Contract<TaskSpec> = { name: "TaskSpec", version: 1, schema: TaskSpec };

/** One line of the ledger JSONL. */
export const ledgerEventContract: Contract<LedgerEvent> = {
  name: "LedgerEvent",
  version: 1,
  schema: LedgerEvent,
};

/** `spec/*.yaml`. */
export const specContract: Contract<Spec> = { name: "Spec", version: 1, schema: Spec };
