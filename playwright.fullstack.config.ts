import { defineConfig } from "@playwright/test";

const frontendPort = Number(process.env.FULLSTACK_E2E_PORT || 3000);

export default defineConfig({
  testDir: "./tests/fullstack",

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: [
    ["line"],
    [
      "html",
      {
        outputFolder: "playwright-fullstack-report",
        open: "never",
      },
    ],
  ],

  use: {
    baseURL:
      process.env.FULLSTACK_E2E_BASE_URL || `http://127.0.0.1:${frontendPort}`,

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
    url: `http://127.0.0.1:${frontendPort}/pages/products.html`,
    reuseExistingServer: !process.env.CI,

    env: {
      VITE_API_BASE_URL: "/api",
      VITE_DEV_API_PROXY_TARGET:
        process.env.FULLSTACK_API_URL || "http://127.0.0.1:5000",
    },
  },
});
