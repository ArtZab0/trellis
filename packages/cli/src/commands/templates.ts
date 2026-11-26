/** Answers `trellis init` fills its templates with. */
export interface InitAnswers {
  readonly name: string;
  readonly repo: string;
  readonly owner: string;
  readonly stack: string;
}

const placeholderImage = `ghcr.io/trellis-dev/gate@sha256:${"0".repeat(64)}`;

/** `.trellis/trellis.yaml`. */
export const configYaml = (a: InitAnswers): string => `version: 1
project: { name: ${a.name}, repo: ${a.repo} }
stack: { pack: ${a.stack}, version: 1.0.0 }
specPacks: []
adapters:
  codeHost: github
  ci: github-actions
  sandbox: docker
  agents:
    - { id: impl, runner: claude-code }
  artifactStore: { kind: s3, endpoint: "https://s3.example.com", bucket: evidence }
mode: maintenance
gate:
  image: "${placeholderImage}"
  seeds: { properties: [1, 2, 3], dst: [7], mutation: 42 }
  bounds: { machineDepth: 12, dstStepsPerSeed: 10000, propertyRuns: 1000 }
  thresholds: { mutation: 0.7, maxPrLines: 400 }
budgets: { usdPerTask: 8, usdPerDay: 100, usdPerMonth: 2000 }
`;

/** `.trellis/constitution.yaml`: human-owned; changes go through a constitution PR. */
export const constitutionYaml = (
  a: InitAnswers,
): string => `# Human-owned policy. Change it only through a PR a human approves.
version: 1
humans: ["${a.owner}"]
paths:
  tier3: [".trellis/**", ".github/**", "CODEOWNERS", "docs/adr/**"]
  tier2: ["package.json", "pnpm-lock.yaml"]
  tier0: ["docs/plans/**"]
trust:
  earn: { consecutiveCleanMerges: 20, minMutationScore: 0.7, require: [properties, spec-clauses] }
  demoteOn: [escaped_defect, revert, incident]
automerge: { tier0: false, tier1: false }
breaker: { revertRate7d: 0.015, escapedPer100: 1.0, changeFailureRate: 0.05, costSpikeMultiple: 2.0 }
dependencies: { allow: [], requireTier: 2 }
uncertifiedZones: []
trends:
  baselineCommits: 50
  erosionMaxIncrease: 0.01
  verbosityMaxIncrease: 0.01
  linesPerClauseMax: 400
  buildSecondsMax: 300
prototypes: { globs: ["prototypes/**"], defaultExpiryDays: 30, flagRequired: true }
markdown:
  agentWritableGlobs: ["docs/plans/**", "docs/questions/**"]
  maxBytesPerFile: 12000
`;

/** `AGENTS.md`: the map agents read first. */
export const agentsMd = (a: InitAnswers): string => `# AGENTS.md: ${a.name}

This repo is managed by Trellis. Read \`ARCHITECTURE.md\`, then \`spec/story.md\`.

- Features: \`features/<area>/<name>.yaml\`
- Spec: \`spec/\` (story in plain English; structured spec approved clause by clause)
- Project rules: \`rules/<id>/\`
- Plans: \`docs/plans/active/\`; decisions: \`docs/adr/\`
- Policy: \`.trellis/constitution.yaml\` is human-owned. Never edit it in a normal PR.
`;

/** `ARCHITECTURE.md`. */
export const architectureMd = (a: InitAnswers): string => `# Architecture: ${a.name}

Describe the layers and which may depend on which. The ${a.stack} stack rules enforce them.
`;

/** `spec/story.md`. */
export const storyMd = (a: InitAnswers): string => `# ${a.name}

Write what this software is for, in plain English: who uses it and what they need to get done.
Trellis turns this into scenarios for you to approve.
`;

/** Directories `trellis init` creates, kept in git with an empty `.gitkeep`. */
export const keptDirs: ReadonlyArray<string> = [
  "features",
  "rules",
  "verify",
  "docs/adr",
  "docs/plans/active",
  "docs/plans/done",
];
