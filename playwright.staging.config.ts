import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/staging",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["line"], ["json", { outputFile: "staging-auth-results.json" }]],
  use: {
    baseURL: "https://triad-staging-three.vercel.app",
    navigationTimeout: 60_000,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
