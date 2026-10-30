"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const candidates = [
  process.env.TRIAD_BACKEND_PATH
    ? path.resolve(
        process.env.TRIAD_BACKEND_PATH,
        "scripts/reset-fullstack-auth-limit.cjs"
      )
    : null,
  path.resolve(__dirname, "../backend/scripts/reset-fullstack-auth-limit.cjs"),
].filter(Boolean);

const target = candidates.find((candidate) => fs.existsSync(candidate));

if (!target) {
  console.error("Cannot find backend reset-fullstack-auth-limit.cjs");
  process.exit(1);
}

const result = spawnSync(process.execPath, [target], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
