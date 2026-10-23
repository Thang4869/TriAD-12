import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "../../../../src/modules/auth/AuthController.js";
import { authService } from "../../../../src/modules/auth/AuthService.js";
import { CartController } from "../../../../src/modules/cart/CartController.js";
import { CartRepository } from "../../../../src/modules/cart/CartRepository.js";
import { CartRenderer } from "../../../../src/modules/cart/CartRenderer.js";
import { ApiService } from "../../../../src/shared/services/api.service.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";

vi.mock("../../../../src/modules/cart/CartRepository.js");
vi.mock("../../../../src/modules/cart/CartRenderer.js");

describe("real authentication events and cart isolation", () => {
  const originalApi = authService.api;
  let repository;
  let cart;
  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.clear();
    sessionStorage.clear();
    authService._persistUser(null);
    authService.api = {
      post: vi.fn().mockResolvedValue({
        user: { id: "user-1", firstName: "Fixture" },
        csrfToken: "fixture",
      }),
    };
    repository = {
      getCart: vi
        .fn()
        .mockResolvedValue([{ id: "saved-item", quantity: 2, subtotal: 200 }]),
      clear: vi.fn().mockResolvedValue([]),
    };
    CartRepository.mockImplementation(function () {
      return repository;
    });
    CartRenderer.mockImplementation(function () {
      return {
        render: vi.fn(),
        updateBadge: vi.fn(),
        setCheckoutEnabled: vi.fn(),
      };
    });
    document.body.innerHTML =
      '<button id="account-btn"><span id="account-btn-label"></span></button>';
    new AuthController();
    cart = new CartController();
  });
  afterEach(() => {
    authService.api = originalApi;
    authService._persistUser(null);
    eventBus.clear();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("loads the saved cart on login and clears only the local view on logout", async () => {
    await authService.login("fixture@example.invalid", "fixture");
    await Promise.resolve();
    expect(cart.getCount()).toBe(2);
    expect(repository.getCart).toHaveBeenCalledTimes(1);
    expect(repository.clear).not.toHaveBeenCalled();
    expect(document.querySelector("#account-btn-label").textContent).toBe(
      "Fixture",
    );
    await authService.logout();
    expect(cart.getCount()).toBe(0);
    expect(repository.getCart).toHaveBeenCalledTimes(1);
    expect(repository.clear).not.toHaveBeenCalled();
    expect(document.querySelector("#account-btn-label").textContent).toBe(
      "Đăng nhập",
    );
  });

  it("expires the visible identity after a rejected write without retrying or deleting the server cart", async () => {
    await authService.login("fixture@example.invalid", "fixture");
    await Promise.resolve();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ error: "Invalid token" }),
      }),
    );
    await expect(
      new ApiService("/api").post("/cart/items", {
        productId: "fixture",
        quantity: 1,
      }),
    ).rejects.toThrow("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(authService.isAuthenticated).toBe(false);
    expect(cart.getCount()).toBe(0);
    expect(repository.clear).not.toHaveBeenCalled();
    expect(authService.api.post).toHaveBeenCalledTimes(1);
    expect(document.querySelector("#account-btn-label").textContent).toBe(
      "Đăng nhập",
    );
  });

  it("does not expire a newer login when an old request returns 401 late", async () => {
    await authService.login("fixture@example.invalid", "fixture");
    let finish;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    );
    const pending = new ApiService("/api").post("/cart/items", {});
    authService.api.post.mockResolvedValue({
      user: { id: "user-2", firstName: "New" },
      csrfToken: "new-session",
    });
    await authService.login("other@example.invalid", "fixture");
    finish({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ error: "Invalid token" }),
    });
    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(authService.getCurrentUser().id).toBe("user-2");
    expect(document.querySelector("#account-btn-label").textContent).toBe(
      "New",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(repository.clear).not.toHaveBeenCalled();
  });

  it("shows a reload instruction for rejected CSRF without discarding the identity", async () => {
    await authService.login("fixture@example.invalid", "fixture");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ error: "Invalid or missing CSRF token" }),
      }),
    );
    await expect(
      new ApiService("/api").post("/cart/items", {}),
    ).rejects.toThrow(
      "Phiên bảo mật không còn hợp lệ. Vui lòng tải lại trang rồi thử lại.",
    );
    expect(authService.isAuthenticated).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(repository.clear).not.toHaveBeenCalled();
  });

  it("leaves identity recovery and incorrect-password errors to the auth flow", async () => {
    await authService.login("fixture@example.invalid", "fixture");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ error: "Invalid credentials" }),
      }),
    );
    await expect(
      new ApiService("/api").post("/auth/login", {}),
    ).rejects.toThrow("Invalid credentials");
    expect(authService.isAuthenticated).toBe(true);
    expect(repository.clear).not.toHaveBeenCalled();
  });
});
