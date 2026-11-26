import { Effect, Option } from "effect";
import type { CodeHostShape } from "./codehost.js";
import type { Access, Call, Label, Ruleset } from "./types.js";

/** Starting state for the fake. */
export interface FakeState {
  readonly rulesets?: ReadonlyArray<Ruleset>;
  readonly labels?: ReadonlyArray<Label>;
  readonly files?: Readonly<Record<string, string>>;
  readonly appPermissions?: Readonly<Record<string, Access>>;
}

/** The fake code host plus the log of every mutating call that changed something. */
export interface RecordedFake {
  readonly host: CodeHostShape;
  readonly calls: ReadonlyArray<Call>;
}

const upsert = <A extends { readonly name: string }>(
  items: Map<string, A>,
  item: A,
  record: () => void,
): "created" | "updated" | "unchanged" => {
  const current = items.get(item.name);
  if (current !== undefined && JSON.stringify(current) === JSON.stringify(item)) {
    return "unchanged";
  }
  items.set(item.name, item);
  record();
  return current === undefined ? "created" : "updated";
};

/** An in-memory code host that records each change. Tests and `trellis doctor` fixtures use it. */
export const recordedFake = (repo: string, state: FakeState = {}): RecordedFake => {
  const calls: Array<Call> = [];
  const rulesets = new Map((state.rulesets ?? []).map((r) => [r.name, r]));
  const labels = new Map((state.labels ?? []).map((l) => [l.name, l]));
  const files = new Map(Object.entries(state.files ?? {}));
  const permissions = { ...(state.appPermissions ?? {}) };
  const host: CodeHostShape = {
    repo,
    listRulesets: () => Effect.sync(() => [...rulesets.values()]),
    upsertRuleset: (ruleset) =>
      Effect.sync(() =>
        upsert(rulesets, ruleset, () => calls.push({ op: "upsertRuleset", ruleset })),
      ),
    listLabels: () => Effect.sync(() => [...labels.values()]),
    upsertLabel: (label) =>
      Effect.sync(() => upsert(labels, label, () => calls.push({ op: "upsertLabel", label }))),
    readFile: (path) => Effect.sync(() => Option.fromNullishOr(files.get(path))),
    writeFile: (path, text) =>
      Effect.sync(() => {
        const current = files.get(path);
        if (current === text) return "unchanged";
        files.set(path, text);
        calls.push({ op: "writeFile", path, text });
        return current === undefined ? "created" : "updated";
      }),
    appPermissions: () => Effect.succeed(permissions),
  };
  return { host, calls };
};
