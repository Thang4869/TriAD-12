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
    // Chạy backend cục bộ ở http://localhost:5000 (npm run dev trong repo DNEK).
    // Khi đó frontend chỉ cần gọi fetch("/api/...") như bình thường, Vite sẽ
    // tự forward sang backend, khỏi lo CORS lúc phát triển.
    // Trên production (Vercel), bỏ qua proxy này - dùng VITE_API_BASE_URL
    // trỏ thẳng tới domain backend trên Render (xem .env.example).
    proxy: {
      "/api": {
        target:
          process.env.VITE_DEV_API_PROXY_TARGET || "http://localhost:5000",
        changeOrigin: true,
      },
    },
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
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
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
        "**/src/shared/types/**",
        "**/src/ui/**",

        "**/src/modules/*/index.js",
        "**/src/shared/models/index.js",
        "**/src/index.js",
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
