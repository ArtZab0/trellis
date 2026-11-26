import { sha256 } from "./live/sha256.js";
import type { Certificate, GateReport } from "./certificate.js";

export { sha256 };

/** JSON values as canonical JSON sees them. */
export type Canonicalizable =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<Canonicalizable>
  | { readonly [key: string]: Canonicalizable | undefined };

const isList = (value: Canonicalizable): value is ReadonlyArray<Canonicalizable> =>
  Array.isArray(value);

/**
 * Canonical JSON: object keys sorted by code unit, no whitespace, absent keys dropped, arrays in
 * order, `-0` printed as `0`. Equal values always print to the same string.
 */
export const canonicalJson = (value: Canonicalizable): string => {
  if (typeof value === "number") return JSON.stringify(Object.is(value, -0) ? 0 : value);
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (isList(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.keys(value)
    .sort()
    .flatMap((key) => {
      const item = value[key];
      return item === undefined ? [] : [`${JSON.stringify(key)}:${canonicalJson(item)}`];
    });
  return `{${entries.join(",")}}`;
};

/**
 * The reproducibility hash: sha256 of the canonical JSON of everything except `issuedAt` and
 * `reproHash` itself. Signatures live in a separate envelope and are never part of the input.
 */
export const reproHash = (
  certificate: Omit<Certificate | GateReport, "issuedAt" | "reproHash"> & {
    readonly issuedAt?: string;
    readonly reproHash?: string;
  },
): `sha256:${string}` => {
  return sha256(canonicalJson({ ...certificate, issuedAt: undefined, reproHash: undefined }));
};
