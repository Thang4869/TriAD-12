import { test, expect } from "@playwright/test";

test('should search for product and show suggestions', async ({ page }) => {
  await page.goto('/pages/products.html');
  await page.waitForSelector('#product-grid .product-card', { timeout: 10000 });

  const searchInput = page.locator('#search-input');
  await searchInput.fill('1000ml');

  await page.waitForSelector('#search-suggestion:not(.hidden)', { timeout: 5000 });
  await expect(page.locator('#search-suggestion')).toBeVisible();

  const suggestions = page.locator('#search-suggestion [data-id]');
  await expect(suggestions).toHaveCount(1);

  await suggestions.first().click();
  await expect(searchInput).toHaveValue(/1000ml/i);
  await expect(page.locator('#search-suggestion')).toBeHidden();
  await expect(page.locator('#product-grid .product-card')).toHaveCount(1);
});
