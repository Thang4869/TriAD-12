import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  ApiService,
} from "../../../../src/shared/services/api.service.js";

describe("ApiService", () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = "csrfToken=; Max-Age=0; path=/";

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
    document.cookie = "csrfToken=test-csrf-token; path=/";

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

  it("should not attach CSRF header when cookie is missing", async () => {
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

  it("should throw fallback ApiError when backend has no message", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: vi.fn().mockResolvedValue({}),
    });

    await expect(service.get("/failure")).rejects.toEqual(
      expect.objectContaining({
        name: "ApiError",
        status: 500,
      }),
    );
  });

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
