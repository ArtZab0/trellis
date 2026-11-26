# ADR-0016: Long-lived area agents; measurements only from the harness

Status: Accepted

## Decision
- The orchestrator supports persistent **area agents**: one long-lived agent session per feature area that keeps context across tasks, handles convergence in construction mode, and does the area's gardening. Sessions are checkpointed and can be restarted from a summary.
- Fresh agents are always used for: verification, evals, honeypots and red-teaming (shared context would weaken independence).
- **Agents never report metrics that steer work.** Performance, size, coverage, agreement and trend numbers come only from gate stages or scheduled benchmark jobs.
- A **scorecard** is posted on a schedule (hourly in construction mode, daily otherwise): each metric next to its previous value, with direction arrows.
- **Push harder**: a reviewer can reopen a task with a higher target (`TaskSpec.target`). The target and outcome are stored so the system learns where ambition was set too low.

## Why
Jarred Sumner found long-lived subagents more effective than short task workflows at large scale, relied on hourly scorecards to keep track, and observed that agents talk themselves into flattering measurements and settle for tiny improvements unless pushed.
