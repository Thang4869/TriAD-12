import { test, expect } from "@playwright/test";

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
  await page.goto("/");

  const productCard = page.locator(".product-card").first();
  const addToCartButton = productCard.locator(".add-to-cart-btn");

  await expect(productCard).toBeVisible();
  await addToCartButton.focus();

  await expect(addToCartButton).toBeVisible();
  await expect(addToCartButton).toHaveCSS("opacity", "1");
  await expect(addToCartButton).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
});

test("product image hover feedback stays subtle", async ({ page }) => {
  await page.goto("/");

  const productCard = page.locator(".product-card").first();
  const productImage = productCard.locator(".product-image");

  await expect(productImage).toBeVisible();
  await productCard.hover();

  await expect
    .poll(() => productImage.evaluate((image) => getComputedStyle(image).scale))
    .toBe("1.05");
});
