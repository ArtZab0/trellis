# ADR-0014: Trend gates against slow decay

Status: Accepted

## Decision
- A `trend` gate stage computes, for the certified zones: erosion (share of total complexity concentrated in the most complex functions, following SlopCodeBench's structural-erosion idea), verbosity (duplicated and redundant code), lines per approved spec clause, and build time in the pinned image.
- The baseline is computed deterministically from the last `trends.baselineCommits` commits on `main` (recomputed from git, not read from a database), so the stage stays reproducible.
- A PR fails if it increases erosion or verbosity beyond the allowed delta, or exceeds `linesPerClauseMax` or `buildSecondsMax`. A trend breach also raises the PR to tier 2.
- Exact metric definitions live in `packages/gate/src/stages/trend/METRICS.md` and are a constitution file.

## Why
SlopCodeBench shows agents pass checkpoints while codebases erode and bloat; in its results erosion rose in 80% of trajectories and verbosity in 89.8%, and prompting reduced initial slop but did not stop long-horizon degradation. A gate that looks at one commit at a time can miss this.
