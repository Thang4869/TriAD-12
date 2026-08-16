import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { CartController } from "../../../../src/modules/cart/CartController.js";
import { CartService } from "../../../../src/modules/cart/CartService.js";
import { CartRenderer } from "../../../../src/modules/cart/CartRenderer.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

vi.mock("../../../../src/modules/cart/CartService.js");
vi.mock("../../../../src/modules/cart/CartRenderer.js");
vi.mock("../../../../src/core/services/EventBus.js", () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));
vi.mock("../../../../src/shared/constants/Events.js", () => ({
  EVENTS: {
    CART_UPDATED: "cart:updated",
    CART_ITEM_ADDED: "cart:item:added",
    CART_ITEM_REMOVED: "cart:item:removed",
    CART_CLEARED: "cart:cleared",
    DRAWER_OPENED: "drawer:opened",
    DRAWER_CLOSED: "drawer:closed",
  },
}));

describe("CartController", () => {
  let controller;
  let mockService;
  let mockRenderer;
  let mockEventBus;

  beforeEach(() => {
    mockService = {
      load: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
      increase: vi.fn(),
      decrease: vi.fn(),
      clear: vi.fn(),
      get items() {
        return [{ id: 1, name: "Product A" }];
      },
      get total() {
        return 100;
      },
      get count() {
        return 3;
      },
    };
    CartService.mockImplementation(() => mockService);

    mockRenderer = {
      render: vi.fn(),
      updateBadge: vi.fn(),
      setCheckoutEnabled: vi.fn(),
    };
    CartRenderer.mockImplementation(() => mockRenderer);

    mockEventBus = {
      on: vi.fn(),
      emit: vi.fn(),
    };
    eventBus.on = mockEventBus.on;
    eventBus.emit = mockEventBus.emit;

    document.body.innerHTML = `
      <div id="cart-overlay"></div>
      <div id="cart-drawer"></div>
      <div class="cart-scroll"></div>
      <div id="cart-total"></div>
      <button id="checkout-btn"></button>
    `;

    controller = new CartController();
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("constructor", () => {
    test("should initialize service, renderer and load cart", () => {
      expect(CartService).toHaveBeenCalledTimes(1);
      expect(CartRenderer).toHaveBeenCalledTimes(1);
      expect(mockService.load).toHaveBeenCalled();
      expect(controller.isDrawerOpen).toBe(false);
    });

    test("should set up event listeners", () => {
      expect(mockEventBus.on).toHaveBeenCalledWith(
        EVENTS.CART_UPDATED,
        expect.any(Function),
      );
    });
  });

  describe("addToCart", () => {
    const product = { id: 2, name: "Product B" };

    test("should add product with default quantity 1", () => {
      controller.addToCart(product);
      expect(mockService.add).toHaveBeenCalledWith(product, 1);
    });

    test("should add product with custom quantity", () => {
      controller.addToCart(product, 3);
      expect(mockService.add).toHaveBeenCalledWith(product, 3);
    });

    test("should call flyToCart if flyElement provided and window.flyToCart exists", () => {
      const flyMock = vi.fn();
      window.flyToCart = { fly: flyMock };
      const flyElement = document.createElement("div");
      controller.addToCart(product, 1, flyElement);
      expect(flyMock).toHaveBeenCalledWith(flyElement);
      delete window.flyToCart;
    });

    test("should not fail if flyElement provided but window.flyToCart is undefined", () => {
      const originalFly = window.flyToCart;
      window.flyToCart = undefined;
      const flyElement = document.createElement("div");
      expect(() => controller.addToCart(product, 1, flyElement)).not.toThrow();
      window.flyToCart = originalFly;
    });
  });

  describe("removeItem", () => {
    test("should call service.remove with id", () => {
      controller.removeItem(5);
      expect(mockService.remove).toHaveBeenCalledWith(5);
    });
  });

  describe("increaseItem", () => {
    test("should call service.increase with id and return items", () => {
      mockService.increase.mockReturnValue(mockService.items);
      const result = controller.increaseItem(5);
      expect(mockService.increase).toHaveBeenCalledWith(5);
      expect(result).toStrictEqual(mockService.items);
    });
  });

  describe("decreaseItem", () => {
    test("should call service.decrease with id", () => {
      mockService.decrease.mockReturnValue(mockService.items);
      const result = controller.decreaseItem(5);
      expect(mockService.decrease).toHaveBeenCalledWith(5);
      expect(result).toStrictEqual(mockService.items);
    });
  });

  describe("clear", () => {
    test("should call service.clear", () => {
      controller.clear();
      expect(mockService.clear).toHaveBeenCalled();
    });
  });

  describe("getters", () => {
    test("getItems returns service.items", () => {
      expect(controller.getItems()).toStrictEqual(mockService.items);
    });

    test("getTotal returns service.total", () => {
      expect(controller.getTotal()).toBe(100);
    });

    test("getCount returns service.count", () => {
      expect(controller.getCount()).toBe(3);
    });
  });

  describe("openDrawer", () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="cart-overlay" class="hidden"></div>
        <div id="cart-drawer" class="translate-x-full"></div>
      `;
      controller = new CartController();
      vi.clearAllMocks();
    });

    test("should not open if already open", () => {
      controller.isDrawerOpen = true;
      const overlay = document.getElementById("cart-overlay");
      overlay.classList.remove("hidden");
      controller.openDrawer();
      expect(overlay.classList.contains("hidden")).toBe(false);
      expect(document.body.style.overflow).not.toBe("hidden");
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    test("should return early if overlay or drawer missing", () => {
      document.body.innerHTML = "";
      controller = new CartController();
      vi.clearAllMocks();
      expect(() => controller.openDrawer()).not.toThrow();
      expect(document.body.style.overflow).not.toBe("hidden");
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    test("should open drawer and set body overflow hidden", () => {
      const overlay = document.getElementById("cart-overlay");
      const drawer = document.getElementById("cart-drawer");
      expect(overlay.classList.contains("hidden")).toBe(true);
      expect(drawer.classList.contains("translate-x-full")).toBe(true);

      const raf = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((cb) => cb());

      controller.openDrawer();

      expect(overlay.classList.contains("hidden")).toBe(false);
      expect(overlay.classList.contains("opacity-0")).toBe(false);
      expect(drawer.classList.contains("translate-x-full")).toBe(false);
      expect(document.body.style.overflow).toBe("hidden");
      expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.DRAWER_OPENED);
      raf.mockRestore();
    });

    test("should emit DRAWER_OPENED event", () => {
      const raf = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((cb) => cb());
      controller.openDrawer();
      expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.DRAWER_OPENED);
      raf.mockRestore();
    });
  });

  describe("closeDrawer", () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="cart-overlay" class="opacity-0 hidden"></div>
        <div id="cart-drawer" class="translate-x-full"></div>
      `;
      controller = new CartController();
      controller.isDrawerOpen = true;
      vi.clearAllMocks();
    });

    test("should not close if already closed", () => {
      controller.isDrawerOpen = false;
      const overlay = document.getElementById("cart-overlay");
      const drawer = document.getElementById("cart-drawer");
      overlay.classList.remove("hidden");
      drawer.classList.remove("translate-x-full");
      controller.closeDrawer();
      expect(overlay.classList.contains("hidden")).toBe(false);
      expect(drawer.classList.contains("translate-x-full")).toBe(false);
      expect(document.body.style.overflow).not.toBe("");
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    test("should return early if overlay or drawer missing", () => {
      document.body.innerHTML = "";
      controller = new CartController();
      controller.isDrawerOpen = true;
      expect(() => controller.closeDrawer()).not.toThrow();
    });

    test("should close drawer and restore body overflow", () => {
      const overlay = document.getElementById("cart-overlay");
      const drawer = document.getElementById("cart-drawer");
      overlay.classList.remove("hidden");
      drawer.classList.remove("translate-x-full");

      const raf = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((cb) => cb());

      vi.useFakeTimers();
      controller.closeDrawer();

      expect(overlay.classList.contains("opacity-0")).toBe(true);
      expect(drawer.classList.contains("translate-x-full")).toBe(true);

      vi.advanceTimersByTime(300);
      expect(overlay.classList.contains("hidden")).toBe(true);
      expect(document.body.style.overflow).toBe("");
      expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.DRAWER_CLOSED);

      raf.mockRestore();
      vi.useRealTimers();
    });

    test("should emit DRAWER_CLOSED event", () => {
      const raf = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((cb) => cb());
      vi.useFakeTimers();
      controller.closeDrawer();
      vi.advanceTimersByTime(300);
      expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.DRAWER_CLOSED);
      raf.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("DOM event listeners", () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="cart-scroll">
          <div data-id="1" data-action="remove">Remove</div>
          <div data-id="2" data-action="increase">+</div>
          <div data-id="3" data-action="decrease">-</div>
        </div>
      `;
      controller = new CartController();
      mockService.remove = vi.fn();
      mockService.increase = vi.fn();
      mockService.decrease = vi.fn();
    });

    test("should handle remove action on click", () => {
      const removeBtn = document.querySelector('[data-action="remove"]');
      removeBtn.click();
      expect(mockService.remove).toHaveBeenCalledWith(1);
    });

    test("should handle increase action on click", () => {
      const incBtn = document.querySelector('[data-action="increase"]');
      incBtn.click();
      expect(mockService.increase).toHaveBeenCalledWith(2);
    });

    test("should handle decrease action on click", () => {
      const decBtn = document.querySelector('[data-action="decrease"]');
      decBtn.click();
      expect(mockService.decrease).toHaveBeenCalledWith(3);
    });

    test("should ignore click without data-id", () => {
      const noId = document.createElement("div");
      noId.setAttribute("data-action", "remove");
      document.body.appendChild(noId);
      noId.click();
      expect(mockService.remove).not.toHaveBeenCalled();
    });

    test("should ignore click with unknown action", () => {
      const unknown = document.createElement("div");
      unknown.setAttribute("data-id", "5");
      unknown.setAttribute("data-action", "unknown");
      document.body.appendChild(unknown);
      unknown.click();
      expect(mockService.remove).not.toHaveBeenCalled();
      expect(mockService.increase).not.toHaveBeenCalled();
      expect(mockService.decrease).not.toHaveBeenCalled();
    });
  });

  describe("CART_UPDATED event handler", () => {
    test("should render items, update badge and set checkout enabled", () => {
      const callback = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EVENTS.CART_UPDATED,
      )[1];

      const data = {
        items: [{ id: 1 }],
        count: 5,
        isEmpty: false,
      };
      callback(data);

      expect(mockRenderer.render).toHaveBeenCalledWith(data.items);
      expect(mockRenderer.updateBadge).toHaveBeenCalledWith(5);
      expect(mockRenderer.setCheckoutEnabled).toHaveBeenCalledWith(true);
    });

    test("should disable checkout when cart is empty", () => {
      const callback = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EVENTS.CART_UPDATED,
      )[1];

      const data = {
        items: [],
        count: 0,
        isEmpty: true,
      };
      callback(data);

      expect(mockRenderer.setCheckoutEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe("Edge cases - ID not found", () => {
    test("increaseItem should return items unchanged if id not found", () => {
      mockService.increase.mockReturnValue(mockService.items);
      const result = controller.increaseItem(999);
      expect(mockService.increase).toHaveBeenCalledWith(999);
      expect(result).toStrictEqual(mockService.items);
    });

    test("decreaseItem should return items unchanged if id not found", () => {
      mockService.decrease.mockReturnValue(mockService.items);
      const result = controller.decreaseItem(999);
      expect(mockService.decrease).toHaveBeenCalledWith(999);
      expect(result).toStrictEqual(mockService.items);
    });
  });
});
