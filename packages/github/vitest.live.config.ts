import { defineConfig } from "vitest/config";

/** The live CodeHost suite: runs only via `pnpm test:live`, never in `pnpm verify`. */
export default defineConfig({
  test: { include: ["test/live/**/*.live.ts"], testTimeout: 60_000, fileParallelism: false },
});
