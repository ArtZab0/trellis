import { Certificate, EvidenceBundle, GateReport } from "@trellis/schema";
import type { Contract } from "./parse.js";

/** `evidence.json`. */
export const evidenceContract: Contract<EvidenceBundle> = {
  name: "EvidenceBundle",
  version: 1,
  schema: EvidenceBundle,
};

/** `certificate.json`. */
export const certificateContract: Contract<Certificate> = {
  name: "Certificate",
  version: 1,
  schema: Certificate,
};

/** The gate report written for every build. */
export const gateReportContract: Contract<GateReport> = {
  name: "GateReport",
  version: 1,
  schema: GateReport,
};
