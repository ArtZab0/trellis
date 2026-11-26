import { Constitution, TrellisConfig } from "@trellis/schema";
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
