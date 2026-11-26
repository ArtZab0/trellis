import { Schema } from "effect";
import { Certificate, GateReport } from "./certificate.js";
import { TrellisConfig } from "./config.js";
import { Constitution } from "./constitution.js";
import { EvidenceBundle } from "./evidence.js";
import { Feature } from "./feature.js";
import { LedgerEvent } from "./ledger.js";
import { Baseline, RulePackage } from "./rule.js";
import { Spec } from "./spec.js";
import { TaskSpec } from "./task.js";

/** Every contract in docs/CONTRACTS.md, by the file name stem its JSON Schema is written under. */
export const contractSchemas: ReadonlyArray<{
  readonly stem: string;
  readonly schema: Schema.Top;
}> = [
  { stem: "trellis-config", schema: TrellisConfig },
  { stem: "constitution", schema: Constitution },
  { stem: "spec", schema: Spec },
  { stem: "feature", schema: Feature },
  { stem: "rule-package", schema: RulePackage },
  { stem: "baseline", schema: Baseline },
  { stem: "task-spec", schema: TaskSpec },
  { stem: "ledger-event", schema: LedgerEvent },
  { stem: "evidence-bundle", schema: EvidenceBundle },
  { stem: "certificate", schema: Certificate },
  { stem: "gate-report", schema: GateReport },
];

/** A generated file: its path under `schemas/` and its exact text. */
export interface GeneratedFile {
  readonly file: string;
  readonly text: string;
}

const render = (stem: string, schema: Schema.Top): GeneratedFile => {
  const document = Schema.toJsonSchemaDocument(schema, { onExcessProperty: "error" });
  const definitions = Object.keys(document.definitions).length > 0;
  const json = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: stem,
    ...document.schema,
    ...(definitions ? { $defs: document.definitions } : {}),
  };
  return { file: `${stem}.schema.json`, text: `${JSON.stringify(json, null, 2)}\n` };
};

/** The JSON Schema files `pnpm gen` writes to `schemas/`, derived from the Effect Schemas. */
export const jsonSchemaFiles = (): ReadonlyArray<GeneratedFile> =>
  contractSchemas.map(({ stem, schema }) => render(stem, schema));
