import { test, expect } from '@playwright/test';

test('should search for product and show suggestions', async ({ page }) => {
  await page.goto('/pages/products.html');

  await page.waitForSelector('#product-grid .product-card', { timeout: 10000 });

  const searchInput = page.locator('#search-input');
  await searchInput.fill('container');

  await page.waitForSelector('#search-suggestion:not(.hidden)', { timeout: 5000 });

  await expect(page.locator('#search-suggestion')).toBeVisible();

  const suggestions = page.locator('#search-suggestion [data-id]');
  await expect(suggestions).toHaveCount(5);

  await suggestions.first().click();
  await expect(searchInput).toHaveValue(/container/i);
  await expect(page.locator('#search-suggestion')).toBeHidden();

  await expect(page.locator('#product-grid .product-card')).toHaveCount(1);
});