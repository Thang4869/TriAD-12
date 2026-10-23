import { test, expect } from "@playwright/test";

const FRONTEND = "https://triad-staging-three.vercel.app";
const BACKEND = "https://triad-api-staging.onrender.com";
const DENIED_ORIGIN = "https://csrf-probe.invalid";

// Never retain screenshots, trace, video, credentials, JWTs or cookie values
// from a real hosted session in Playwright artifacts.
test.use({ baseURL: FRONTEND, trace: "off", video: "off", screenshot: "off" });
test.setTimeout(120_000);

const getCsrfCookie = (cookies) =>
  cookies.find((cookie) => cookie.name === "csrfToken");

async function browserCsrfValue(page) {
  return page.evaluate(() => {
    const csrf = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("csrfToken="));
    return csrf ? decodeURIComponent(csrf.slice("csrfToken=".length)) : null;
  });
}

test("Vercel serves the canonical HTTPS origin and proxies its public API", async ({
  page,
}) => {
  const response = await page.goto("/pages/products.html", {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).origin).toBe(FRONTEND);

  const api = await page.evaluate(async () => {
    const response = await fetch("/api/products", {
      credentials: "include",
      cache: "no-store",
    });
    const json = await response.json();
    return { status: response.status, success: json?.success };
  });
  expect(api).toEqual({ status: 200, success: true });
});

test("anonymous HTTPS requests cannot bootstrap a CSRF or refresh an absent session", async ({
  page,
  context,
}) => {
  await page.goto("/pages/products.html");
  const result = await page.evaluate(async () => {
    const csrf = await fetch("/api/auth/csrf", {
      credentials: "include",
      cache: "no-store",
    });
    const refresh = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return { csrfStatus: csrf.status, refreshStatus: refresh.status };
  });
  expect(result).toEqual({ csrfStatus: 401, refreshStatus: 400 });
  expect(
    (await context.cookies(FRONTEND)).filter((cookie) =>
      ["accessToken", "refreshToken", "csrfToken"].includes(cookie.name),
    ),
  ).toHaveLength(0);
});

test("deployed API proxy CORS accepts the frontend but rejects an arbitrary origin", async ({
  request,
}) => {
  const target = new URL("/api/auth/login", FRONTEND).href;
  const common = {
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type,x-csrf-token",
  };
  const allowed = await request.fetch(target, {
    method: "OPTIONS",
    headers: { ...common, Origin: FRONTEND },
    failOnStatusCode: false,
  });
  expect([200, 204]).toContain(allowed.status());
  expect(allowed.headers()["access-control-allow-origin"]).toBe(FRONTEND);
  expect(allowed.headers()["access-control-allow-credentials"]).toBe("true");

  const denied = await request.fetch(target, {
    method: "OPTIONS",
    headers: { ...common, Origin: DENIED_ORIGIN },
    failOnStatusCode: false,
  });
  expect(denied.status()).toBeGreaterThanOrEqual(400);
  expect(denied.headers()["access-control-allow-origin"]).toBeUndefined();
});

test("direct Render API rejects forged edge and forwarding headers", async ({
  request,
}) => {
  test.skip(
    process.env.STAGING_REQUIRE_EDGE !== "true",
    "Authenticated edge deployment has not been activated for acceptance",
  );
  const response = await request.get(`${BACKEND}/api/products`, {
    headers: {
      "X-Triad-Edge-Key": "forged-not-the-hosting-secret",
      "X-Triad-Client-Ip": "203.0.113.99",
      "X-Forwarded-For": "203.0.113.99",
    },
  });
  expect(response.status()).toBe(403);
  expect((await response.json()).error).toBe("Trusted API edge required");
});

test("the deployed proxy rejects a simple-form login without issuing cookies", async ({
  request,
}) => {
  const response = await request.post(`${FRONTEND}/api/auth/login`, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: "email=synthetic%40example.invalid&password=not-a-real-password",
    failOnStatusCode: false,
  });
  expect(response.status()).toBe(403);
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

test("disposable hosted session enforces cookie, CSRF, refresh and logout", async ({
  page,
  context,
}) => {
  const email = process.env.STAGING_AUTH_EMAIL;
  const password = process.env.STAGING_AUTH_PASSWORD;
  test.skip(
    !email || !password,
    "STAGING_AUTH_EMAIL/PASSWORD GitHub secrets not configured; hosted authenticated acceptance remains pending",
  );

  await page.goto("/pages/products.html");
  let loggedIn = false;
  try {
    const login = await page.evaluate(
      async (credentials) => {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        const body = await response.json();
        return {
          status: response.status,
          hasTokensInJson: Boolean(
            body?.data?.accessToken || body?.data?.refreshToken,
          ),
          requires2FA: body?.data?.requires2FA === true,
        };
      },
      { email, password },
    );
    expect(login).toEqual({
      status: 200,
      hasTokensInJson: false,
      requires2FA: false,
    });
    loggedIn = true;

    const browserCookies = await context.cookies(FRONTEND);
    for (const name of ["accessToken", "refreshToken", "csrfToken"]) {
      const cookie = browserCookies.find((item) => item.name === name);
      expect(cookie, `missing ${name}`).toBeDefined();
      expect(cookie.secure).toBe(true);
      expect(cookie.sameSite).toBe("None");
      expect(cookie.path).toBe("/");
      expect(cookie.domain).toBe(new URL(FRONTEND).hostname);
      expect(cookie.httpOnly).toBe(name !== "csrfToken");
    }
    const readable = await browserCsrfValue(page);
    expect(readable).toMatch(/^[a-f0-9]{64}$/);
    expect(await page.evaluate(() => document.cookie)).not.toMatch(
      /(?:^|;[ ]*)(?:accessToken|refreshToken)=/,
    );

    const badWrite = await page.evaluate(async () => {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      return response.status;
    });
    expect(badWrite).toBe(403);

    const wrongWrite = await page.evaluate(async () => {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "a".repeat(64),
        },
        body: "{}",
      });
      return response.status;
    });
    expect(wrongWrite).toBe(403);

    const acceptedCsrf = await page.evaluate(async (token) => {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: "{}",
      });
      return response.status;
    }, readable);
    // Malformed body is rejected by validation after passing CSRF.
    expect(acceptedCsrf).toBe(400);

    await page.reload();
    const renewed = await page.evaluate(async () => {
      const response = await fetch("/api/auth/csrf", {
        credentials: "include",
        cache: "no-store",
      });
      const body = await response.json();
      return {
        status: response.status,
        tokenPresent: /^[a-f0-9]{64}$/.test(body?.data?.csrfToken ?? ""),
      };
    });
    expect(renewed).toEqual({ status: 200, tokenPresent: true });

    const otherTab = await context.newPage();
    try {
      await otherTab.goto("/pages/products.html");
      const status = await otherTab.evaluate(
        async () =>
          (await fetch("/api/auth/csrf", { credentials: "include" })).status,
      );
      expect(status).toBe(200);
    } finally {
      await otherTab.close();
    }

    const currentCsrf = await browserCsrfValue(page);
    expect(currentCsrf).toMatch(/^[a-f0-9]{64}$/);
    const refresh = await page.evaluate(async (token) => {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: "{}",
      });
      const body = await response.json();
      return {
        status: response.status,
        hasTokensInJson: Boolean(
          body?.data?.accessToken || body?.data?.refreshToken,
        ),
      };
    }, currentCsrf);
    expect(refresh).toEqual({ status: 200, hasTokensInJson: false });

    const logoutCsrf = await browserCsrfValue(page);
    const logout = await page.evaluate(async (token) => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: "{}",
      });
      return response.status;
    }, logoutCsrf);
    expect(logout).toBe(200);
    loggedIn = false;

    expect(
      (await context.cookies(FRONTEND)).filter((cookie) =>
        ["accessToken", "refreshToken", "csrfToken"].includes(cookie.name),
      ),
    ).toHaveLength(0);
    expect(
      await page.evaluate(
        async () =>
          (await fetch("/api/cart", { credentials: "include" })).status,
      ),
    ).toBe(401);
  } finally {
    if (loggedIn) {
      // Best-effort cleanup of a disposable staging session; no token logging.
      await page
        .evaluate(async () => {
          const token = document.cookie
            .split(";")
            .map((item) => item.trim())
            .find((item) => item.startsWith("csrfToken="));
          if (!token) return;
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": decodeURIComponent(
                token.slice("csrfToken=".length),
              ),
            },
            body: "{}",
          }).catch(() => undefined);
        })
        .catch(() => undefined);
    }
  }
});
