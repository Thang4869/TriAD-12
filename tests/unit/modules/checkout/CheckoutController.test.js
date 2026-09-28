import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CheckoutController } from "../../../../src/modules/checkout/CheckoutController.js";
import { CheckoutService } from "../../../../src/modules/checkout/CheckoutService.js";
import { CheckoutValidator } from "../../../../src/modules/checkout/CheckoutValidator.js";
import { CheckoutRenderer } from "../../../../src/modules/checkout/CheckoutRenderer.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";

vi.mock("../../../../src/modules/checkout/CheckoutService.js");
vi.mock("../../../../src/modules/checkout/CheckoutValidator.js");
vi.mock("../../../../src/modules/checkout/CheckoutRenderer.js");

describe("CheckoutController", () => {
  let controller;
  let mockCartController;
  let mockToast;
  let mockNotifications;
  let mockProductsController;
  let mockServiceInstance;
  let mockValidatorInstance;
  let mockRendererInstance;
  let mockEventBusEmit;

  beforeEach(() => {
    window.authController = {
      requireAuth: vi.fn((callback) => callback()),
    };
    vi.stubGlobal("requestAnimationFrame", (cb) => cb());

    document.body.innerHTML = `
      <button id="checkout-btn"></button>
      <button id="close-checkout-btn"></button>
      <form id="checkout-form">
        <input id="first-name" value="John">
        <input id="last-name" value="Doe">
        <input id="email" value="john@example.com">
        <input id="phone" value="0123456789">
        <input id="address" value="123 Main St">
        <div id="card-details" class="hidden"></div>
        <input type="radio" name="payment" value="cod" checked>
        <input type="radio" name="payment" value="card">
        <input id="card-number" value="1234567890123456">
        <input id="card-expiry" value="12/25">
        <input id="card-cvv" value="123">
        <button type="submit">Place Order</button>
      </form>
      <div id="checkout-modal" class="hidden opacity-0">
        <div class="bg-white scale-95"></div>
      </div>
      <div id="success-modal" class="hidden opacity-0">
        <div class="bg-white scale-95"></div>
      </div>
      <button id="success-close-btn"></button>
      <div id="checkout-items"></div>
      <span id="checkout-total"></span>
    `;

    mockServiceInstance = {
      checkout: vi.fn().mockResolvedValue({
        id: "order-123",
        orderNumber: "ORD-123",
      }),
    };
    mockValidatorInstance = {
      validate: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
    };
    mockRendererInstance = {
      renderSummary: vi.fn(),
    };

    CheckoutService.mockImplementation(() => mockServiceInstance);
    CheckoutValidator.mockImplementation(() => mockValidatorInstance);
    CheckoutRenderer.mockImplementation(() => mockRendererInstance);

    mockCartController = {
      getItems: vi.fn().mockReturnValue([]),
      clear: vi.fn(),
      closeDrawer: vi.fn(),
    };
    window.cartController = mockCartController;

    mockToast = {
      warning: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
    };
    window.toast = mockToast;

    mockNotifications = {
      add: vi.fn(),
    };
    window.notifications = mockNotifications;

    mockProductsController = {
      resetFilters: vi.fn(),
    };
    window.productsController = mockProductsController;

    mockEventBusEmit = vi.spyOn(eventBus, "emit");

    controller = new CheckoutController();

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
    delete window.authController;
    delete window.cartController;
    delete window.toast;
    delete window.notifications;
    delete window.productsController;
    mockEventBusEmit.mockRestore();
  });

  describe("constructor", () => {
    it("should initialize services and setup event listeners", () => {
      expect(controller.service).toBe(mockServiceInstance);
      expect(controller.validator).toBe(mockValidatorInstance);
      expect(controller.renderer).toBe(mockRendererInstance);
      expect(controller.items).toEqual([]);
    });
  });

  describe("setupEventListeners", () => {
    it("should attach event listeners to DOM elements", () => {
      const btn = document.getElementById("checkout-btn");
      const spy = vi.spyOn(controller, "openCheckout");
      btn.click();
      expect(spy).toHaveBeenCalled();
      expect(window.authController.requireAuth).toHaveBeenCalled();

      const closeBtn = document.getElementById("close-checkout-btn");
      const closeSpy = vi.spyOn(controller, "closeCheckout");
      closeBtn.click();
      expect(closeSpy).toHaveBeenCalled();

      const form = document.getElementById("checkout-form");
      const submitSpy = vi.spyOn(controller, "handleSubmit");
      form.dispatchEvent(new Event("submit", { cancelable: true }));
      expect(submitSpy).toHaveBeenCalled();

      const radios = document.querySelectorAll('input[name="payment"]');
      const toggleSpy = vi.spyOn(controller, "toggleCardDetails");
      radios.forEach((radio) => {
        radio.dispatchEvent(new Event("change"));
      });
      expect(toggleSpy).toHaveBeenCalled();

      const successClose = document.getElementById("success-close-btn");
      const successSpy = vi.spyOn(controller, "closeSuccess");
      successClose.click();
      expect(successSpy).toHaveBeenCalled();
    });

    it("should handle initialization smoothly when DOM elements are missing", () => {
      document.body.innerHTML = "";
      expect(() => new CheckoutController()).not.toThrow();
    });
  });

  describe("openCheckout", () => {
    it("should show warning toast if cart is empty", () => {
      mockCartController.getItems.mockReturnValue([]);
      controller.openCheckout();
      expect(mockToast.warning).toHaveBeenCalledWith(
        "Giỏ hàng trống",
        "Vui lòng thêm sản phẩm trước khi thanh toán.",
      );
      expect(mockRendererInstance.renderSummary).not.toHaveBeenCalled();
      expect(
        document.getElementById("checkout-modal").classList.contains("hidden"),
      ).toBe(true);
    });

    it("should handle empty cart when window.toast is undefined", () => {
      delete window.toast;
      mockCartController.getItems.mockReturnValue([]);
      expect(() => controller.openCheckout()).not.toThrow();
    });

    it("should open checkout modal with cart items and trigger animation", () => {
      const items = [{ id: 1, name: "Product", quantity: 1, subtotal: 100000 }];
      mockCartController.getItems.mockReturnValue(items);
      controller.openCheckout();

      expect(mockRendererInstance.renderSummary).toHaveBeenCalledWith(items);
      expect(controller.items).toBe(items);
      const modal = document.getElementById("checkout-modal");
      const content = modal.querySelector(".bg-white");

      expect(modal.classList.contains("hidden")).toBe(false);
      expect(modal.classList.contains("opacity-0")).toBe(false);
      expect(content.classList.contains("scale-95")).toBe(false);
      expect(document.body.style.overflow).toBe("hidden");
      expect(mockEventBusEmit).toHaveBeenCalledWith(EVENTS.CHECKOUT_STARTED);
    });

    it("should handle openCheckout when window.cartController is undefined", () => {
      delete window.cartController;
      controller.openCheckout();
      expect(mockToast.warning).toHaveBeenCalledWith(
        "Giỏ hàng trống",
        "Vui lòng thêm sản phẩm trước khi thanh toán.",
      );
    });
  });

  describe("closeCheckout", () => {
    it("should close checkout modal and reset overflow", () => {
      const modal = document.getElementById("checkout-modal");
      const content = modal.querySelector(".bg-white");
      modal.classList.remove("hidden", "opacity-0");
      content.classList.remove("scale-95");
      document.body.style.overflow = "hidden";

      controller.closeCheckout();

      expect(modal.classList.contains("opacity-0")).toBe(true);
      expect(content.classList.contains("scale-95")).toBe(true);

      vi.runAllTimers();

      expect(modal.classList.contains("hidden")).toBe(true);
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("handleSubmit", () => {
    it("should prevent default and validate form", async () => {
      const event = new Event("submit", { cancelable: true });
      const preventDefault = vi.spyOn(event, "preventDefault");
      await controller.handleSubmit(event);
      expect(preventDefault).toHaveBeenCalled();
      expect(mockValidatorInstance.validate).toHaveBeenCalled();
    });

    it("should show error toast if validation fails", async () => {
      mockValidatorInstance.validate.mockReturnValue({
        isValid: false,
        errors: ["Error 1", "Error 2"],
      });
      const event = new Event("submit", { cancelable: true });
      await controller.handleSubmit(event);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Thông tin chưa hợp lệ",
        "Error 1, Error 2",
      );
      expect(mockServiceInstance.checkout).not.toHaveBeenCalled();
    });

    it("should handle validation error when window.toast is undefined", () => {
      delete window.toast;
      mockValidatorInstance.validate.mockReturnValue({
        isValid: false,
        errors: ["Error 1"],
      });
      const event = new Event("submit", { cancelable: true });
      expect(() => controller.handleSubmit(event)).not.toThrow();
    });

    it("should process checkout successfully with all window objects available", async () => {
      const items = [
        { id: 1, name: "Product 1", quantity: 2, subtotal: 200000 },
        { id: 2, name: "Product 2", quantity: 1, subtotal: 100000 },
      ];
      controller.items = items;
      mockValidatorInstance.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      const order = {
        id: "order-456",
        orderNumber: "ORD-456",
      };

      mockServiceInstance.checkout.mockResolvedValue(order);

      const event = new Event("submit", { cancelable: true });
      await controller.handleSubmit(event);

      expect(mockToast.info).toHaveBeenCalledWith(
        "Đang xử lý",
        "Vui lòng chờ trong giây lát...",
      );

      vi.advanceTimersByTime(1500);

      expect(mockServiceInstance.checkout).toHaveBeenCalled();
      expect(mockCartController.clear).toHaveBeenCalled();
      expect(mockCartController.closeDrawer).toHaveBeenCalled();
      expect(mockNotifications.add).toHaveBeenCalledWith(
        "Đặt hàng thành công!",
        "Đơn ORD-456 đã được xác nhận. Cảm ơn bạn!",
        "success",
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        "Đặt hàng thành công!",
        "Đơn ORD-456.",
      );
      expect(
        document.getElementById("success-modal").classList.contains("hidden"),
      ).toBe(false);
    });

    it("should process checkout successfully when optional window objects are undefined", async () => {
      delete window.toast;
      delete window.cartController;
      delete window.notifications;

      controller.items = [{ id: 1, name: "Item", quantity: 1, subtotal: 100 }];
      mockValidatorInstance.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockServiceInstance.checkout.mockReturnValue({ id: "ORD-789" });

      const event = new Event("submit", { cancelable: true });
      await controller.handleSubmit(event);

      expect(mockServiceInstance.checkout).toHaveBeenCalled();
    });

    it("should handle fallback paymentMethod when radio is not checked", async () => {
      document
        .querySelectorAll('input[name="payment"]')
        .forEach((r) => (r.checked = false));

      const event = new Event("submit", { cancelable: true });
      await controller.handleSubmit(event);

      expect(mockValidatorInstance.validate).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: "COD" }),
      );
    });

    it("should handle error during checkout execution", async () => {
      mockValidatorInstance.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockServiceInstance.checkout.mockImplementation(() => {
        throw new Error("Service failure");
      });

      const event = new Event("submit", { cancelable: true });
      await controller.handleSubmit(event);

      vi.advanceTimersByTime(1500);

      expect(mockToast.error).toHaveBeenCalledWith(
        "Lỗi",
        "Không thể xử lý đơn hàng. Vui lòng thử lại.",
      );
      expect(mockNotifications.add).toHaveBeenCalledWith(
        "Đặt hàng thất bại",
        "Không thể xử lý đơn hàng. Vui lòng thử lại.",
        "warning",
      );
    });

    it("should handle error during checkout when toast and notifications are undefined", async () => {
      delete window.toast;
      delete window.notifications;

      mockValidatorInstance.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockServiceInstance.checkout.mockImplementation(() => {
        throw new Error("Service failure");
      });

      const event = new Event("submit", { cancelable: true });
      await controller.handleSubmit(event);

      expect(() => vi.advanceTimersByTime(1500)).not.toThrow();
    });
  });

  describe("showSuccess", () => {
    it("should display success modal and update styles", () => {
      const modal = document.getElementById("success-modal");
      const content = modal.querySelector(".bg-white");

      controller.showSuccess("ORD-123");

      expect(modal.classList.contains("hidden")).toBe(false);
      expect(modal.classList.contains("opacity-0")).toBe(false);
      expect(content.classList.contains("scale-95")).toBe(false);
      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  describe("closeSuccess", () => {
    it("should close success modal and reset filters", () => {
      const modal = document.getElementById("success-modal");
      modal.classList.remove("hidden", "opacity-0");
      document.body.style.overflow = "hidden";

      controller.closeSuccess();
      expect(modal.classList.contains("opacity-0")).toBe(true);

      vi.runAllTimers();

      expect(modal.classList.contains("hidden")).toBe(true);
      expect(document.body.style.overflow).toBe("");
      expect(mockProductsController.resetFilters).toHaveBeenCalled();
    });

    it("should close success modal when window.productsController is undefined", () => {
      delete window.productsController;

      controller.closeSuccess();
      vi.runAllTimers();

      expect(
        document.getElementById("success-modal").classList.contains("hidden"),
      ).toBe(true);
    });
  });

  describe("toggleCardDetails", () => {
    it("should show card details when payment method is card", () => {
      const cardDetails = document.getElementById("card-details");
      cardDetails.classList.add("hidden");

      document.querySelector('input[value="card"]').checked = true;
      controller.toggleCardDetails();
      expect(cardDetails.classList.contains("hidden")).toBe(false);
    });

    it("should hide card details when payment method is not card", () => {
      const cardDetails = document.getElementById("card-details");
      cardDetails.classList.remove("hidden");

      document.querySelector('input[name="payment"][value="cod"]').checked =
        true;
      controller.toggleCardDetails();

      expect(cardDetails.classList.contains("hidden")).toBe(true);
    });

    it("should handle toggleCardDetails when no radio is checked", () => {
      const cardDetails = document.getElementById("card-details");
      document
        .querySelectorAll('input[name="payment"]')
        .forEach((r) => (r.checked = false));

      controller.toggleCardDetails();
      expect(cardDetails.classList.contains("hidden")).toBe(true);
    });
  });
});
