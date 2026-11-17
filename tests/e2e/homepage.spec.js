import { test, expect } from "@playwright/test";

async function mockProductsApi(page) {
  await page.route("**/api/products**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        products: [
          {
            id: "e2e-product-1",
            name: "TriAD E2E Product",
            description: "Product fixture for UI interaction tests",
            price: 250000,
            stock: 10,
            category: "Lunch Box",
            images: ["/images/Logo.png"],
            slug: "triad-e2e-product",
            isActive: true,
            avgRating: 0,
            reviewCount: 0,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      }),
    }),
  );
}

test("homepage should display hero, about, features", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#home h1")).toBeVisible();
  await expect(page.locator("#home img")).toBeVisible();

  await expect(page.locator("#about h3")).toHaveText(/About Us/i);
  await expect(page.locator("#about img").first()).toBeVisible();

  const featuresHeading = page.locator('h2:has-text("Outstanding advantages")');
  await expect(featuresHeading).toBeVisible();

  const featureItems = page.locator(".grid .p-6");
  await expect(featureItems).toHaveCount(4);
});

test("product card purchase action is visible on keyboard focus", async ({ page }) => {
  await mockProductsApi(page);
  await page.goto("/pages/products.html");

  const productCard = page.locator(".product-card").first();
  const addToCartButton = productCard.locator(".add-to-cart-btn");

  await expect(productCard).toBeVisible();
  await addToCartButton.focus();

  await expect(addToCartButton).toBeVisible();
  await expect(addToCartButton).toHaveCSS("opacity", "1");
  await expect(addToCartButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
});

test("product image hover feedback stays subtle", async ({ page }) => {
  await mockProductsApi(page);
  await page.goto("/pages/products.html");

  const productCard = page.locator(".product-card").first();
  const productImage = productCard.locator(".product-image");

  await expect(productImage).toBeVisible();
  await productCard.hover();

  await expect(productImage).toHaveCSS(
    "transform",
    "matrix(1.05, 0, 0, 1.05, 0, 0)",
  );
});
