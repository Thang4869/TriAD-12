import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  ApiService,
} from "../../../../src/shared/services/api.service.js";
import {
  clearCsrfToken,
  setCsrfToken,
} from "../../../../src/shared/utils/csrf.js";

describe("ApiService", () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    clearCsrfToken();
    document.cookie = "csrfToken=; Max-Age=0; Path=/";

    service = new ApiService("http://localhost:5000/api");

    global.fetch = vi.fn();
  });

  it("should send GET request with credentials included", async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({
        data: { id: 1 },
      }),
    });

    const result = await service.get("/products");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/products",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );

    expect(result).toEqual({ id: 1 });
  });

  it("should build query parameters and ignore empty values", async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({ data: [] }),
    });

    await service.get("/products", {
      page: 2,
      keyword: "pan",
      category: "",
      minPrice: null,
      maxPrice: undefined,
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/products?page=2&keyword=pan",
      expect.any(Object),
    );
  });

  it("should attach CSRF token to write requests", async () => {
    setCsrfToken("test-csrf-token");

    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({
        data: { success: true },
      }),
    });

    await service.post("/auth/logout", {});

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-csrf-token": "test-csrf-token",
        }),
      }),
    );
  });

  it("should not attach CSRF header when token is missing", async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({ data: {} }),
    });

    await service.post("/auth/login", {
      email: "test@example.com",
      password: "password",
    });

    const [, options] = fetch.mock.calls[0];

    expect(options.headers).not.toHaveProperty("x-csrf-token");
  });

  it("preserves cookies and CSRF when writing through the same-origin proxy", async () => {
    service = new ApiService("/api");
    setCsrfToken("test-csrf-token");
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ data: { id: "cart-item-1" } }),
    });

    await service.post("/cart/items", { productId: "product-1", quantity: 2 });

    expect(fetch).toHaveBeenCalledWith("/api/cart/items", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": "test-csrf-token",
      },
      body: JSON.stringify({ productId: "product-1", quantity: 2 }),
    });
  });

  it.each(["post", "put", "patch", "delete"])(
    "uses the current same-origin CSRF cookie after rotation for %s",
    async (method) => {
      service = new ApiService("/api");
      const original = "a".repeat(64);
      const rotated = "b".repeat(64);
      setCsrfToken(original);
      document.cookie = `csrfToken=${original}; Path=/`;
      fetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({ data: {} }),
      });

      await service[method]("/cart/items", {
        productId: "product-1",
        quantity: 1,
      });
      document.cookie = `csrfToken=${rotated}; Path=/`;
      await service[method]("/cart/items", {
        productId: "product-1",
        quantity: 1,
      });

      expect(
        fetch.mock.calls.map(([, options]) => options.headers["x-csrf-token"]),
      ).toEqual([original, rotated]);
    },
  );

  it("keeps the API's JSON token for a cross-origin API", async () => {
    service = new ApiService("https://api.other-origin.invalid/api");
    document.cookie = `csrfToken=${"b".repeat(64)}; Path=/`;
    setCsrfToken("api-json-token");
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ data: {} }),
    });

    await service.post("/cart/items", {});

    expect(fetch.mock.calls[0][1].headers["x-csrf-token"]).toBe(
      "api-json-token",
    );
  });

  it("does not send a frontend cookie to a cross-origin API without a JSON token", async () => {
    service = new ApiService("https://api.other-origin.invalid/api");
    document.cookie = `csrfToken=${"b".repeat(64)}; Path=/`;
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ data: {} }),
    });

    await service.post("/cart/items", {});

    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("x-csrf-token");
  });

  it("does not add CSRF headers to safe reads", async () => {
    service = new ApiService("/api");
    document.cookie = `csrfToken=${"b".repeat(64)}; Path=/`;
    setCsrfToken("cached-json-token");
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ data: {} }),
    });

    await service.get("/cart");

    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("x-csrf-token");
  });

  it("preserves a rejected checkout's idempotency key without replaying the write", async () => {
    service = new ApiService("/api");
    const current = "b".repeat(64);
    document.cookie = `csrfToken=${current}; Path=/`;
    setCsrfToken("old-cached-token");
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi
        .fn()
        .mockResolvedValue({ error: "Invalid or missing CSRF token" }),
    });

    await expect(
      service.post("/checkout", {}, { "Idempotency-Key": "checkout-key" }),
    ).rejects.toMatchObject({ status: 403 });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]).toMatchObject({
      credentials: "include",
      headers: {
        "x-csrf-token": current,
        "Idempotency-Key": "checkout-key",
      },
    });
  });

  it("should send JSON body for write requests", async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({ data: {} }),
    });

    const body = {
      email: "test@example.com",
      password: "password",
    };

    await service.post("/auth/login", body);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/auth/login",
      expect.objectContaining({
        body: JSON.stringify(body),
      }),
    );
  });

  it("should unwrap data from successful API response", async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({
        data: {
          user: { id: "user-1" },
        },
      }),
    });

    const result = await service.get("/auth/me");

    expect(result).toEqual({
      user: { id: "user-1" },
    });
  });

  it("should return payload directly when response has no data property", async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({
        message: "Success",
      }),
    });

    const result = await service.get("/health");

    expect(result).toEqual({
      message: "Success",
    });
  });

  it.each(["Invalid credentials", "Please verify your email"])(
    "should preserve backend error envelope message: %s",
    async (message) => {
      const payload = {
        success: false,
        error: message,
        code: "APPLICATION.AUTHENTICATION",
        correlationId: "req-auth-test",
      };
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(payload),
      });

      await expect(service.post("/auth/login", {})).rejects.toMatchObject({
        name: "ApiError",
        message,
        status: 401,
        payload,
      });
    },
  );

  it("should throw ApiError using backend error message", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({
        message: "Invalid or missing CSRF token",
      }),
    });

    await expect(service.post("/auth/logout", {})).rejects.toMatchObject({
      name: "ApiError",
      message: "Invalid or missing CSRF token",
      status: 403,
    });
  });

  it.each([
    {},
    { error: { message: "Not a public message" } },
    { error: "   ", message: [] },
    { error: 500, message: false },
  ])(
    "should use status fallback for missing or malformed messages: %j",
    async (payload) => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({
          "content-type": "application/json",
        }),
        json: vi.fn().mockResolvedValue(payload),
      });

      await expect(service.get("/failure")).rejects.toMatchObject({
        name: "ApiError",
        message: "Yêu cầu thất bại (mã lỗi 500)",
        status: 500,
        payload,
      });
    },
  );

  it("should throw network ApiError when fetch fails", async () => {
    fetch.mockRejectedValue(new Error("Network failure"));

    await expect(service.get("/products")).rejects.toEqual(
      expect.objectContaining({
        name: "ApiError",
        status: 0,
      }),
    );
  });

  it("should create ApiError with payload", () => {
    const payload = { code: "TEST_ERROR" };
    const error = new ApiError("Test error", 400, payload);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("Test error");
    expect(error.status).toBe(400);
    expect(error.payload).toEqual(payload);
  });
});
