import { test, expect } from '@playwright/test';

test('homepage should display hero, about, features', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#home h1')).toBeVisible();
  await expect(page.locator('#home img')).toBeVisible();

  await expect(page.locator('#about h3')).toHaveText(/About Us/i);
  await expect(page.locator('#about img').first()).toBeVisible();

  const featuresHeading = page.locator('h2:has-text("Outstanding advantages")');
  await expect(featuresHeading).toBeVisible();

  const featureItems = page.locator('.grid .p-6');
  await expect(featureItems).toHaveCount(4);
});