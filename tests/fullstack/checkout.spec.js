import { test, expect } from "@playwright/test";

const formatPrice = (value) => Number(value).toLocaleString("vi-VN") + " ₫";

test("full stack: login -> product -> cart -> checkout -> persisted order", async ({
  page,
}) => {
  await page.goto("/pages/products.html");

  await expect(page.locator(".product-card").first()).toBeVisible();

  // Login bằng user thật từ backend seed.
  await page.locator("#account-btn").click();
  await expect(page.locator("#auth-modal")).toBeVisible();

  await page.fill("#auth-email", "user@example.com");
  await page.fill("#auth-password", "user123");

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/login" &&
      response.request().method() === "POST",
  );

  await page.locator("#auth-form button[type=submit]").click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBe(true);

  await expect(page.locator("#auth-modal")).toBeHidden();

  // Add sản phẩm thật vào cart backend.
  const addCartResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/cart/items" &&
      response.request().method() === "POST",
  );

  await page
    .locator(".product-card")
    .first()
    .locator(".add-to-cart-btn")
    .click();

  const addCartResponse = await addCartResponsePromise;
  expect(addCartResponse.ok()).toBe(true);

  await expect(page.locator("#cart-badge")).toHaveText("1");

  // Mở checkout.
  await page.locator("#cart-icon-btn").click();
  await expect(page.locator("#cart-drawer")).toBeVisible();

  await page.locator("#checkout-btn").click();
  await expect(page.locator("#checkout-modal")).toBeVisible();

  await page.fill("#phone", "0123456789");
  await page.fill("#address", "123 Full Stack CI Street");
  await page.fill("#notes", "Created by full frontend-backend CI journey");

  const checkoutResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/checkout" &&
      response.request().method() === "POST",
  );

  const clearCartResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/cart" &&
      response.request().method() === "DELETE",
  );

  await page.locator('#checkout-form button[type="submit"]').click();

  // Chính Backend thật phải tạo order.
  const checkoutResponse = await checkoutResponsePromise;
  expect(checkoutResponse.ok()).toBe(true);

  const checkoutPayload = await checkoutResponse.json();
  const order = checkoutPayload?.data?.order;

  expect(order?.id).toBeTruthy();
  expect(order?.orderNumber).toBeTruthy();
  expect(Number(order?.total)).toBeGreaterThan(0);

  // Frontend phải render chính dữ liệu server trả về.
  await expect(page.locator("#success-modal")).toBeVisible();

  await expect(page.locator("#success-order-id")).toHaveText(order.orderNumber);

  await expect(page.locator("#success-total")).toHaveText(
    formatPrice(order.total),
  );

  // CheckoutController phải clear cart thật ở backend.
  const clearCartResponse = await clearCartResponsePromise;
  expect(clearCartResponse.ok()).toBe(true);

  await expect(page.locator("#cart-badge")).toHaveText("0");
  await expect(page.locator(".cart-scroll")).toContainText("empty");

  await expect
    .poll(
      async () => {
        return page.evaluate(async (orderId) => {
          const response = await fetch(`/api/orders/${orderId}`, {
            credentials: "include",
          });

          if (!response.ok) {
            return null;
          }

          const body = await response.json();
          return body?.data?.orderId || null;
        }, order.id);
      },
      {
        timeout: 10000,
        intervals: [250, 500, 1000],
      },
    )
    .toBe(order.id);
});
