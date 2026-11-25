# ADR-0013: Construction mode and maintenance mode

Status: Accepted

## Decision
- **Maintenance mode** (default): small PRs to `main`, each fully gated.
- **Construction mode**: for greenfield builds and full rewrites of an area.
  1. A workstream branch `build/<workstream>` is opened against an approved spec slice.
  2. Many agents commit in parallel; only stages 0–2 run per commit (no full gate), and the PR size guard does not apply on the workstream branch.
  3. Convergence: long-lived area agents fix and drive the code until the full gate passes on the branch.
  4. The branch merges to `main` through the normal policy as a single tier 2 change, and is certified only at that point.
- Constitution files, rules and the gate are never edited on a workstream branch. Any such change is a separate constitution PR to `main`.
- The Trellis repo itself stays in maintenance mode (bootstrap, ADR-0008). Flagships start in construction mode.

## Why
Jarred Sumner's compiler rewrites used up to 140 agents writing code at once, with one build at the end and a separate convergence phase. Per-PR gating during bulk generation wastes time on builds. Construction mode moves when the bar is applied, never the bar itself.
