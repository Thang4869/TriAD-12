import { defineConfig } from "@playwright/test";

const e2ePort = Number(process.env.E2E_PORT || 3000);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL || `http://localhost:${e2ePort}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --port ${e2ePort}`,
    port: e2ePort,
    reuseExistingServer: false,
  },
});
