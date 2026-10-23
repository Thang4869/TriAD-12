const { test } = require("node:test");
const assert = require("node:assert/strict");
const secret = "disposable-proxy-secret-with-32-characters";
const load = () => import("../../server/api-proxy.js");
const req = (path = "/api/products", init = {}) =>
  new Request(`https://shop.example${path}`, {
    ...init,
    headers: { "x-vercel-forwarded-for": "203.0.113.4", ...init.headers },
  });

test("replaces forged edge/forwarding headers, fixes upstream and preserves URL/body/auth", async () => {
  const { createApiProxy } = await load();
  let seen;
  const proxy = createApiProxy({
    secret,
    fetchImpl: async (url, init) => {
      seen = {
        url: String(url),
        init,
        body: await new Response(init.body).text(),
      };
      return new Response("ok");
    },
  });
  const response = await proxy(
    req("/api/cart?target=https://evil.example", {
      method: "POST",
      body: '{"quantity":2}',
      headers: {
        "content-type": "application/json",
        cookie: "session=fixture",
        "x-csrf-token": "csrf-fixture",
        "idempotency-key": "fixture-key",
        "x-triad-edge-key": "forged",
        "x-triad-client-ip": "198.51.100.9",
        "x-forwarded-for": "198.51.100.8",
        "x-real-ip": "198.51.100.7",
      },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(
    seen.url,
    "https://triad-api-staging.onrender.com/api/cart?target=https://evil.example",
  );
  assert.equal(seen.body, '{"quantity":2}');
  assert.equal(seen.init.headers.get("x-triad-edge-key"), secret);
  assert.equal(seen.init.headers.get("x-triad-client-ip"), "203.0.113.4");
  assert.equal(seen.init.headers.get("x-forwarded-for"), null);
  assert.equal(seen.init.headers.get("x-real-ip"), null);
  assert.equal(seen.init.headers.get("cookie"), "session=fixture");
  assert.equal(seen.init.headers.get("x-csrf-token"), "csrf-fixture");
  assert.equal(seen.init.headers.get("idempotency-key"), "fixture-key");
  assert.equal(seen.init.redirect, "manual");
});

test("preserves distinct Set-Cookie, errors/429 and disables cache", async () => {
  const { createApiProxy } = await load();
  const headers = new Headers({
    "ratelimit-limit": "2",
    "cache-control": "public",
    "content-length": "900",
  });
  headers.append("set-cookie", "access=; Path=/; Max-Age=0; Secure; HttpOnly");
  headers.append(
    "set-cookie",
    "refresh=fixture; Path=/api/auth; Secure; HttpOnly",
  );
  const response = await createApiProxy({
    secret,
    fetchImpl: async () => new Response("limited", { status: 429, headers }),
  })(req());
  assert.equal(response.status, 429);
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.equal(response.headers.get("ratelimit-limit"), "2");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("content-length"), null);
  assert.equal(await response.text(), "limited");
});

test("fails closed on missing configuration/address without falling back to XFF", async () => {
  const { createApiProxy } = await load();
  const fetchImpl = () => {
    throw new Error("must not fetch");
  };
  assert.equal((await createApiProxy({ fetchImpl })(req())).status, 503);
  for (const ip of ["", "203.0.113.1, 203.0.113.2", "bad"]) {
    assert.equal(
      (
        await createApiProxy({ secret, fetchImpl })(
          req("/api/cart", {
            headers: {
              "x-vercel-forwarded-for": ip,
              "x-forwarded-for": "203.0.113.1",
            },
          }),
        )
      ).status,
      503,
    );
  }
});

test("preserves redirects without following them", async () => {
  const { createApiProxy } = await load();
  const response = await createApiProxy({
    secret,
    fetchImpl: async (_url, init) => {
      assert.equal(init.redirect, "manual");
      return new Response(null, {
        status: 302,
        headers: { location: "https://accounts.example/authorize" },
      });
    },
  })(req("/api/auth/google"));
  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("location"),
    "https://accounts.example/authorize",
  );
});

test("streams multipart bytes unchanged and handles upstream failure safely", async () => {
  const { createApiProxy } = await load();
  const body = new Uint8Array([0, 255, 128, 12]);
  await createApiProxy({
    secret,
    fetchImpl: async (_url, init) => {
      assert.deepEqual(
        new Uint8Array(await new Response(init.body).arrayBuffer()),
        body,
      );
      assert.equal(
        init.headers.get("content-type"),
        "multipart/form-data; boundary=fixture",
      );
      return new Response(null, { status: 204 });
    },
  })(
    req("/api/products", {
      method: "POST",
      body,
      headers: { "content-type": "multipart/form-data; boundary=fixture" },
    }),
  );
  const failed = await createApiProxy({
    secret,
    fetchImpl: async () => {
      throw new Error(secret);
    },
  })(req());
  assert.equal(failed.status, 502);
  assert.doesNotMatch(await failed.text(), new RegExp(secret));
});
