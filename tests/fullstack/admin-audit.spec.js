import { test, expect } from "@playwright/test";

// Không lưu trace/video chứa thông tin xác thực.
test.use({ trace: "off", video: "off" });

const loginAs = async (page, email, password) => {
  await page.goto("/pages/products.html");
  await expect(page.locator(".product-card").first()).toBeVisible();

  await page.locator("#account-btn").click();
  await expect(page.locator("#auth-modal")).toBeVisible();

  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/login" &&
      response.request().method() === "POST",
  );

  await page.locator("#auth-submit-btn").click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);
  await expect(page.locator("#auth-modal")).toBeHidden();
};

const readAuditResult = async (response) => {
  const payload = await response.json();
  return payload.data ?? payload;
};

test("fullstack: admin audit access, filtering, pagination and denied access", async ({
  browser,
}) => {
  const adminContext = await browser.newContext();
  const userContext = await browser.newContext();

  try {
    const adminPage = await adminContext.newPage();
    const userPage = await userContext.newPage();

    // 1. Admin đăng nhập và truy cập audit logs.
    await loginAs(adminPage, "admin@shop.vn", "admin123");

    const initialResponse = await adminPage.request.get(
      "/api/admin/audit-logs?page=1&limit=1",
    );

    expect(initialResponse.status()).toBe(200);

    const initialResult = await readAuditResult(initialResponse);

    expect(Array.isArray(initialResult.records)).toBe(true);
    expect(initialResult.page).toBe(1);
    expect(initialResult.limit).toBe(1);
    expect(initialResult.records.length).toBeLessThanOrEqual(1);
    expect(typeof initialResult.total).toBe("number");

    // 2. User thường đăng nhập và bị từ chối truy cập.
    await loginAs(userPage, "user@example.com", "user123");

    const deniedResponse = await userPage.request.get("/api/admin/audit-logs");

    expect(deniedResponse.status()).toBe(403);

    // 3. Admin kiểm tra bản ghi DENIED vừa được tạo.
    const filteredResponse = await adminPage.request.get(
      "/api/admin/audit-logs?action=ADMIN_ACTION_DENIED&outcome=DENIED&limit=100",
    );

    expect(filteredResponse.status()).toBe(200);

    const filteredResult = await readAuditResult(filteredResponse);

    expect(Array.isArray(filteredResult.records)).toBe(true);

    const deniedRecord = filteredResult.records.find(
      (record) =>
        record.targetType === "AUDIT_LOG_QUERY" && record.outcome === "DENIED",
    );

    expect(deniedRecord).toBeDefined();
    expect(deniedRecord.action).toBe("ADMIN_ACTION_DENIED");
    expect(deniedRecord.actorRole).not.toBe("ADMIN");
    expect(deniedRecord.metadata).toMatchObject({
      reason: "insufficient_role",
    });

    // 4. Kiểm tra dữ liệu metadata không chứa thông tin nhạy cảm.
    const metadata = JSON.stringify(deniedRecord.metadata ?? {});

    expect(metadata).not.toMatch(
      /password|token|secret|cookie|authorization|buffer/i,
    );

    // 5. Kiểm tra bộ lọc trả về đúng loại bản ghi.
    for (const record of filteredResult.records) {
      expect(record.action).toBe("ADMIN_ACTION_DENIED");
      expect(record.outcome).toBe("DENIED");
    }
  } finally {
    await userContext.close();
    await adminContext.close();
  }
});
