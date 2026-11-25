# Trellis handoff package

This folder is the seed of the Trellis repository and the build contract for the coding agents.

## How to use it
1. Create an empty GitHub repo (e.g. `trellis`), copy this folder's contents into it, commit to `main`.
2. Replace `@OWNER` in `.trellis/constitution.yaml` with your GitHub login.
3. Turn on branch protection for `main` manually for now: require PRs, require code-owner review.
   (`trellis github sync` takes this over in M1.)
4. Point each coding agent at the repo with this instruction:

   > Read `HANDOFF.md` and follow it. Pick the next unblocked task from `tasks/backlog.yaml`.

5. Review PRs. Your approval is required on every PR until M3; after that the gate and policy do the routine part.

## Contents
| Path | What |
|---|---|
| `HANDOFF.md` | Mission, non-negotiable rules, bootstrap, protocol, definition of done |
| `AGENTS.md` | Repo map for agents |
| `docs/ARCHITECTURE.md` | Rings, packages, dependency rules, determinism boundary |
| `docs/CONTRACTS.md` | Frozen file formats and types |
| `docs/adr/` | Decisions 0001–0016 (0010 licensing awaits your call; 0015 needs a license check) |
| `docs/MILESTONES.md` | M0–M9 with exit criteria |
| `docs/components/` | Per-component specs with acceptance criteria ids |
| `docs/FLAGSHIPS.md` | Example app, S3 store, accounting app requirements |
| `tasks/backlog.yaml` | 36 ready tasks covering M0–M3 |
| `.trellis/constitution.yaml` | This repo's own constitution |

## Decisions waiting on you
- ADR-0010 licensing (proposal: Apache-2.0 core, AGPL control plane).
- Which GitHub org/account hosts the repo and the four agent apps.
- The scratch GitHub repo used for live integration tests (M1-08, M3-08).
- Confirm the anti-slop rule set's license is compatible before agents vendor it (ADR-0015, task M2-09).
