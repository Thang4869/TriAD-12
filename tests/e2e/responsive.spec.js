import { test, expect } from "@playwright/test";

const viewports = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

test("homepage and product catalog fit common responsive viewports", async ({
  page,
}) => {
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      json: {
        data: {
          products: [],
          total: 0,
          page: 1,
          limit: 12,
          totalPages: 0,
        },
      },
    });
  });

  for (const path of ["/", "/pages/products.html"]) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await expect(page.locator("#main-header")).toBeVisible();

      const documentWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );

      expect(
        documentWidth,
        `Unexpected horizontal overflow on ${path} at ${viewport.width}px`,
      ).toBeLessThanOrEqual(viewport.width);
    }
  }
});
