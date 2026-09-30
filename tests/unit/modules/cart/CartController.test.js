import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartController } from "../../../../src/modules/cart/CartController.js";
import { CartService } from "../../../../src/modules/cart/CartService.js";
import { CartRenderer } from "../../../../src/modules/cart/CartRenderer.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { authService } from "../../../../src/modules/auth/AuthService.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

vi.mock("../../../../src/modules/cart/CartService.js");
vi.mock("../../../../src/modules/cart/CartRenderer.js");

vi.mock("../../../../src/core/services/EventBus.js", () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));

vi.mock("../../../../src/modules/auth/AuthService.js", () => ({
  authService: {
    isAuthenticated: false,
  },
}));

describe("CartController", () => {
  let controller;
  let service;
  let renderer;

  beforeEach(() => {
    vi.clearAllMocks();

    service = {
      load: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue([]),
      remove: vi.fn().mockResolvedValue([]),
      increase: vi.fn().mockResolvedValue([]),
      decrease: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue([]),
      items: [{ id: "product-1", name: "Product A" }],
      total: 100,
      count: 3,
    };

    renderer = {
      render: vi.fn(),
      updateBadge: vi.fn(),
      setCheckoutEnabled: vi.fn(),
    };

    CartService.mockImplementation(function () {
      return service;
    });

    CartRenderer.mockImplementation(function () {
      return renderer;
    });

    authService.isAuthenticated = false;

    window.authController = {
      requireAuth: vi.fn((callback) => callback()),
    };

    window.toast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    window.flyToCart = undefined;

    document.body.innerHTML = `
      <div id="cart-overlay" class="hidden opacity-0"></div>
      <div id="cart-drawer" class="translate-x-full"></div>
    `;

    controller = new CartController();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.authController;
    delete window.toast;
    delete window.flyToCart;
    document.body.innerHTML = "";
  });

  describe("constructor", () => {
    it("creates service and renderer", () => {
      expect(CartService).toHaveBeenCalledTimes(1);
      expect(CartRenderer).toHaveBeenCalledTimes(1);
      expect(controller.isDrawerOpen).toBe(false);
    });

    it("does not load cart when user is not authenticated", () => {
      expect(service.load).not.toHaveBeenCalled();
    });

    it("loads cart when user is authenticated", () => {
      authService.isAuthenticated = true;

      new CartController();

      expect(service.load).toHaveBeenCalledTimes(1);
    });

    it("registers cart and authentication event listeners", () => {
      expect(eventBus.on).toHaveBeenCalledWith(
        EVENTS.CART_UPDATED,
        expect.any(Function),
      );

      expect(eventBus.on).toHaveBeenCalledWith(
        EVENTS.AUTH_LOGIN,
        expect.any(Function),
      );

      expect(eventBus.on).toHaveBeenCalledWith(
        EVENTS.AUTH_LOGOUT,
        expect.any(Function),
      );
    });

    it("loads cart after login event", () => {
      const callback = eventBus.on.mock.calls.find(
        ([event]) => event === EVENTS.AUTH_LOGIN,
      )[1];

      callback();

      expect(service.load).toHaveBeenCalledTimes(1);
    });

    it("clears cart after logout event", () => {
      const logoutRegistrations = eventBus.on.mock.calls.filter(
        ([event]) => event === EVENTS.AUTH_LOGOUT,
      );

      const callback = logoutRegistrations.at(-1)[1];

      callback();

      expect(service.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe("CART_UPDATED", () => {
    it("renders current cart state", () => {
      const callback = eventBus.on.mock.calls.find(
        ([event]) => event === EVENTS.CART_UPDATED,
      )[1];

      const data = {
        items: [{ id: "product-1" }],
        count: 2,
        isEmpty: false,
      };

      callback(data);

      expect(renderer.render).toHaveBeenCalledWith(data.items);
      expect(renderer.updateBadge).toHaveBeenCalledWith(2);
      expect(renderer.setCheckoutEnabled).toHaveBeenCalledWith(true);
    });

    it("disables checkout when cart is empty", () => {
      const callback = eventBus.on.mock.calls.find(
        ([event]) => event === EVENTS.CART_UPDATED,
      )[1];

      callback({
        items: [],
        count: 0,
        isEmpty: true,
      });

      expect(renderer.setCheckoutEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe("addToCart", () => {
    const product = {
      id: "product-2",
      name: "Product B",
    };

    it("requires authentication before adding", async () => {
      controller.addToCart(product);

      expect(window.authController.requireAuth).toHaveBeenCalledWith(
        expect.any(Function),
      );

      await vi.waitFor(() => {
        expect(service.add).toHaveBeenCalledWith("product-2", 1);
      });
    });

    it("adds product id with custom quantity", async () => {
      controller.addToCart(product, 3);

      await vi.waitFor(() => {
        expect(service.add).toHaveBeenCalledWith("product-2", 3);
      });
    });

    it("shows success toast after adding", async () => {
      controller.addToCart(product);

      await vi.waitFor(() => {
        expect(window.toast.success).toHaveBeenCalledWith(
          "Đã thêm vào giỏ",
          "Product B",
        );
      });
    });

    it("runs fly-to-cart animation after successful add", async () => {
      const flyElement = document.createElement("div");
      const fly = vi.fn();

      window.flyToCart = { fly };

      controller.addToCart(product, 1, flyElement);

      await vi.waitFor(() => {
        expect(fly).toHaveBeenCalledWith(flyElement);
      });
    });

    it("does not require fly-to-cart animation", async () => {
      controller.addToCart(product);

      await vi.waitFor(() => {
        expect(window.toast.success).toHaveBeenCalledWith(
          "Đã thêm vào giỏ",
          "Product B",
        );
      });
    });

    it("shows error toast when add fails", async () => {
      service.add.mockRejectedValue(new Error("Add failed"));

      controller.addToCart(product);

      await vi.waitFor(() => {
        expect(window.toast.error).toHaveBeenCalledWith(
          "Không thể thêm vào giỏ",
          "Add failed",
        );
      });
    });
  });

  describe("cart mutations", () => {
    it("removes item", async () => {
      await controller.removeItem("product-1");

      expect(service.remove).toHaveBeenCalledWith("product-1");
    });

    it("increases item", async () => {
      await controller.increaseItem("product-1");

      expect(service.increase).toHaveBeenCalledWith("product-1");
    });

    it("decreases item", async () => {
      await controller.decreaseItem("product-1");

      expect(service.decrease).toHaveBeenCalledWith("product-1");
    });

    it("clears cart", async () => {
      await controller.clear();

      expect(service.clear).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["removeItem", "remove"],
      ["increaseItem", "increase"],
      ["decreaseItem", "decrease"],
    ])("shows toast when %s fails", async (controllerMethod, serviceMethod) => {
      service[serviceMethod].mockRejectedValue(new Error("Mutation failed"));

      await controller[controllerMethod]("product-1");

      expect(window.toast.error).toHaveBeenCalledWith("Lỗi", "Mutation failed");
    });
  });

  describe("getters", () => {
    it("returns service items", () => {
      expect(controller.getItems()).toBe(service.items);
    });

    it("returns service total", () => {
      expect(controller.getTotal()).toBe(100);
    });

    it("returns service count", () => {
      expect(controller.getCount()).toBe(3);
    });
  });

  describe("DOM cart actions", () => {
    it.each([
      ["remove", "product-1", "remove"],
      ["increase", "product-2", "increase"],
      ["decrease", "product-3", "decrease"],
    ])(
      "handles %s using string product id",
      async (action, id, serviceMethod) => {
        const button = document.createElement("button");
        button.dataset.id = id;
        button.dataset.action = action;
        document.body.appendChild(button);

        button.click();

        await vi.waitFor(() => {
          expect(service[serviceMethod]).toHaveBeenCalledWith(id);
        });
      },
    );

    it("supports clicking a child inside the action element", async () => {
      const button = document.createElement("button");
      button.dataset.id = "product-1";
      button.dataset.action = "remove";

      const child = document.createElement("span");
      button.appendChild(child);
      document.body.appendChild(button);

      child.click();

      await vi.waitFor(() => {
        expect(service.remove).toHaveBeenCalledWith("product-1");
      });
    });

    it("ignores elements without data-id", () => {
      const element = document.createElement("button");
      element.dataset.action = "remove";
      document.body.appendChild(element);

      element.click();

      expect(service.remove).not.toHaveBeenCalled();
    });

    it("ignores unknown actions", () => {
      const element = document.createElement("button");
      element.dataset.id = "product-1";
      element.dataset.action = "unknown";
      document.body.appendChild(element);

      element.click();

      expect(service.remove).not.toHaveBeenCalled();
      expect(service.increase).not.toHaveBeenCalled();
      expect(service.decrease).not.toHaveBeenCalled();
    });
  });

  describe("openDrawer", () => {
    it("opens drawer", () => {
      const raf = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((callback) => {
          callback();
          return 1;
        });

      controller.openDrawer();

      const overlay = document.getElementById("cart-overlay");
      const drawer = document.getElementById("cart-drawer");

      expect(overlay.classList.contains("hidden")).toBe(false);
      expect(overlay.classList.contains("opacity-0")).toBe(false);
      expect(drawer.classList.contains("translate-x-full")).toBe(false);
      expect(controller.isDrawerOpen).toBe(true);
      expect(document.body.style.overflow).toBe("hidden");
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.DRAWER_OPENED);

      raf.mockRestore();
    });

    it("does nothing when already open", () => {
      controller.isDrawerOpen = true;

      controller.openDrawer();

      expect(eventBus.emit).not.toHaveBeenCalledWith(EVENTS.DRAWER_OPENED);
    });

    it("does nothing when required DOM elements are missing", () => {
      document.body.innerHTML = "";

      controller.openDrawer();

      expect(controller.isDrawerOpen).toBe(false);
      expect(eventBus.emit).not.toHaveBeenCalledWith(EVENTS.DRAWER_OPENED);
    });
  });

  describe("closeDrawer", () => {
    beforeEach(() => {
      controller.isDrawerOpen = true;

      document.getElementById("cart-overlay").classList.remove("hidden");
      document.getElementById("cart-overlay").classList.remove("opacity-0");
      document
        .getElementById("cart-drawer")
        .classList.remove("translate-x-full");

      document.body.style.overflow = "hidden";
    });

    it("closes drawer", () => {
      vi.useFakeTimers();

      controller.closeDrawer();

      const overlay = document.getElementById("cart-overlay");
      const drawer = document.getElementById("cart-drawer");

      expect(overlay.classList.contains("opacity-0")).toBe(true);
      expect(drawer.classList.contains("translate-x-full")).toBe(true);
      expect(controller.isDrawerOpen).toBe(false);
      expect(document.body.style.overflow).toBe("");
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.DRAWER_CLOSED);

      vi.advanceTimersByTime(300);

      expect(overlay.classList.contains("hidden")).toBe(true);
    });

    it("does nothing when already closed", () => {
      controller.isDrawerOpen = false;

      controller.closeDrawer();

      expect(eventBus.emit).not.toHaveBeenCalledWith(EVENTS.DRAWER_CLOSED);
    });

    it("does nothing when required DOM elements are missing", () => {
      document.body.innerHTML = "";

      controller.closeDrawer();

      expect(controller.isDrawerOpen).toBe(true);
      expect(eventBus.emit).not.toHaveBeenCalledWith(EVENTS.DRAWER_CLOSED);
    });
  });
});
