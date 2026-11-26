import { Data } from "effect";

/** Where a problem is and how to fix it. Lines and columns are 1-based. */
export interface LoadErrorFields {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly path: string;
  readonly message: string;
  readonly fix: string;
}

/** The file could not be read. */
export class ReadFailed extends Data.TaggedError("ReadFailed")<LoadErrorFields> {}

/** The file is not valid YAML. */
export class InvalidYaml extends Data.TaggedError("InvalidYaml")<LoadErrorFields> {}

/** The file is valid YAML but does not match its contract. */
export class InvalidContract extends Data.TaggedError("InvalidContract")<LoadErrorFields> {}

/** The file declares a `version` this Trellis does not read. */
export class UnsupportedVersion extends Data.TaggedError("UnsupportedVersion")<LoadErrorFields> {}

/** Every way loading a contract file can fail. */
export type LoadError = ReadFailed | InvalidYaml | InvalidContract | UnsupportedVersion;
