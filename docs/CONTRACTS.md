# Contracts (frozen — v0)

These are the file formats and core types every ring depends on. Implement them in
`packages/schema` as Effect Schema definitions; JSON Schema files are generated from those.
Types below are written as TypeScript for readability. `?` means optional. All files are YAML
unless noted. Every file carries `version`, and loaders reject unknown versions.

Changing anything here requires an ADR approved by a human.

---

## 1. `.trellis/trellis.yaml` — project config

```ts
type TrellisConfig = {
  version: 1
  project: { name: string; repo: string }               // "owner/name"
  stack: { pack: string; version: string }               // "stack-ts-v1", semver
  specPacks: Array<{ name: string; version: string }>
  adapters: {
    codeHost: "github"
    ci: "github-actions"
    sandbox: "docker" | "e2b" | "modal" | "firecracker"
    agents: Array<{ id: string; runner: "claude-code" | "codex" | "cursor" | "openhands"; model?: string }>
    artifactStore: { kind: "s3"; endpoint: string; bucket: string }
    flags?: { kind: "openfeature"; provider: string }
    telemetry?: { kind: "otel"; endpoint: string }
  }
  mode: "maintenance" | "construction"                   // default "maintenance"; see ADR-0013
  references?: Array<{                                   // reference implementations for differential testing (ADR-0012)
    id: string                                           // "ceph-rgw", "beancount"
    image: string                                        // pinned by digest
    protocol: "s3" | "http" | "cli" | "file-format"
    generators: string[]                                 // generator module paths
    allowlist: string                                    // path to reviewed difference allowlist (constitution-protected)
    minInputs: number                                    // inputs per gate run
  }>
  gate: {
    image: string                                        // container image pinned by digest: "ghcr.io/...@sha256:..."
    seeds: { properties: number[]; dst: number[]; mutation: number }
    bounds: { machineDepth: number; dstStepsPerSeed: number; propertyRuns: number }
    thresholds: { mutation: number; maxPrLines: number }
  }
  budgets: { usdPerTask: number; usdPerDay: number; usdPerMonth: number }
}
```

## 2. `.trellis/constitution.yaml` — human-owned policy

```ts
type Constitution = {
  version: 1
  humans: string[]                                       // GitHub logins or teams: "@org/core"
  paths: { tier3: Glob[]; tier2: Glob[]; tier0?: Glob[] } // anything unmatched = tier 1
  trust: {
    earn: { consecutiveCleanMerges: number; minMutationScore: number; require: Array<"driver" | "properties" | "spec-clauses"> }
    demoteOn: Array<"escaped_defect" | "revert" | "incident">
  }
  automerge: {
    tier0: boolean
    tier1: { whenArea: "earned"; samplingRate: number } | false
  }
  breaker: {
    revertRate7d: number; escapedPer100: number; changeFailureRate: number; costSpikeMultiple: number
  }
  dependencies: { allow: string[]; requireTier: 2 | 3 }  // package names; anything else is blocked
  uncertifiedZones: Glob[]
  trends: {                                              // ADR-0014; computed against main's history
    baselineCommits: number                              // window of main commits used as baseline (default 50)
    erosionMaxIncrease: number                           // allowed increase in erosion score per PR (e.g. 0.01)
    verbosityMaxIncrease: number
    linesPerClauseMax: number                            // certified-zone lines / approved clauses
    buildSecondsMax: number                              // measured in the pinned image
  }
  prototypes: { globs: Glob[]; defaultExpiryDays: number; flagRequired: true }
  markdown: { agentWritableGlobs: Glob[]; maxBytesPerFile: number }
}
type Glob = string
```

## 3. Structured spec — `spec/*.yaml`

The most important novel format. Story text is `spec/story.md` (plain English, user-owned).
The structured spec is generated and edited by the system and is approved clause by clause.

```ts
type Spec = {
  version: 1
  id: string
  packs: Array<{ name: string; version: string }>
  policies: {
    money?: { minorUnits: true; rounding: "half-even" | "half-up"; currencies: string[] }
    time?: { storage: "utc"; display: "org-local" | "user-local" | string }
    retention?: Record<EntityName, { keep: Duration; then: "delete" | "anonymize" }>
    personalData?: Record<`${EntityName}.${string}`, { purpose: string; readableBy: RoleName[] }>
  }
  entities: Record<EntityName, {
    fields: Record<string, FieldType>
    key: string[]
  }>
  roles: RoleName[]
  permissions: Record<EntityName, Record<Action, RoleName[] | Condition>>   // Action = "create" | "read" | "update" | "delete" | custom command name
  commands: Record<string, { input: Record<string, FieldType>; actor: RoleName[]; effects: string[]; clauses: ClauseId[] }>
  machines: Record<string, {
    entity: EntityName
    initial: string
    states: Record<string, { on?: Record<string, string>; terminal?: true; timeout?: { after: Duration; to: string } }>
  }>
  invariants: Array<Clause & { expr: Expr }>
  scenarios: Array<Clause & { given: Step[]; when: Step[]; then: Expr[] }>
  budgets: Array<Clause & { metric: string; max: number; unit: "instructions" | "bytes" | "ms" | "count" }>
}

type Clause = {
  id: ClauseId                     // "INV-balanced", "SC-late-cancel", "BUD-recalc"
  says: string                     // plain English shown to the user
  source: "user" | `pack:${string}` | "default" | "redteam" | "incident"
  approval?: { by: string; at: string; via: "scenario-replay" | "prototype" | "text" }
}

type FieldType =
  | "Id" | "Text" | "Bool" | "Int" | "Decimal" | "Money" | "Currency" | "Instant" | "Date" | "Duration" | "Email" | "Url"
  | { enum: string[] } | { ref: EntityName } | { list: FieldType } | { optional: FieldType }
  | { type: "Text"; min?: number; max?: number; pattern?: string } | { type: "Int" | "Decimal" | "Money"; min?: number; max?: number }

type Step = { do: string; as?: RoleName; with?: Record<string, unknown> } | { at: string /* simulated time */ }
```

### Expression language (`Expr`)

A small, total, side-effect-free language so expressions compile to **both** a runtime predicate
(for properties, scenarios, DST invariants) **and** SMT (Z3) for consistency checks.

```
expr    := quant | logic
quant   := ("forall" | "exists") ident "in" Entity [ "where" logic ] ":" logic
logic   := cmp (("and" | "or" | "implies") cmp)* | "not" logic
cmp     := term (("==" | "!=" | "<" | "<=" | ">" | ">=" | "in") term)?
term    := literal | path | agg | "(" expr ")" | term ("+" | "-" | "*") term
agg     := ("sum" | "count" | "min" | "max") "(" path [ "where" logic ] [ "," path ] ")"
path    := ident ("." ident)*
```

No division, no recursion, no user-defined functions in v0. `Money` arithmetic is exact (minor units).
Expressions outside the SMT-encodable fragment are still checked at runtime and are reported as
"runtime-only" by the consistency checker (never silently skipped).

## 4. Feature map — `features/<area>/<name>.yaml`

```ts
type Feature = {
  version: 1
  id: string                                // "projects.export"
  title: string
  area: string
  tier: 0 | 1 | 2 | 3
  owner: string
  entry: { route?: string; command?: string; endpoint?: string; path?: string[] }
  driver?: string                           // path to driver module
  clauses: ClauseId[]                       // spec clauses this feature realizes
  properties: Array<{ id: string; says: string; impl: string }>  // impl = "path#export" or "stack:<id>"
  budgets?: Array<{ metric: string; max: number }>
  touches?: { code: Glob[]; data: string[] }
  flags?: string[]
  dependsOn?: string[]
}
```

## 5. Rule package — `rules/<id>/rule.yaml` (+ files)

```ts
type RulePackage = {
  version: 1
  id: string                                // kebab-case, unique per pack/project
  kind: "api-ban" | "boundary" | "structure" | "semantic" | "ratchet" | "type" | "comment" | "suppression"
  engine: "eslint" | "ast-grep" | "semgrep" | "dependency-cruiser" | "trellis"
  scope: { include: Glob[]; exclude?: Glob[] }
  tier: 0 | 1 | 2 | 3                       // tier raised for PRs that touch matches
  message: string                           // path to message.md
  fixtures: { bad: string; good: string }   // dirs; both required
  codemod?: string
  baseline?: string                         // baseline.json path
  origin?: string[]                         // ledger event ids
}
// baseline.json
type Baseline = { version: 1; rule: string; count: number; locations: Array<{ file: string; hash: string }> }
```

## 6. Task spec — `tasks/*.yaml` and orchestrator API

```ts
type TaskSpec = {
  version: 1
  id: string
  goal: string
  features: string[]
  accept: ClauseId[] | string[]
  tierCeiling: 0 | 1 | 2 | 3
  budget: { usd: number; wallMinutes: number; attempts: number }
  agent?: { runner: string; model?: string }
  mode: "maintenance" | "construction"
  workstream?: string                       // construction mode: the workstream branch the task writes to
  areaAgent?: string                        // id of a long-lived area agent to route to (ADR-0016)
  target?: { metric: string; value: number; setBy: string }   // "push harder" targets
  dependsOn?: string[]
}
type TaskResult = {
  taskId: string; status: "succeeded" | "failed" | "escalated"
  branch?: string; pr?: number; bundle?: Digest; trajectory: Digest; costUsd: number
}
```

## 7. Ledger event — JSONL

```ts
type LedgerEvent = {
  version: 1
  id: string                                // ULID
  at: string                                // ISO instant
  kind: "review-comment" | "human-edit" | "revert" | "escaped-defect" | "incident" | "verifier-reject" | "reprompt" | "replay-comment" | "drift"
  repo: string; pr?: number; commit?: string; feature?: string; area?: string
  text: string                              // the correction, verbatim
  diff?: string                             // for human-edit: agent version → final
  cluster?: string
  resolution?: { kind: "api" | "rule" | "property" | "prose" | "wontfix"; ref: string }
}
```

## 8. Evidence bundle — `evidence.json`

```ts
type EvidenceBundle = {
  version: 1
  repo: string; pr?: number; base: Sha; head: Sha; task?: string
  tier: { value: 0 | 1 | 2 | 3; reasons: string[] }
  features: { named: string[]; impacted: string[] }
  stages: Record<StageName, { verdict: "pass" | "fail" | "skipped"; detail: Digest }>
  runs: Array<{
    feature: string; side: "base" | "head"; seed: number
    artifacts: { video?: Digest; rrweb?: Digest; trace?: Digest; screenshots: Digest[]; perf?: Digest }
    properties: Array<{ id: string; verdict: "pass" | "fail"; counterexample?: Digest }>
  }>
  diffs: Array<{ feature: string; kind: "visual" | "structural" | "behavioral" | "perf"; expected: boolean; detail: Digest }>
  verifier?: { runner: string; model: string; verdict: "approve" | "reject" | "escalate"; notes: string }   // advisory, never gating
  cost: { usd: number; tokensIn: number; tokensOut: number; verifyShare: number }
}
type Digest = `sha256:${string}`
```

## 9. Certificate — `certificate.json` (signed)

```ts
type Certificate = {
  version: 1
  subject: { repo: string; commit: Sha; artifact?: Digest }
  inputs: { image: Digest; lockfile: Digest; configDigest: Digest; specDigest: Digest; constitutionDigest: Digest }
  bounds: { propertySeeds: number[]; propertyRuns: number; dstSeeds: number[]; dstSteps: number; machineDepth: number }
  results: Record<StageName, { verdict: "pass"; summary: Record<string, number | string> }>
  traceability: { clauses: number; clausesChecked: number; codeUnits: number; codeUnitsTraced: number }
  checks: {                                 // ADR-0011: only independent origins count toward the guarantee
    byOrigin: Record<CheckOrigin, { count: number; passed: number }>
    independentShare: number                // independent checks / all checks
  }
  differential?: Array<{ reference: string; inputs: number; differences: number; allowlisted: number }>
  trends: { erosion: number; verbosity: number; linesPerClause: number; buildSeconds: number; baselineCommit: Sha }
  uncertified: { zones: Glob[]; lines: number }
  issuedAt: string                          // set by signer, excluded from the reproducibility hash
  reproHash: Digest                         // sha256 over everything except issuedAt and signature
}
// Signature: Sigstore keyless (GitHub OIDC) as a DSSE envelope next to the file.
type StageName = "classify" | "static" | "stack-rules" | "trend" | "spec-lints" | "spec-consistency" | "traceability"
  | "unit" | "properties" | "machines" | "dst" | "mutation" | "perf" | "build" | "verify-runs" | "differential" | "policy"

type CheckOrigin =
  | "spec-generated"        // compiled by Trellis from approved clauses — independent
  | "external-suite"        // e.g. Ceph s3-tests, pinned by digest — independent
  | "reference"             // differential testing against a reference implementation — independent
  | "human"                 // written or approved by a human through a constitution PR — independent
  | "implementer"           // written by the agent that wrote the code under test — advisory only
```

Origin is computed, not declared: a test file's origin is `implementer` unless it is generated
output of the spec compiler (content hash matches), comes from a pinned external suite, is a
differential run, or was last changed in a commit approved through a `constitution` PR.
Implementer tests still run and their failures block the PR.

A certificate exists only if every stage is `pass`. Failing builds get a `GateReport` with the same
shape, where verdicts may be `fail`, and no signature.
