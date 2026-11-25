# ADR-0004: GitHub first, behind adapters

Status: Accepted

## Decision
- v1 supports GitHub (App + rulesets + merge queue + Actions) only.
- All host-specific code lives behind a `CodeHost` service interface in `packages/github`, so GitLab can be added later without touching core.
- Agent identities are separate GitHub Apps per role (implementer, verifier, gardener, policy), with installation tokens minted per task. No personal access tokens.
- Policy is enforced through required status checks (`trellis/gate`, `trellis/policy`), CODEOWNERS and rulesets, all generated from the constitution by `trellis init` / `trellis github sync`.
