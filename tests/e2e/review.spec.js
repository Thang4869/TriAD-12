import { test, expect } from '@playwright/test';

test('should submit a review', async ({ page }) => {
  await page.goto('/pages/reviews.html');
  
  await page.fill('#review-name', 'Alice');
  await page.fill('#review-email', 'alice@example.com');
  await page.fill('#review-content', 'Great product!');
  
  await page.locator('.star-rating').nth(4).click();
  
  await page.click('#review-form button[type="submit"]');
  
  await expect(page.locator('.toast-success')).toBeVisible();
  
  await expect(page.locator('#reviews-grid')).toContainText('Alice');
  await expect(page.locator('#reviews-grid')).toContainText('Great product!');
});