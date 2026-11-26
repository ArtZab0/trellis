import { createHash } from "node:crypto";

/** `sha256:` digest of a string's UTF-8 bytes. */
export const sha256 = (text: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
