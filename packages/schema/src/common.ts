import { Schema } from "effect";

/** A non-empty string. */
export const Text = Schema.String.check(Schema.isMinLength(1));

/** A glob pattern matched against repo-relative paths. */
export const Glob = Text;

/** A finite number that is zero or more. */
export const NonNegative = Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0));

/** A whole number that is zero or more. */
export const Count = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

/** A whole number that is one or more. */
export const PositiveCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(1));

/** A ratio between 0 and 1 inclusive. */
export const Ratio = Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 }));

/** A semantic version such as `1.4.0`. */
export const SemVer = Schema.String.check(
  Schema.isPattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, { expected: "a semver such as 1.4.0" }),
);

/** A container image reference pinned by digest. */
export const PinnedImage = Schema.String.check(
  Schema.isPattern(/^[^\s@]+@sha256:[0-9a-f]{64}$/, {
    expected: "an image pinned by digest, such as ghcr.io/org/img@sha256:<64 hex>",
  }),
);

/** A risk tier: 0 (lowest) to 3 (highest). */
export const Tier = Schema.Literals([0, 1, 2, 3]);

/** A spec clause id such as `INV-balanced` or `SC-late-cancel`. */
export const ClauseId = Schema.String.check(
  Schema.isPattern(/^[A-Z][A-Z0-9]*-[A-Za-z0-9._-]+$/, {
    expected: 'a clause id such as "INV-balanced"',
  }),
);
