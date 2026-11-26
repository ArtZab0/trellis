import { Effect, Option } from "effect";
import type { CodeHostShape } from "../codehost/codehost.js";
import type { Access, CodeHostError } from "../codehost/types.js";
import type { DesiredSettings } from "./desired.js";

/** One setting on the code host that differs from what the project wants. */
export interface Drift {
  readonly kind: "ruleset" | "required-check" | "label" | "codeowners" | "app-permissions";
  readonly subject: string;
  readonly detail: string;
  /** `false` when only a human can fix it (app permissions are granted on GitHub, not by API). */
  readonly fixable: boolean;
}

const rank: Readonly<Record<Access, number>> = { read: 1, write: 2, admin: 3 };

const rulesetDrift = (host: CodeHostShape, want: DesiredSettings) =>
  host.listRulesets().pipe(
    Effect.map((rulesets): ReadonlyArray<Drift> => {
      const have = rulesets.find((r) => r.name === want.ruleset.name);
      if (have === undefined) {
        return [{ kind: "ruleset", subject: want.ruleset.name, detail: "missing", fixable: true }];
      }
      const missing = want.ruleset.requiredChecks.filter((c) => !have.requiredChecks.includes(c));
      const checks = missing.map(
        (check): Drift => ({
          kind: "required-check",
          subject: check,
          detail: `not required by ruleset ${have.name}`,
          fixable: true,
        }),
      );
      const rest = { ...have, requiredChecks: want.ruleset.requiredChecks };
      const other: ReadonlyArray<Drift> =
        JSON.stringify(rest) === JSON.stringify(want.ruleset)
          ? []
          : [
              {
                kind: "ruleset",
                subject: have.name,
                detail:
                  "differs (enforcement, branches, approvals, code-owner review or merge queue)",
                fixable: true,
              },
            ];
      return [...checks, ...other];
    }),
  );

const labelDrift = (host: CodeHostShape, want: DesiredSettings) =>
  host.listLabels().pipe(
    Effect.map((labels) =>
      want.labels.flatMap((label): ReadonlyArray<Drift> => {
        const have = labels.find((l) => l.name === label.name);
        if (have === undefined)
          return [{ kind: "label", subject: label.name, detail: "missing", fixable: true }];
        return JSON.stringify(have) === JSON.stringify(label)
          ? []
          : [
              {
                kind: "label",
                subject: label.name,
                detail: "colour or description differs",
                fixable: true,
              },
            ];
      }),
    ),
  );

const codeownersDrift = (host: CodeHostShape, want: DesiredSettings) =>
  host.readFile("CODEOWNERS").pipe(
    Effect.map(
      (file): ReadonlyArray<Drift> =>
        Option.isSome(file) && file.value === want.codeowners
          ? []
          : [
              {
                kind: "codeowners",
                subject: "CODEOWNERS",
                detail: Option.isSome(file) ? "does not match the constitution" : "missing",
                fixable: true,
              },
            ],
    ),
  );

const permissionDrift = (host: CodeHostShape, want: DesiredSettings) =>
  host.appPermissions().pipe(
    Effect.map((have) =>
      Object.entries(want.appPermissions).flatMap(([name, access]): ReadonlyArray<Drift> => {
        const held = have[name];
        return held !== undefined && rank[held] >= rank[access]
          ? []
          : [
              {
                kind: "app-permissions",
                subject: name,
                detail: `needs ${access}, has ${held ?? "none"}`,
                fixable: false,
              },
            ];
      }),
    ),
    Effect.catch((error: CodeHostError) =>
      Effect.succeed<ReadonlyArray<Drift>>([
        {
          kind: "app-permissions",
          subject: "app",
          detail: `could not read app permissions: ${error.message}`,
          fixable: false,
        },
      ]),
    ),
  );

/** Every drifted setting, in a fixed order: ruleset, required checks, labels, CODEOWNERS, app. */
export const findDrift = (
  host: CodeHostShape,
  want: DesiredSettings,
): Effect.Effect<ReadonlyArray<Drift>, CodeHostError> =>
  Effect.all([
    rulesetDrift(host, want),
    labelDrift(host, want),
    codeownersDrift(host, want),
    permissionDrift(host, want),
  ]).pipe(Effect.map((groups) => groups.flat()));

/** What `apply` changed: one line per create or update. */
export interface Applied {
  readonly subject: string;
  readonly change: "created" | "updated";
}

/** Applies the fixable settings. Running it twice changes nothing the second time (CLI-03). */
export const applySettings = (
  host: CodeHostShape,
  want: DesiredSettings,
): Effect.Effect<ReadonlyArray<Applied>, CodeHostError> =>
  Effect.gen(function* () {
    const results: Array<readonly [string, "created" | "updated" | "unchanged"]> = [];
    results.push([`ruleset ${want.ruleset.name}`, yield* host.upsertRuleset(want.ruleset)]);
    for (const label of want.labels) {
      results.push([`label ${label.name}`, yield* host.upsertLabel(label)]);
    }
    const message = "Update CODEOWNERS from .trellis/constitution.yaml (trellis github sync)";
    results.push(["CODEOWNERS", yield* host.writeFile("CODEOWNERS", want.codeowners, message)]);
    return results.flatMap(([subject, change]) =>
      change === "unchanged" ? [] : [{ subject, change }],
    );
  });
