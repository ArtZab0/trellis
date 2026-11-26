import type { Constitution, Feature } from "@trellis/schema";
import { minimatch } from "minimatch";

/** A risk tier, 0 (lowest) to 3 (highest). */
export type Tier = 0 | 1 | 2 | 3;

const matches = (path: string, globs: ReadonlyArray<string>): boolean =>
  globs.some((glob) => minimatch(path, glob, { dot: true }));

const pathTier = (path: string, constitution: Constitution): Tier => {
  if (matches(path, constitution.paths.tier3)) return 3;
  if (matches(path, constitution.paths.tier2)) return 2;
  if (matches(path, constitution.paths.tier0 ?? [])) return 0;
  return 1;
};

const featureTier = (path: string, features: ReadonlyArray<Feature>): Tier =>
  features.reduce<Tier>(
    (tier, feature) =>
      matches(path, feature.touches?.code ?? []) && feature.tier > tier ? feature.tier : tier,
    0,
  );

const higher = (a: Tier, b: Tier): Tier => (b > a ? b : a);

/**
 * The tier of a change touching `paths`: the highest of each path's constitution tier (tier3,
 * then tier2, then tier0 globs; anything else is 1) and the tier of every feature whose
 * `touches.code` matches it. No paths is tier 0. Adding a path never lowers the result.
 */
export const tierOf = (
  paths: ReadonlyArray<string>,
  constitution: Constitution,
  features: ReadonlyArray<Feature>,
): Tier =>
  paths.reduce<Tier>(
    (tier, path) => higher(tier, higher(pathTier(path, constitution), featureTier(path, features))),
    0,
  );
