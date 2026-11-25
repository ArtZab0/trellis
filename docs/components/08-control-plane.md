# Component: control plane (M7; interview UI in M9)

## Purpose
One place where a human spends their minutes: review evidence, teach the system, watch trust.

## Stack
Certified stack: React + Trellis UI kit front end; Effect HTTP API; Postgres; auth via GitHub OAuth (org membership = access). Responsive; every review action works on a 390 px wide screen.

## Screens
1. **Inbox**, ordered: tier 3 → tier 2 → escalated tasks → proposed rules (constitution PRs) → tier 1 audit samples → drift items > 7 days. Each item shows estimated review minutes.
2. **Review item**: replay first (base/head), then property results, perf deltas, statecharts/machine diagrams, spec clauses touched (in plain English), certificate summary; diff last, collapsed. Actions: approve, request change (text or voice note), "make this a rule", demote area.
3. **Replay viewer**: side-by-side synced rrweb (or video fallback); step timeline from the driver; overlays: visual diff heat map, a11y diff, network diff; panes: DOM, console, network, OTel trace for the selected moment. Comment on a frame → PR review comment with a deep link + ledger event `replay-comment`.
4. **Trust dashboard**: metrics from the product spec (escaped defects/100, revert rate, change failure rate, repeated-correction rate, rules vs baselines, verification coverage, mutation score, perf trend, verify share of tokens, cost per certified PR, human minutes per PR, flake rate), per area and overall; breaker state.
5. **Feature map view**: tree of features coloured by trust state and evidence freshness; click-through to latest replay per feature. Shareable read-only link (client/stakeholder view).
6. **Ledger**: correction clusters with counts, status (open → rule drafted → merged), linked PRs.
7. **Daily digest**: email/push: merged by feature, waiting on you (minutes), incidents, spend vs budget, top 3 clusters.
8. **Interview** (M9): see component 05.

## Acceptance criteria
- **CP-01** A tier 2 PR on the example app can be fully reviewed and approved on a phone viewport (Playwright mobile test using the actual app).
- **CP-02** Frame comment creates a PR comment with a link that reopens the viewer at the same frame, and a ledger event with the frame digest.
- **CP-03** Dashboard numbers equal recomputation from raw events (property-tested aggregation).
- **CP-04** Inbox ordering and review-minute estimates are deterministic given the same queue.
- **CP-05** The control plane itself is certified by the gate (it is a certified-stack app).
