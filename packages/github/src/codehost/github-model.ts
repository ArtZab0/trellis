import { Schema } from "effect";
import type { Ruleset } from "./types.js";

const PullRequestRule = Schema.Struct({
  type: Schema.Literal("pull_request"),
  parameters: Schema.Struct({
    required_approving_review_count: Schema.Int,
    require_code_owner_review: Schema.Boolean,
  }),
});

const StatusChecksRule = Schema.Struct({
  type: Schema.Literal("required_status_checks"),
  parameters: Schema.Struct({
    required_status_checks: Schema.Array(Schema.Struct({ context: Schema.String })),
  }),
});

const OtherRule = Schema.Struct({ type: Schema.String });

/** A ruleset as GitHub's REST API returns it (`GET /repos/{repo}/rulesets/{id}`), the fields we read. */
export const GitHubRuleset = Schema.Struct({
  id: Schema.Int,
  name: Schema.String,
  target: Schema.String,
  enforcement: Schema.Literals(["active", "evaluate", "disabled"]),
  conditions: Schema.Struct({
    ref_name: Schema.Struct({ include: Schema.Array(Schema.String) }),
  }),
  rules: Schema.Array(Schema.Union([PullRequestRule, StatusChecksRule, OtherRule])),
});

/** Decoded GitHub ruleset. */
export type GitHubRuleset = typeof GitHubRuleset.Type;

/** `GET /repos/{repo}/rulesets`: summaries only. */
export const GitHubRulesetSummaries = Schema.Array(
  Schema.Struct({ id: Schema.Int, name: Schema.String }),
);

/** `GET /repos/{repo}/labels`. */
export const GitHubLabels = Schema.Array(
  Schema.Struct({
    name: Schema.String,
    color: Schema.String,
    description: Schema.NullOr(Schema.String),
  }),
);

/** `GET /repos/{repo}/contents/{path}` for a file. */
export const GitHubFile = Schema.Struct({ sha: Schema.String, content: Schema.String });

/** `GET /repos/{repo}/installation`. */
export const GitHubInstallation = Schema.Struct({
  permissions: Schema.Record(Schema.String, Schema.Literals(["read", "write", "admin"])),
});

/** The merge queue settings Trellis uses when `mergeQueue` is on (ADR-0004). */
export const mergeQueueRule = {
  type: "merge_queue",
  parameters: {
    check_response_timeout_minutes: 60,
    grouping_strategy: "ALLGREEN",
    max_entries_to_build: 5,
    max_entries_to_merge: 5,
    merge_method: "SQUASH",
    min_entries_to_merge: 1,
    min_entries_to_merge_wait_minutes: 0,
  },
};

/** The request body that creates or replaces `ruleset` on GitHub. */
export const toGitHub = (ruleset: Ruleset) => ({
  name: ruleset.name,
  target: "branch",
  enforcement: ruleset.enforcement,
  conditions: { ref_name: { include: [...ruleset.branches], exclude: [] } },
  rules: [
    {
      type: "pull_request",
      parameters: {
        required_approving_review_count: ruleset.requiredApprovals,
        require_code_owner_review: ruleset.requireCodeOwnerReview,
        dismiss_stale_reviews_on_push: true,
        require_last_push_approval: false,
        required_review_thread_resolution: false,
      },
    },
    {
      type: "required_status_checks",
      parameters: {
        strict_required_status_checks_policy: false,
        required_status_checks: ruleset.requiredChecks.map((context) => ({ context })),
      },
    },
    ...(ruleset.mergeQueue ? [mergeQueueRule] : []),
  ],
});

/** Reads a GitHub ruleset back into Trellis's model. Rules Trellis doesn't manage are ignored. */
export const fromGitHub = (github: GitHubRuleset): Ruleset => {
  let requiredApprovals = 0;
  let requireCodeOwnerReview = false;
  let requiredChecks: ReadonlyArray<string> = [];
  let mergeQueue = false;
  for (const rule of github.rules) {
    if ("parameters" in rule && rule.type === "pull_request") {
      requiredApprovals = rule.parameters.required_approving_review_count;
      requireCodeOwnerReview = rule.parameters.require_code_owner_review;
    } else if ("parameters" in rule) {
      requiredChecks = rule.parameters.required_status_checks.map((c) => c.context);
    } else if (rule.type === "merge_queue") {
      mergeQueue = true;
    }
  }
  return {
    name: github.name,
    enforcement: github.enforcement,
    branches: github.conditions.ref_name.include,
    requiredChecks,
    requiredApprovals,
    requireCodeOwnerReview,
    mergeQueue,
  };
};
