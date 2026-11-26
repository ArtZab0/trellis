import { Result, Schema } from "effect";
import { isMap, LineCounter, parseDocument, stringify } from "yaml";
import { InvalidContract, InvalidYaml, type LoadError, UnsupportedVersion } from "./errors.js";
import { fixOf, messageOf, problems, renderPath } from "./issues.js";

/** A contract a loader can read: its schema, its name in docs/CONTRACTS.md, and the version it reads. */
export interface Contract<A> {
  readonly name: string;
  readonly version: number;
  readonly schema: Schema.Codec<A, unknown>;
}

const position = (
  doc: ReturnType<typeof parseDocument>,
  lines: LineCounter,
  path: ReadonlyArray<PropertyKey>,
): { readonly line: number; readonly column: number } => {
  const depths = Array.from({ length: path.length + 1 }, (_, i) => path.length - i);
  for (const depth of depths) {
    const node: unknown = depth === 0 ? doc.contents : doc.getIn(path.slice(0, depth), true);
    if (typeof node === "object" && node !== null && "range" in node && Array.isArray(node.range)) {
      const start: unknown = node.range[0];
      if (typeof start === "number") {
        const { line, col } = lines.linePos(start);
        return { line, column: col };
      }
    }
  }
  return { line: 1, column: 1 };
};

/**
 * Parses a contract file's text. Fails with the first problem in file order, located by line and
 * column, with a one-line fix.
 */
export const parseContract = <A>(
  contract: Contract<A>,
  file: string,
  text: string,
): Result.Result<A, LoadError> => {
  const lines = new LineCounter();
  const doc = parseDocument(text, { lineCounter: lines, uniqueKeys: true });
  const syntax = doc.errors[0];
  if (syntax !== undefined) {
    const at = syntax.linePos?.[0] ?? { line: 1, col: 1 };
    return Result.fail(
      new InvalidYaml({
        file,
        line: at.line,
        column: at.col,
        path: "",
        message: (syntax.message.split("\n")[0] ?? "Invalid YAML").replace(
          / at line \d+, column \d+:$/,
          "",
        ),
        fix: "Fix the YAML syntax at this position.",
      }),
    );
  }
  if (!isMap(doc.contents)) {
    return Result.fail(
      new InvalidContract({
        file,
        line: 1,
        column: 1,
        path: "",
        message: "Expected a YAML mapping at the top level",
        fix: `Write the file as key: value pairs; see docs/CONTRACTS.md (${contract.name}).`,
      }),
    );
  }
  const input: unknown = doc.toJS();
  const declared: unknown = doc.get("version");
  if (typeof declared === "number" && declared !== contract.version) {
    const at = position(doc, lines, ["version"]);
    return Result.fail(
      new UnsupportedVersion({
        file,
        ...at,
        path: "version",
        message: `Unsupported version ${String(declared)}; this Trellis reads ${contract.name} version ${String(contract.version)}`,
        fix: `Upgrade Trellis to a release that reads version ${String(declared)}, or rewrite the file in the version ${String(contract.version)} format (docs/CONTRACTS.md).`,
      }),
    );
  }
  const decoded = Schema.decodeUnknownResult(contract.schema, {
    errors: "all",
    onExcessProperty: "error",
  })(input);
  if (Result.isSuccess(decoded)) return Result.succeed(decoded.success);
  const located = problems(decoded.failure.issue)
    .map((problem) => ({ problem, at: position(doc, lines, problem.path) }))
    .sort((a, b) => a.at.line - b.at.line || a.at.column - b.at.column);
  const first = located[0];
  return Result.fail(
    new InvalidContract({
      file,
      line: first?.at.line ?? 1,
      column: first?.at.column ?? 1,
      path: first === undefined ? "" : renderPath(first.problem.path),
      message: first === undefined ? "Invalid contract" : messageOf(first.problem),
      fix: first === undefined ? "See docs/CONTRACTS.md." : fixOf(first.problem, contract.name),
    }),
  );
};

/** Prints a decoded contract value as YAML that {@link parseContract} reads back unchanged. */
export const printContract = (value: unknown): string => stringify(value);
