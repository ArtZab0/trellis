# Component: policy engine + GitHub App (M3)

## Purpose
Turn tier + certificate + area trust state into a merge decision, and enforce it on GitHub.

## Policy
`decide({ tier, certificate?, gateReport, areas: AreaTrust[], constitution, verifierAdvice? }) → Decision`
- `Decision = { kind: "auto-approve" | "needs-human" | "block", reasons: string[], requiredReviewers?: string[] }`
- No certificate → `block`.
- Tier 3 → `needs-human` (two humans if any path matches the security globs).
- Tier 2 → `needs-human`.
- Tier 1 → `auto-approve` only if every touched area is `earned` and `automerge.tier1` is enabled; else `needs-human`. A deterministic sampler (hash of PR number + seed) marks `samplingRate` of auto-approved PRs for later human audit.
- Tier 0 → `auto-approve` if `automerge.tier0`.
- Verifier advice `reject`/`escalate` → upgrade to `needs-human`. It can never downgrade (ADR-0003).
- Breaker open → everything `needs-human`.

Area trust state machine: `supervised → earned` when `earn` criteria hold; `earned → supervised` on any `demoteOn` event. All transitions are logged with the triggering event.

## GitHub App (`apps/github-app` + `packages/github`)
- Webhooks: `pull_request`, `pull_request_review`, `pull_request_review_comment`, `check_suite`, `push`, `merge_group`.
- Posts check runs `trellis/policy` (the gate posts `trellis/gate`). Applies labels `tier:N`, `area:<x>`, `constitution`, `needs-human`.
- Auto-approval is a review by the `trellis-policy` app, only for decisions of kind `auto-approve`.
- Captures review comments and human pushes to agent branches as ledger events (stored via control plane API once M7 lands; JSONL file before that).
- All GitHub calls go through the `CodeHost` service; tests use a recorded fake.

## Acceptance criteria
- **POL-01** Decision table: exhaustive tests over tier × area state × certificate presence × verifier advice × breaker state.
- **POL-02** Property: adding any reason (advice, tier increase, breaker) never produces a more permissive decision (monotonicity).
- **POL-03** Sampling is deterministic and hits `samplingRate` ± 1% over 10,000 synthetic PRs.
- **GH-01** End to end on a scratch repo: a tier 0 PR from the gardener app auto-merges through the merge queue; a tier 2 PR waits for a human.
- **GH-02** An agent app cannot approve its own PR, push to `main`, or modify protected paths (verified against the live scratch repo settings).
- **GH-03** Webhook handling is idempotent (same delivery id twice → one effect).
