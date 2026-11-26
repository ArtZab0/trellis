const allowed = {
  schema: [],
  core: ["schema"],
  rules: ["schema", "core"],
  spec: ["schema", "core"],
  dst: ["schema", "core"],
  features: ["schema", "core"],
  evidence: ["schema", "core"],
  ledger: ["schema", "core"],
  diff: ["schema", "core"],
  "stack-ts": ["schema", "core", "rules"],
  drive: ["schema", "core", "features", "diff"],
};
const analysis = Object.keys(allowed);
allowed.gate = analysis;
for (const pkg of ["github", "orchestrator", "drift", "evals"]) {
  allowed[pkg] = [...analysis, "gate"];
}
allowed.cli = [...analysis, "gate", "github", "orchestrator", "drift", "evals"];

const others = (pkg) =>
  Object.keys(allowed).filter((p) => p !== pkg && !allowed[pkg].includes(p));

module.exports = {
  forbidden: [
    ...Object.keys(allowed).map((pkg) => ({
      name: `${pkg}-allowed-imports`,
      comment: `packages/${pkg} may import only: ${allowed[pkg].join(", ") || "no internal package"} (docs/ARCHITECTURE.md)`,
      severity: "error",
      from: { path: `^packages/${pkg}/` },
      to: { path: `^packages/(${others(pkg).join("|")})/` },
    })),
    {
      name: "nothing-imports-apps",
      comment: "Nothing imports apps/* (docs/ARCHITECTURE.md)",
      severity: "error",
      from: { pathNot: "^apps/" },
      to: { path: "^apps/" },
    },
    {
      name: "node-builtins-only-in-live",
      comment: "Real I/O only in src/live/; everything else gets services through Effect layers (docs/ARCHITECTURE.md)",
      severity: "error",
      from: { path: "^(packages|apps|packs)/[^/]+/src/", pathNot: "^(packages|apps|packs)/[^/]+/src/live/" },
      to: { dependencyTypes: ["core"] },
    },
    {
      name: "no-unresolvable",
      comment: "Every import must resolve, so the rules above can see it",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(dist|node_modules|fixtures)/" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { conditionNames: ["types", "import", "default"] },
  },
};
