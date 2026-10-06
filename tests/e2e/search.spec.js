import { test, expect } from "@playwright/test";

const products = [
  {
    id: "product-1",
    name: "Premium Lunch Box 1000ml",
    description: "A test product",
    price: 100000,
    stock: 10,
    category: "Lunch Box",
    images: [],
    slug: "premium-lunch-box-1000ml",
    isActive: true,
  },
  {
    id: "product-2",
    name: "Compact Lunch Box 500ml",
    description: "Another test product",
    price: 80000,
    stock: 10,
    category: "Lunch Box",
    images: [],
    slug: "compact-lunch-box-500ml",
    isActive: true,
  },
];

test("should search for product and show suggestions", async ({ page }) => {
  await page.route("**/api/products**", async (route) => {
    const url = new URL(route.request().url());
    const keyword = url.searchParams.get("keyword")?.toLowerCase() || "";

    const filtered = keyword
      ? products.filter((product) =>
          product.name.toLowerCase().includes(keyword),
        )
      : products;

    await route.fulfill({
      json: {
        data: {
          products: filtered,
          total: filtered.length,
          page: 1,
          limit: 12,
          totalPages: 1,
        },
      },
    });
  });

  await page.goto("/pages/products.html");

  await page.waitForSelector("#product-grid .product-card", {
    timeout: 10000,
  });

  await expect(page.locator("#product-grid .product-card")).toHaveCount(2);

  const searchInput = page.locator("#search-input");
  await searchInput.fill("1000ml");

  await page.waitForSelector("#search-suggestion:not(.hidden)", {
    timeout: 5000,
  });

  await expect(page.locator("#search-suggestion")).toBeVisible();

  const suggestions = page.locator("#search-suggestion [data-id]");
  await expect(suggestions).toHaveCount(1);

  await suggestions.first().click();

  await expect(searchInput).toHaveValue(/1000ml/i);
  await expect(page.locator("#search-suggestion")).toBeHidden();

  await expect(page.locator("#product-grid .product-card")).toHaveCount(1);
});
