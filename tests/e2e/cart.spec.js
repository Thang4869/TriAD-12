import { test, expect } from '@playwright/test';

test('should add product to cart, open drawer, and checkout', async ({ page }) => {
  await page.goto('/pages/products.html');

  await page.waitForSelector('.product-card', { timeout: 10000 });

  await page.locator('.product-card').first().hover();
  await page.locator('.add-to-cart-btn').first().click();

  await page.locator('#cart-icon-btn').click();
  await expect(page.locator('#cart-drawer')).toBeVisible();
  await expect(page.locator('#cart-total')).not.toHaveText('0 ₫');

  await page.locator('#checkout-btn').click();
  await expect(page.locator('#checkout-modal')).toBeVisible();

  await page.fill('#first-name', 'John');
  await page.fill('#last-name', 'Doe');
  await page.fill('#email', 'john@example.com');
  await page.fill('#phone', '0123456789');
  await page.fill('#address', '123 Main St');
  await page.click('input[name="payment"][value="cod"]');

  await page.click('#checkout-form button[type="submit"]');

  await expect(page.locator('#success-modal')).toBeVisible();
  await expect(page.locator('#success-modal h2')).toHaveText('Order Placed Successfully!');
});