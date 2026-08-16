import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    include: ["tests/**/*.test.js"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/e2e/**",
      "e2e/**",
      "**/*.config.js",
      "**/index.js",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      coverage: {
        exclude: [
          "**/node_modules/**",
          "**/dist/**",
          "**/tests/**",
          "**/*.config.js",
          "**/index.js",
          "**/playwright-report/**",
          "**/e2e/**",
          "**/playwright.config.ts",
          "**/src/shared/services/api.service.js",
          "**/src/shared/types/repository.interface.js",
          "**/src/ui/**",
          "**/src/modules/*/index.js",
        ],
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
