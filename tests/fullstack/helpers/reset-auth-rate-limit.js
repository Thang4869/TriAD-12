import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const resetScript = path.join(
  frontendRoot,
  "scripts/reset-fullstack-auth-limit.cjs",
);

export const resetFullstackAuthRateLimit = () => {
  const result = spawnSync(process.execPath, [resetScript], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Fullstack auth rate-limit reset failed (exit ${result.status ?? "unknown"})`,
    );
  }
};
