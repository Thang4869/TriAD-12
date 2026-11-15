import { readdir, readFile } from "node:fs/promises";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

function emitPagePartials() {
  return {
    name: "emit-page-partials",
    apply: "build",
    async generateBundle() {
      const pagesDirectory = resolve(import.meta.dirname, "pages");
      const pageFiles = await readdir(pagesDirectory);
      const partialFiles = pageFiles.filter((file) =>
        file.endsWith("-content.html"),
      );

      for (const file of partialFiles) {
        this.emitFile({
          type: "asset",
          fileName: `pages/${file}`,
          source: await readFile(resolve(pagesDirectory, file), "utf8"),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), emitPagePartials()],
  base: "./",

  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        verifyEmail: resolve(import.meta.dirname, "verify-email.html"),
        about: resolve(import.meta.dirname, "pages/about.html"),
        blog: resolve(import.meta.dirname, "pages/blog.html"),
        blogDetail: resolve(import.meta.dirname, "pages/blog-detail.html"),
        contact: resolve(import.meta.dirname, "pages/contact.html"),
        location: resolve(import.meta.dirname, "pages/location.html"),
        privacyPolicy: resolve(
          import.meta.dirname,
          "pages/privacy-policy.html",
        ),
        products: resolve(import.meta.dirname, "pages/products.html"),
        reviews: resolve(import.meta.dirname, "pages/reviews.html"),
        termsOfService: resolve(
          import.meta.dirname,
          "pages/terms-of-service.html",
        ),
        adminDashboard: resolve(
          import.meta.dirname,
          "pages/admin-dashboard.html",
        ),
        adminProducts: resolve(import.meta.dirname, "pages/admin-products.html"),
        adminManagement: resolve(import.meta.dirname, "pages/admin-management.html"),
        orderHistory: resolve(import.meta.dirname, "pages/order-history.html"),
        orderDetail: resolve(import.meta.dirname, "pages/order-detail.html"),
        profile: resolve(import.meta.dirname, "pages/profile.html"),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    // Chạy backend cục bộ ở http://localhost:5000 (npm run dev trong repo DNEK).
    // Khi đó frontend chỉ cần gọi fetch("/api/...") như bình thường, Vite sẽ
    // tự forward sang backend, khỏi lo CORS lúc phát triển.
    // Trên Vercel staging, dùng VITE_API_BASE_URL=/api và rewrite trong
    // vercel.json để giữ request và cookie cùng origin với frontend.
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
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
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

        "**/*.html",
        "**/src/modules/admin/**",
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
