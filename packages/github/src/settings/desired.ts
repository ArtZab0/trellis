import type { Constitution, Feature } from "@trellis/schema";
import type { Access, Label, Ruleset } from "../codehost/types.js";
import { codeownersFor } from "../codeowners.js";

/** The GitHub settings a Trellis project should have (ADR-0004). */
export interface DesiredSettings {
  readonly ruleset: Ruleset;
  readonly labels: ReadonlyArray<Label>;
  readonly codeowners: string;
  readonly appPermissions: Readonly<Record<string, Access>>;
}

/** The checks every PR must pass before merging. */
export const requiredChecks: ReadonlyArray<string> = ["trellis/gate", "trellis/policy"];

/** What the Trellis GitHub App needs: post checks, label and review PRs, read code, sync rulesets. */
export const requiredAppPermissions: Readonly<Record<string, Access>> = {
  administration: "write",
  checks: "write",
  contents: "write",
  issues: "write",
  metadata: "read",
  pull_requests: "write",
};

const fixedLabels: ReadonlyArray<Label> = [
  {
    name: "tier:0",
    color: "0e8a16",
    description: "Mechanical: formatting, approved codemods, docs gardening",
  },
  { name: "tier:1", color: "fbca04", description: "Golden path product work" },
  {
    name: "tier:2",
    color: "d93f0b",
    description: "Cross-cutting: deps, migrations, public API, new feature-map entry",
  },
  {
    name: "tier:3",
    color: "b60205",
    description: "Constitutional: rules, CI, verification, auth, payments, infra",
  },
  {
    name: "constitution",
    color: "b60205",
    description: "Changes to protected paths; human approval required",
  },
  { name: "needs-human", color: "5319e7", description: "Blocked on a human decision" },
];

const areaLabel = (area: string): Label => ({
  name: `area:${area}`,
  color: "c5def5",
  description: `Feature area ${area}`,
});

/**
 * Settings derived from the constitution and feature map: one active ruleset on the default
 * branch, the policy labels plus one `area:<x>` per feature area, generated CODEOWNERS, and the
 * app permissions. The merge queue is off: GitHub offers it only on organization repos.
 */
export const desiredSettings = (
  constitution: Constitution,
  features: ReadonlyArray<Feature>,
): DesiredSettings => {
  const areas = [...new Set(features.map((f) => f.area))].sort();
  return {
    ruleset: {
      name: "trellis",
      enforcement: "active",
      branches: ["~DEFAULT_BRANCH"],
      requiredChecks,
      requiredApprovals: 1,
      requireCodeOwnerReview: true,
      mergeQueue: false,
    },
    labels: [...fixedLabels, ...areas.map(areaLabel)],
    codeowners: codeownersFor(constitution),
    appPermissions: requiredAppPermissions,
  };
};
