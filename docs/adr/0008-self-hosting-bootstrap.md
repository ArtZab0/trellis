# ADR-0008: Self-hosting bootstrap

Status: Accepted

| Milestone | This repo's merge policy |
|---|---|
| M0–M1 | Plain CI; human approves every PR; CODEOWNERS protects `docs/CONTRACTS.md`, `docs/adr/`, `.trellis/`, `.github/` |
| M2 | Stack rules + suppression ban required |
| M3 | `trellis/gate` + `trellis/policy` required; certificate published per merge to `main` |
| M6 | Evidence bundles required |
| M8 | Agent fleet builds Trellis via the orchestrator; Tier 0 auto-merge per package once a human enables it |

The gate that checks a PR is always the gate from `main`, never the PR's own version, so a PR cannot weaken the gate that judges it.
