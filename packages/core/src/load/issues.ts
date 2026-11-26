import { SchemaIssue } from "effect";

/** One leaf problem found by schema decoding, with its location in the input. */
export interface Problem {
  readonly path: ReadonlyArray<PropertyKey>;
  readonly issue: SchemaIssue.Issue;
}

const format = SchemaIssue.makeFormatterDefault();

/** Flattens an issue tree into leaf problems, each with its full path. */
export const problems = (
  issue: SchemaIssue.Issue,
  path: ReadonlyArray<PropertyKey> = [],
): ReadonlyArray<Problem> => {
  switch (issue._tag) {
    case "Pointer":
      return problems(issue.issue, [...path, ...issue.path]);
    case "Composite":
      return issue.issues.flatMap((child) => problems(child, path));
    case "Encoding":
      return problems(issue.issue, path);
    case "Filter":
    case "MissingKey":
    case "UnexpectedKey":
    case "InvalidType":
    case "InvalidValue":
    case "Forbidden":
    case "AnyOf":
    case "OneOf":
      return [{ path, issue }];
  }
};

/** Renders a path as `adapters.agents[0].runner`. */
export const renderPath = (path: ReadonlyArray<PropertyKey>): string =>
  path.reduce<string>((acc, key) => {
    if (typeof key === "number") return `${acc}[${String(key)}]`;
    const name = String(key);
    return acc === "" ? name : `${acc}.${name}`;
  }, "");

/** The one-line message for a problem. */
export const messageOf = (problem: Problem): string => format(problem.issue).split("\n")[0] ?? "";

/** A one-line suggestion for fixing a problem. */
export const fixOf = (problem: Problem, contract: string): string => {
  const key = String(problem.path.at(-1) ?? "");
  const parent = renderPath(problem.path.slice(0, -1));
  const where = parent === "" ? "at the top level" : `under ${parent}`;
  switch (problem.issue._tag) {
    case "MissingKey":
      return `Add the required key "${key}" ${where}.`;
    case "UnexpectedKey":
      return `Remove "${key}" ${where}, or fix its spelling; it is not part of the ${contract} format.`;
    case "Pointer":
    case "Composite":
    case "Encoding":
    case "Filter":
    case "InvalidType":
    case "InvalidValue":
    case "Forbidden":
    case "AnyOf":
    case "OneOf":
      return `Change ${renderPath(problem.path) || "the file"} so it matches: ${messageOf(problem)}. See docs/CONTRACTS.md (${contract}).`;
  }
};
