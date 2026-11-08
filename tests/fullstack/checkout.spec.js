import { test, expect } from "@playwright/test";

const formatPrice = (value) => Number(value).toLocaleString("vi-VN") + " ₫";
const clearCart = async (page) => {
  const origin = new URL(page.url());
  if (!["localhost", "127.0.0.1"].includes(origin.hostname)) {
    throw new Error("Cart cleanup requires disposable loopback CI fixtures");
  }

  const csrf = (await page.context().cookies()).find(
    (cookie) => cookie.name === "csrfToken",
  );
  const response = await page.request.delete("/api/cart", {
    headers: { "x-csrf-token": csrf.value },
  });
  expect([200, 404]).toContain(response.status());
};

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
  await clearCart(page);

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
  await expect(
    page.locator('#checkout-form button[type="submit"]'),
  ).toBeEnabled();
  const reviewedTotal = await page.locator("#checkout-total").textContent();

  const checkoutResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/checkout" &&
      response.request().method() === "POST",
  );

  const cartDeleteRequests = [];
  const checkoutIdempotencyKeys = [];

  const trackCartDelete = (request) => {
    if (
      new URL(request.url()).pathname === "/api/cart" &&
      request.method() === "DELETE"
    ) {
      cartDeleteRequests.push(request);
    }
  };

  page.on("request", trackCartDelete);
  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/checkout" &&
      request.method() === "POST"
    ) {
      checkoutIdempotencyKeys.push(request.headers()["idempotency-key"]);
    }
  });

  await page.locator('#checkout-form button[type="submit"]').click();

  // Chính Backend thật phải tạo order.
  const checkoutResponse = await checkoutResponsePromise;
  expect(checkoutResponse.ok()).toBe(true);

  const checkoutPayload = await checkoutResponse.json();
  const order = checkoutPayload?.data?.order;

  expect(order?.id).toBeTruthy();
  expect(order?.orderNumber).toBeTruthy();
  expect(Number(order?.total)).toBeGreaterThan(0);
  expect(reviewedTotal).toBe(formatPrice(order.total));
  expect(checkoutResponse.request().postDataJSON().expectedTotal).toBe(
    order.total,
  );
  expect(checkoutIdempotencyKeys).toHaveLength(1);
  expect(checkoutIdempotencyKeys[0]).toBeTruthy();

  // Frontend phải render chính dữ liệu server trả về.
  await expect(page.locator("#success-modal")).toBeVisible();

  await expect(page.locator("#success-order-id")).toHaveText(order.orderNumber);

  await expect(page.locator("#success-total")).toHaveText(
    formatPrice(order.total),
  );

  // Backend checkout transaction phải tự clear cart.
  const cartResponse = await page.evaluate(async () => {
    const response = await fetch("/api/cart", {
      credentials: "include",
      cache: "no-store",
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await response.json(),
    };
  });

  expect(cartResponse.ok).toBe(true);
  expect(cartResponse.status).toBe(200);
  expect(cartResponse.body?.data?.items).toHaveLength(0);

  // Không được gọi DELETE /api/cart sau checkout.
  expect(cartDeleteRequests).toHaveLength(0);

  page.off("request", trackCartDelete);

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

test("full stack: recovers a committed checkout after response loss", async ({
  page,
}) => {
  await page.goto("/pages/products.html");
  await expect(page.locator(".product-card").first()).toBeVisible();

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
  expect((await loginResponsePromise).ok()).toBe(true);
  await expect(page.locator("#auth-modal")).toBeHidden();
  await clearCart(page);

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
  expect((await addCartResponsePromise).ok()).toBe(true);
  await expect(page.locator("#cart-badge")).toHaveText("1");

  await page.locator("#cart-icon-btn").click();
  await expect(page.locator("#cart-drawer")).toBeVisible();
  await page.locator("#checkout-btn").click();
  await expect(page.locator("#checkout-modal")).toBeVisible();
  await page.fill("#phone", "0123456789");
  await page.fill("#address", "123 Response Loss Recovery Street");
  await page.fill("#notes", "Committed before the browser lost the response");
  await expect(
    page.locator('#checkout-form button[type="submit"]'),
  ).toBeEnabled();

  const checkoutAttempts = [];
  const checkoutIdempotencyKeys = [];
  let firstCommittedPayload;
  let interceptedCheckoutCount = 0;
  const cartDeleteRequests = [];

  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/checkout" &&
      request.method() === "POST"
    ) {
      checkoutAttempts.push(request);
      checkoutIdempotencyKeys.push(request.headers()["idempotency-key"]);
    }
    if (
      new URL(request.url()).pathname === "/api/cart" &&
      request.method() === "DELETE"
    ) {
      cartDeleteRequests.push(request);
    }
  });

  await page.route("**/api/checkout", async (route) => {
    if (route.request().method() !== "POST" || interceptedCheckoutCount > 0) {
      await route.continue();
      return;
    }

    interceptedCheckoutCount += 1;
    const backendResponse = await route.fetch();
    expect(backendResponse.ok()).toBe(true);
    firstCommittedPayload = await backendResponse.json();
    expect(firstCommittedPayload?.data?.order?.id).toBeTruthy();
    await route.abort("connectionfailed");
  });

  await page.locator('#checkout-form button[type="submit"]').click();

  await expect.poll(() => checkoutAttempts.length, { timeout: 10000 }).toBe(1);
  await expect(page.locator(".toast-error")).toContainText(
    "Không xác định được trạng thái đơn hàng",
  );
  await page.locator("#close-checkout-btn").click();
  await expect(page.locator("#checkout-modal")).toBeVisible();
  await expect(page.locator(".toast-warning").last()).toContainText(
    "Vui lòng thử lại cùng yêu cầu thanh toán",
  );
  await expect(
    page.locator('#checkout-form button[type="submit"]'),
  ).toBeEnabled();
  await expect(page.locator("#checkout-modal")).toBeVisible();
  await expect(page.locator("#cart-badge")).toHaveText("1");

  const recoveredResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/checkout" &&
      response.request().method() === "POST" &&
      checkoutAttempts.length >= 2,
  );
  await page.locator('#checkout-form button[type="submit"]').click();
  const recoveredResponse = await recoveredResponsePromise;
  expect(recoveredResponse.ok()).toBe(true);

  const recoveredPayload = await recoveredResponse.json();
  const recoveredOrder = recoveredPayload?.data?.order;
  const committedOrder = firstCommittedPayload?.data?.order;

  expect(checkoutAttempts).toHaveLength(2);
  expect(checkoutIdempotencyKeys).toHaveLength(2);
  expect(checkoutIdempotencyKeys[0]).toBeTruthy();
  expect(checkoutIdempotencyKeys[1]).toBe(checkoutIdempotencyKeys[0]);
  expect(recoveredOrder?.id).toBe(committedOrder.id);
  expect(recoveredOrder?.orderNumber).toBe(committedOrder.orderNumber);
  expect(Number(recoveredOrder?.total)).toBe(Number(committedOrder.total));
  expect(recoveredOrder?.paymentStatus).toBe("PENDING");

  await expect(page.locator("#success-modal")).toBeVisible();
  await expect(page.locator("#success-order-id")).toHaveText(
    recoveredOrder.orderNumber,
  );
  await expect(page.locator("#cart-badge")).toHaveText("0");
  await expect(page.locator(".cart-scroll")).toContainText("empty");
  expect(cartDeleteRequests).toHaveLength(0);

  const ordersResponse = await page.request.get("/api/checkout/orders", {
    params: { limit: 50 },
  });
  expect(ordersResponse.ok()).toBe(true);
  const ordersPayload = await ordersResponse.json();
  const matchingOrders = (ordersPayload?.data?.orders || []).filter(
    (order) => order.id === committedOrder.id,
  );
  expect(matchingOrders).toHaveLength(1);
  expect(matchingOrders[0].orderNumber).toBe(committedOrder.orderNumber);
  expect(matchingOrders[0].paymentStatus).toBe("PENDING");
});


test("full stack: recovers from a checkout price conflict and suppresses duplicate retry submissions", async ({
  page,
}) => {
  await page.goto("/pages/products.html");
  await expect(page.locator(".product-card").first()).toBeVisible();

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
  expect((await loginResponsePromise).ok()).toBe(true);
  await expect(page.locator("#auth-modal")).toBeHidden();
  await clearCart(page);

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
  expect((await addCartResponsePromise).ok()).toBe(true);
  await expect(page.locator("#cart-badge")).toHaveText("1");

  await page.locator("#cart-icon-btn").click();
  await expect(page.locator("#cart-drawer")).toBeVisible();
  await page.locator("#checkout-btn").click();
  await expect(page.locator("#checkout-modal")).toBeVisible();
  await page.fill("#phone", "0123456789");
  await page.fill("#address", "123 Price Conflict Recovery Street");
  await page.fill("#notes", "Review the refreshed server quote before retry");
  const submitButton = page.locator('#checkout-form button[type="submit"]');
  await expect(submitButton).toBeEnabled();

  const checkoutRequests = [];
  const idempotencyKeys = [];
  let releaseSuccessfulResponse;
  let signalSuccessfulCommit;
  const successfulCommit = new Promise((resolve) => {
    signalSuccessfulCommit = resolve;
  });
  const successfulResponseGate = new Promise((resolve) => {
    releaseSuccessfulResponse = resolve;
  });

  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/checkout" &&
      request.method() === "POST"
    ) {
      checkoutRequests.push(request);
      idempotencyKeys.push(request.headers()["idempotency-key"]);
    }
  });

  await page.route("**/api/checkout", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    if (checkoutRequests.length === 1) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "Checkout total changed. Refresh the total and review it before placing the order.",
        }),
      });
      return;
    }

    if (checkoutRequests.length === 2) {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "Delivery address is not serviceable. Choose another address.",
        }),
      });
      return;
    }

    const backendResponse = await route.fetch();
    expect(backendResponse.ok()).toBe(true);
    signalSuccessfulCommit();
    await successfulResponseGate;
    await route.fulfill({ response: backendResponse });
  });

  const conflictResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/checkout" &&
      response.request().method() === "POST",
  );
  await submitButton.click();
  const conflictResponse = await conflictResponsePromise;

  expect(conflictResponse.status()).toBe(400);
  await expect(page.locator(".toast-error").last()).toContainText(
    "Checkout total changed",
  );
  await expect(page.locator("#checkout-modal")).toBeVisible();
  await expect(page.locator("#checkout-quote-status")).toContainText(
    "Vui lòng cập nhật tổng tiền",
  );
  await expect(submitButton).toBeDisabled();
  await expect(page.locator("#success-modal")).toBeHidden();
  await expect(page.locator("#cart-badge")).toHaveText("1");

  const quoteResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/checkout/quote" &&
      response.request().method() === "GET",
  );
  await page.locator("#apply-discount-btn").click();
  const quoteResponse = await quoteResponsePromise;
  expect(quoteResponse.ok()).toBe(true);
  await expect(submitButton).toBeEnabled();

  const validationResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/checkout" &&
      response.request().method() === "POST",
  );
  await submitButton.click();
  const validationResponse = await validationResponsePromise;
  expect(validationResponse.status()).toBe(422);
  await expect(page.locator(".toast-error").last()).toContainText(
    "Delivery address is not serviceable",
  );
  await expect(page.locator("#checkout-modal")).toBeVisible();
  await expect(page.locator("#success-modal")).toBeHidden();
  await expect(page.locator("#cart-badge")).toHaveText("1");
  await expect(submitButton).toBeEnabled();

  await page.fill("#address", "124 Price Conflict Recovery Street");

  const successfulResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/checkout" &&
      response.request().method() === "POST",
  );
  await submitButton.click();
  await successfulCommit;

  expect(checkoutRequests).toHaveLength(3);
  expect(idempotencyKeys).toHaveLength(3);
  expect(idempotencyKeys[0]).toBeTruthy();
  expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  expect(idempotencyKeys[2]).toBe(idempotencyKeys[0]);
  await expect(submitButton).toBeDisabled();

  // Dispatch a second browser submit event while the first retry is in flight.
  await page.locator("#checkout-form").evaluate((form) => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  expect(checkoutRequests).toHaveLength(3);

  releaseSuccessfulResponse();
  const successfulResponse = await successfulResponsePromise;
  expect(successfulResponse.ok()).toBe(true);

  const successfulPayload = await successfulResponse.json();
  const order = successfulPayload?.data?.order;
  expect(order?.id).toBeTruthy();
  expect(order?.orderNumber).toBeTruthy();

  await expect(page.locator("#success-modal")).toBeVisible();
  await expect(page.locator("#success-order-id")).toHaveText(order.orderNumber);
  await expect(page.locator("#cart-badge")).toHaveText("0");
  await expect(page.locator(".cart-scroll")).toContainText("empty");

  const ordersResponse = await page.request.get("/api/checkout/orders", {
    params: { limit: 50 },
  });
  expect(ordersResponse.ok()).toBe(true);
  const ordersPayload = await ordersResponse.json();
  const matchingOrders = (ordersPayload?.data?.orders || []).filter(
    (candidate) => candidate.id === order.id,
  );
  expect(matchingOrders).toHaveLength(1);
});
