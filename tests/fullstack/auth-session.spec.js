import { test, expect } from "@playwright/test";

// These replay checks use disposable local CI accounts, never a hosted account.
// Auth request headers must not be retained in browser trace/video artifacts.
test.use({ trace: "off", video: "off" });

test.beforeEach(async ({ page }, testInfo) => {
  const origin = new URL(testInfo.project.use.baseURL);
  if (!["localhost", "127.0.0.1"].includes(origin.hostname)) {
    throw new Error(
      "Auth replay checks require disposable loopback CI fixtures",
    );
  }

  await page.goto("/pages/products.html");
  await expect(page.locator(".product-card").first()).toBeVisible();
  await page.locator("#account-btn").click();
  await page.locator("#auth-email").fill("user@example.com");
  await page.locator("#auth-password").fill("user123");
  const loginResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/login" &&
      response.request().method() === "POST",
  );
  await page.locator("#auth-submit-btn").click();
  expect((await loginResponse).status()).toBe(200);
  await expect(page.locator("#auth-modal")).toBeHidden();
});

test("refreshes a missing access session and enforces CSRF and logout revocation", async ({
  page,
  context,
  request,
}) => {
  const initialCookies = await context.cookies();
  const initialRefresh = initialCookies.find(
    (cookie) => cookie.name === "refreshToken",
  );
  const origin = new URL(page.url()).origin;

  // No access cookie forces the same HTTP 401 bootstrap path as an expired JWT.
  // Backend token-expiry validation is covered separately by its token tests.
  await context.clearCookies({ name: "accessToken" });
  let refreshRequests = 0;
  page.on("request", (req) => {
    if (
      new URL(req.url()).pathname === "/api/auth/refresh" &&
      req.method() === "POST"
    ) {
      refreshRequests += 1;
    }
  });
  const refreshResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/refresh" &&
      response.request().method() === "POST",
  );
  await page.reload();
  expect((await refreshResponse).status()).toBe(200);
  await expect(page.locator(".product-card").first()).toBeVisible();
  await expect(page.locator("#account-btn")).toHaveAttribute(
    "title",
    "Đăng xuất",
  );
  expect(refreshRequests).toBe(1);
  expect((await page.request.get("/api/cart")).status()).toBe(200);

  const cookies = await context.cookies();
  const refresh = cookies.find((cookie) => cookie.name === "refreshToken");
  const access = cookies.find((cookie) => cookie.name === "accessToken");
  const csrf = cookies.find((cookie) => cookie.name === "csrfToken");
  expect(
    Boolean(refresh?.value && refresh.value !== initialRefresh?.value),
  ).toBe(true);
  expect(Boolean(access?.value && access.httpOnly)).toBe(true);
  expect(Boolean(csrf?.value && !csrf.httpOnly)).toBe(true);

  const missingCsrf = await page.request.post("/api/cart/items", { data: {} });
  expect(missingCsrf.status()).toBe(403);
  const invalidCsrf = await page.request.post("/api/cart/items", {
    data: {},
    headers: { "x-csrf-token": "synthetic-invalid-csrf" },
  });
  expect(invalidCsrf.status()).toBe(403);
  const disallowedOrigin = await page.request.post("/api/cart/items", {
    data: {},
    headers: {
      Origin: "https://csrf-probe.invalid",
      "x-csrf-token": csrf.value,
    },
  });
  expect(disallowedOrigin.status()).toBe(403);
  expect(
    disallowedOrigin.headers()["access-control-allow-origin"],
  ).toBeUndefined();

  // Hold test-only tokens in memory for replay assertions; never print them.
  const replayHeaders = {
    Cookie: cookies
      .filter((cookie) =>
        ["accessToken", "refreshToken", "csrfToken"].includes(cookie.name),
      )
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; "),
    Origin: origin,
    "x-csrf-token": csrf.value,
  };
  const logoutResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/logout" &&
      response.request().method() === "POST",
  );
  await page.locator("#account-btn").click();
  expect((await logoutResponse).status()).toBe(200);
  await expect(page.locator("#account-btn")).toContainText("Đăng nhập");
  await page.reload();
  await expect(page.locator(".product-card").first()).toBeVisible();
  await expect(page.locator("#account-btn")).toContainText("Đăng nhập");

  const revokedAccess = await request.get("/api/cart", {
    headers: replayHeaders,
  });
  expect(revokedAccess.status()).toBe(401);
  expect((await revokedAccess.json()).error).toBe("Token revoked");
  const revokedRefresh = await request.post("/api/auth/refresh", {
    data: {},
    headers: replayHeaders,
  });
  expect(revokedRefresh.status()).toBe(401);
});

test("clears the cached identity when both authentication cookies are absent", async ({
  page,
  context,
}) => {
  await context.clearCookies({ name: /^(accessToken|refreshToken)$/ });
  const refreshResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/refresh" &&
      response.request().method() === "POST",
  );
  await page.reload();
  expect((await refreshResponse).status()).toBe(400);
  await expect(page.locator(".product-card").first()).toBeVisible();
  await expect(page.locator("#account-btn")).toContainText("Đăng nhập");
  expect((await page.request.get("/api/cart")).status()).toBe(401);
});
