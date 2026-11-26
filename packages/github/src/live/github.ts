import { Effect, Option, Schema } from "effect";
import type { CodeHostShape } from "../codehost/codehost.js";
import {
  fromGitHub,
  GitHubFile,
  GitHubInstallation,
  GitHubLabels,
  GitHubRuleset,
  GitHubRulesetSummaries,
  toGitHub,
} from "../codehost/github-model.js";
import { CodeHostError, type Label, type Ruleset } from "../codehost/types.js";

/** How to reach GitHub for one repo. `appJwt` is needed only for `appPermissions`. */
export interface GitHubOptions {
  readonly repo: string;
  readonly token: string;
  readonly appJwt?: string;
  readonly apiUrl?: string;
}

type Change = "created" | "updated" | "unchanged";

type Method = "GET" | "POST" | "PUT" | "PATCH";

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** The live GitHub adapter: REST calls with `fetch`, responses parsed with Schema. */
export const githubCodeHost = (options: GitHubOptions): CodeHostShape => {
  const api = options.apiUrl ?? "https://api.github.com";
  const base = `${api}/repos/${options.repo}`;

  const call = (
    operation: string,
    method: Method,
    url: string,
    body?: unknown,
    auth = options.token,
  ): Effect.Effect<{ readonly status: number; readonly json: unknown }, CodeHostError> =>
    Effect.tryPromise({
      try: async () => {
        const init: RequestInit = {
          method,
          headers: {
            accept: "application/vnd.github+json",
            authorization: `Bearer ${auth}`,
            "x-github-api-version": "2022-11-28",
            "user-agent": "trellis-cli",
          },
        };
        if (body !== undefined) init.body = JSON.stringify(body);
        const response = await fetch(url, init);
        const text = await response.text();
        const json: unknown = text === "" ? undefined : JSON.parse(text);
        return { status: response.status, json };
      },
      catch: (cause) => new CodeHostError({ operation, message: String(cause) }),
    }).pipe(
      Effect.flatMap((res) =>
        res.status < 400 || (res.status === 404 && method === "GET")
          ? Effect.succeed(res)
          : Effect.fail(
              new CodeHostError({
                operation,
                status: res.status,
                message: `${method} ${url} returned ${String(res.status)}: ${JSON.stringify(res.json)}`,
              }),
            ),
      ),
    );

  const decode =
    <A>(operation: string, schema: Schema.Codec<A, unknown>) =>
    (json: unknown): Effect.Effect<A, CodeHostError> =>
      Schema.decodeUnknownEffect(schema)(json).pipe(
        Effect.mapError((issue) => new CodeHostError({ operation, message: String(issue) })),
      );

  const rulesets = Effect.gen(function* () {
    const list = yield* call("listRulesets", "GET", `${base}/rulesets?per_page=100`);
    const summaries = yield* decode("listRulesets", GitHubRulesetSummaries)(list.json);
    return yield* Effect.forEach(summaries, (s) =>
      call("listRulesets", "GET", `${base}/rulesets/${String(s.id)}`).pipe(
        Effect.flatMap((res) => decode("listRulesets", GitHubRuleset)(res.json)),
      ),
    );
  });

  const upsertRuleset = (ruleset: Ruleset) =>
    Effect.gen(function* () {
      const existing = (yield* rulesets).find((r) => r.name === ruleset.name);
      if (existing === undefined) {
        yield* call("upsertRuleset", "POST", `${base}/rulesets`, toGitHub(ruleset));
        return "created" satisfies Change;
      }
      if (same(fromGitHub(existing), ruleset)) return "unchanged" satisfies Change;
      const url = `${base}/rulesets/${String(existing.id)}`;
      yield* call("upsertRuleset", "PUT", url, toGitHub(ruleset));
      return "updated" satisfies Change;
    });

  const listLabels = () =>
    call("listLabels", "GET", `${base}/labels?per_page=100`).pipe(
      Effect.flatMap((res) => decode("listLabels", GitHubLabels)(res.json)),
      Effect.map((labels) =>
        labels.map(
          (l): Label => ({ name: l.name, color: l.color, description: l.description ?? "" }),
        ),
      ),
    );

  const upsertLabel = (label: Label) =>
    Effect.gen(function* () {
      const existing = (yield* listLabels()).find((l) => l.name === label.name);
      if (existing === undefined) {
        yield* call("upsertLabel", "POST", `${base}/labels`, label);
        return "created" satisfies Change;
      }
      if (same(existing, label)) return "unchanged" satisfies Change;
      const url = `${base}/labels/${encodeURIComponent(label.name)}`;
      yield* call("upsertLabel", "PATCH", url, {
        color: label.color,
        description: label.description,
      });
      return "updated" satisfies Change;
    });

  const getFile = (path: string) =>
    call("readFile", "GET", `${base}/contents/${path}`).pipe(
      Effect.flatMap((res) =>
        res.status === 404
          ? Effect.succeed(Option.none())
          : decode(
              "readFile",
              GitHubFile,
            )(res.json).pipe(
              Effect.map((file) =>
                Option.some({
                  sha: file.sha,
                  text: Buffer.from(file.content, "base64").toString("utf8"),
                }),
              ),
            ),
      ),
    );

  return {
    repo: options.repo,
    listRulesets: () => rulesets.pipe(Effect.map((list) => list.map(fromGitHub))),
    upsertRuleset,
    listLabels,
    upsertLabel,
    readFile: (path) => getFile(path).pipe(Effect.map(Option.map((file) => file.text))),
    writeFile: (path, text, message) =>
      Effect.gen(function* () {
        const current = yield* getFile(path);
        if (Option.isSome(current) && current.value.text === text)
          return "unchanged" satisfies Change;
        const content = Buffer.from(text, "utf8").toString("base64");
        const sha = Option.isSome(current) ? { sha: current.value.sha } : {};
        yield* call("writeFile", "PUT", `${base}/contents/${path}`, { message, content, ...sha });
        return Option.isSome(current) ? ("updated" satisfies Change) : ("created" satisfies Change);
      }),
    appPermissions: () =>
      options.appJwt === undefined
        ? Effect.fail(
            new CodeHostError({
              operation: "appPermissions",
              message: "Reading app permissions needs the Trellis GitHub App's JWT (appJwt).",
            }),
          )
        : call("appPermissions", "GET", `${base}/installation`, undefined, options.appJwt).pipe(
            Effect.flatMap((res) => decode("appPermissions", GitHubInstallation)(res.json)),
            Effect.map((installation) => installation.permissions),
          ),
  };
};
