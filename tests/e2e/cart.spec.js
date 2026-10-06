import { test, expect } from "@playwright/test";

const product = {
  id: "product-1",
  name: "Premium Lunch Box",
  description: "A test product",
  price: 100000,
  stock: 10,
  category: "Lunch Box",
  images: [],
  slug: "premium-lunch-box",
  isActive: true,
};

test("authenticated user can add a product and complete checkout", async ({
  page,
}) => {
  let cartItems = [];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname.endsWith("/products") && method === "GET") {
      await route.fulfill({
        json: {
          data: {
            products: [product],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
          },
        },
      });
      return;
    }
    if (url.pathname.endsWith("/auth/login") && method === "POST") {
      await route.fulfill({
        json: {
          data: {
            csrfToken: "csrf-e2e",
            user: {
              id: "user-1",
              email: "user@example.com",
              firstName: "Test",
            },
          },
        },
      });
      return;
    }
    if (url.pathname.endsWith("/cart") && method === "GET") {
      await route.fulfill({
        json: {
          data: {
            items: cartItems.map((item) => ({
              id: `cart-${item.productId}`,
              productId: item.productId,
              quantity: item.quantity,
              product,
            })),
          },
        },
      });
      return;
    }
    if (url.pathname.endsWith("/cart/items") && method === "POST") {
      const body = request.postDataJSON();
      cartItems = [{ productId: body.productId, quantity: body.quantity }];
      await route.fulfill({ json: { data: {} } });
      return;
    }
    if (url.pathname.endsWith("/cart") && method === "DELETE") {
      cartItems = [];
      await route.fulfill({ json: { data: {} } });
      return;
    }
    if (url.pathname.endsWith("/checkout") && method === "POST") {
      await route.fulfill({
        json: {
          data: {
            order: {
              id: "order-1",
              orderNumber: "ORD-E2E-001",
              subtotal: 100000,
              tax: 11000,
              shippingFee: 0,
              discountAmount: 5000,
              discountCode: "SAVE5",
              total: 106000,
            },
          },
        },
      });
      return;
    }
    await route.fulfill({ json: { data: {} } });
  });

  await page.goto("/pages/products.html");
  await expect(page.locator(".product-card").first()).toBeVisible();

  await page.locator("#account-btn").click();
  await expect(page.locator("#auth-modal")).toBeVisible();
  await page.fill("#auth-email", "user@example.com");
  await page.fill("#auth-password", "password123");
  await page.locator("#auth-form button[type=submit]").click();
  await expect(page.locator("#auth-modal")).toBeHidden();

  await page
    .locator(".product-card")
    .first()
    .locator(".add-to-cart-btn")
    .click();
  await expect(page.locator("#cart-badge")).toHaveText("1");
  await page.locator("#cart-icon-btn").click();
  await expect(page.locator("#cart-drawer")).toBeVisible();
  await page.locator("#checkout-btn").click();
  await expect(page.locator("#checkout-modal")).toBeVisible();

  await page.fill("#phone", "0123456789");
  await page.fill("#address", "123 Main St");
  await page.fill("#notes", "Leave at reception");
  await page.fill("#discount-code", "SAVE5");
  await page.locator('#checkout-form button[type="submit"]').click();

  await expect(page.locator("#success-modal")).toBeVisible();
  await expect(page.locator("#success-order-id")).toHaveText("ORD-E2E-001");
  await expect(page.locator("#success-total")).toHaveText("106.000 ₫");
  await expect(page.locator("#cart-badge")).toHaveText("0");
  await expect(page.locator(".cart-scroll")).toContainText("empty");
});
