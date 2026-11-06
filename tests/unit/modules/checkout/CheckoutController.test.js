import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CheckoutController } from "../../../../src/modules/checkout/CheckoutController.js";
import { CheckoutService } from "../../../../src/modules/checkout/CheckoutService.js";
import { CheckoutValidator } from "../../../../src/modules/checkout/CheckoutValidator.js";
import { CheckoutRenderer } from "../../../../src/modules/checkout/CheckoutRenderer.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { ApiError } from "../../../../src/shared/services/api.service.js";

vi.mock("../../../../src/modules/checkout/CheckoutService.js");
vi.mock("../../../../src/modules/checkout/CheckoutRenderer.js");

describe("CheckoutController", () => {
  let controller;
  let mockCartController;
  let mockToast;
  let mockNotifications;
  let mockProductsController;
  let mockServiceInstance;
  let mockRendererInstance;
  let mockEventBusEmit;

  beforeEach(() => {
    vi.useFakeTimers();

    window.authController = {
      requireAuth: vi.fn((callback) => callback()),
    };

    vi.stubGlobal("requestAnimationFrame", (cb) => cb());

    document.body.innerHTML = `
      <button id="checkout-btn"></button>
      <button id="close-checkout-btn"></button>
      <form id="checkout-form">
        <input id="phone" value="0123456789">
        <input id="address" value="123 Main St">
        <textarea id="notes"></textarea>
        <input id="discount-code">
        <button id="apply-discount-btn" type="button">Apply</button>
        <input type="radio" name="payment" value="cod" checked>
        <button type="submit">Place Order</button>
      </form>
      <div id="checkout-modal" class="hidden opacity-0">
        <div class="bg-white scale-95"></div>
      </div>
      <div id="success-modal" class="hidden opacity-0">
        <div class="bg-white scale-95"></div>
        <span id="success-order-id"></span>
      </div>
      <button id="success-close-btn"></button>
      <div id="checkout-items"></div>
      <span id="checkout-total"></span>
    `;

    mockServiceInstance = {
      getQuote: vi.fn().mockResolvedValue({
        subtotal: 150000,
        tax: 15000,
        shippingFee: 30000,
        discountAmount: 0,
        total: 195000,
      }),
      checkout: vi.fn().mockResolvedValue({
        id: "order-123",
        orderNumber: "ORD-123",
      }),
    };
    mockRendererInstance = {
      renderSummary: vi.fn(),
      renderSuccessPricing: vi.fn(),
      renderQuote: vi.fn(),
      renderQuoteStatus: vi.fn(),
    };

    CheckoutService.mockImplementation(function () {
      return mockServiceInstance;
    });

    CheckoutRenderer.mockImplementation(function () {
      return mockRendererInstance;
    });

    mockCartController = {
      getItems: vi.fn().mockReturnValue([]),
      clear: vi.fn(),
      resetLocal: vi.fn(),
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
      expect(controller.validator).toBeInstanceOf(CheckoutValidator);
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
      const submitSpy = vi
        .spyOn(controller, "handleSubmit")
        .mockResolvedValue();
      form.dispatchEvent(new Event("submit", { cancelable: true }));
      expect(submitSpy).toHaveBeenCalled();

      const successClose = document.getElementById("success-close-btn");
      const successSpy = vi.spyOn(controller, "closeSuccess");
      successClose.click();
      expect(successSpy).toHaveBeenCalled();
    });

    it("should load a quote when the discount update button is clicked", () => {
      const loadQuote = vi.spyOn(controller, "loadQuote").mockResolvedValue(false);

      document.getElementById("apply-discount-btn").click();

      expect(loadQuote).toHaveBeenCalledTimes(1);
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

    it("should create one idempotency key for the checkout modal attempt", async () => {
      const items = [{ id: 1, name: "Product", quantity: 1, subtotal: 100000 }];
      mockCartController.getItems.mockReturnValue(items);
      const randomUUID = vi.spyOn(crypto, "randomUUID");

      await controller.openCheckout();
      const firstKey = controller.idempotencyKey;
      await controller.openCheckout();

      expect(firstKey).toBeTruthy();
      expect(controller.idempotencyKey).toBe(firstKey);
      expect(randomUUID).toHaveBeenCalledTimes(1);
      randomUUID.mockRestore();
    });

    it("should stop opening checkout while a submission is in progress", () => {
      controller.isSubmitting = true;

      controller.openCheckout();

      expect(mockCartController.getItems).not.toHaveBeenCalled();
      expect(mockRendererInstance.renderSummary).not.toHaveBeenCalled();
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

  describe("updateSubmitState", () => {
    it("should update optional controls and both quote-loading states", () => {
      const applyButton = document.getElementById("apply-discount-btn");

      controller.isSubmitting = false;
      controller.isLoadingQuote = false;
      controller.updateSubmitState();
      expect(applyButton.disabled).toBe(false);

      controller.isLoadingQuote = true;
      controller.updateSubmitState();
      expect(applyButton.disabled).toBe(true);

      controller.isSubmitting = true;
      controller.isLoadingQuote = false;
      controller.updateSubmitState();
      expect(applyButton.disabled).toBe(true);
    });

    it("should tolerate missing optional submit and discount controls", () => {
      document
        .querySelector('#checkout-form button[type="submit"]')
        .remove();
      document.getElementById("discount-code").remove();

      expect(() => controller.updateSubmitState()).not.toThrow();
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
    beforeEach(() => {
      controller.quote = {
        subtotal: 150000,
        tax: 15000,
        shippingFee: 30000,
        discountAmount: 0,
        total: 195000,
      };
      controller.quoteDiscountCode = undefined;
    });
    it("should prevent default and validate form", async () => {
      const event = new Event("submit", { cancelable: true });
      const preventDefault = vi.spyOn(event, "preventDefault");
      await controller.handleSubmit(event);
      expect(preventDefault).toHaveBeenCalled();
      expect(mockServiceInstance.checkout).toHaveBeenCalledWith(
        {
          address: "123 Main St",
          phone: "0123456789",
          notes: undefined,
          discountCode: undefined,
          paymentMethod: "COD",
          expectedTotal: 195000,
        },
        null,
      );
    });

    it("should show error toast if validation fails", async () => {
      document.getElementById("phone").value = "123";
      const event = new Event("submit", { cancelable: true });
      await controller.handleSubmit(event);
      expect(mockToast.error).toHaveBeenCalledWith(
        "Thông tin chưa hợp lệ",
        "Invalid phone number (10-12 digits)",
      );
      expect(mockServiceInstance.checkout).not.toHaveBeenCalled();
    });

    it("should handle validation error when window.toast is undefined", () => {
      delete window.toast;
      document.getElementById("phone").value = "123";
      const event = new Event("submit", { cancelable: true });
      expect(() => controller.handleSubmit(event)).not.toThrow();
    });

    it("should process checkout successfully with all window objects available", async () => {
      const items = [
        { id: 1, name: "Product 1", quantity: 2, subtotal: 200000 },
        { id: 2, name: "Product 2", quantity: 1, subtotal: 100000 },
      ];
      controller.items = items;
      const order = {
        id: "order-456",
        orderNumber: "ORD-456",
        subtotal: 300000,
        tax: 30000,
        shippingFee: 30000,
        discountAmount: 0,
        discountCode: null,
        total: 360000,
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
      expect(mockRendererInstance.renderSuccessPricing).toHaveBeenCalledWith(
        order,
      );
      expect(mockCartController.resetLocal).toHaveBeenCalledTimes(1);
      expect(mockCartController.clear).not.toHaveBeenCalled();
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

      expect(mockServiceInstance.checkout).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: "COD" }),
        null,
      );
    });

    it("should normalize optional notes and discount code in the current payload", async () => {
      document.getElementById("notes").value = "  Leave at the front desk  ";
      document.getElementById("discount-code").value = "  SAVE10  ";
      controller.quoteDiscountCode = "SAVE10";

      await controller.handleSubmit(new Event("submit", { cancelable: true }));

      expect(mockServiceInstance.checkout).toHaveBeenCalledWith(
        {
          address: "123 Main St",
          phone: "0123456789",
          notes: "Leave at the front desk",
          discountCode: "SAVE10",
          paymentMethod: "COD",
          expectedTotal: 195000,
        },
        null,
      );
    });

    it("should reject a missing address without requesting checkout", async () => {
      document.getElementById("address").value = "   ";

      await controller.handleSubmit(new Event("submit", { cancelable: true }));

      expect(mockToast.error).toHaveBeenCalledWith(
        "Thông tin chưa hợp lệ",
        "Address is required",
      );
      expect(mockServiceInstance.checkout).not.toHaveBeenCalled();
    });

    it("should reuse the same idempotency key when checkout is retried", async () => {
      mockServiceInstance.checkout
        .mockRejectedValueOnce(new ApiError("Network failure", 0))
        .mockResolvedValueOnce({
          id: "order-123",
          orderNumber: "ORD-123",
        });

      mockCartController.getItems.mockReturnValue([
        { id: 1, name: "Product", quantity: 1, subtotal: 100000 },
      ]);
      await controller.openCheckout();
      const firstKey = controller.idempotencyKey;

      const firstEvent = new Event("submit", { cancelable: true });
      await controller.handleSubmit(firstEvent);

      expect(controller.idempotencyKey).toBe(firstKey);
      expect(mockCartController.resetLocal).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith(
        "Lỗi",
        "Không xác định được trạng thái đơn hàng. Vui lòng thử lại để kiểm tra đơn đã được xử lý hay chưa.",
      );

      const secondEvent = new Event("submit", { cancelable: true });
      await controller.handleSubmit(secondEvent);

      expect(mockServiceInstance.checkout).toHaveBeenCalledTimes(2);

      expect(mockServiceInstance.checkout.mock.calls[0][1]).toBe(
        firstKey,
      );

      expect(mockServiceInstance.checkout.mock.calls[1][1]).toBe(
        firstKey,
      );
      expect(mockCartController.resetLocal).toHaveBeenCalledTimes(1);
    });

    it("should handle error during checkout execution", async () => {
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
      mockServiceInstance.checkout.mockImplementation(() => {
        throw new Error("Service failure");
      });

      const event = new Event("submit", { cancelable: true });
      await controller.handleSubmit(event);

      expect(() => vi.advanceTimersByTime(1500)).not.toThrow();
    });

    it("should ignore duplicate submissions while checkout is in flight", async () => {
      let resolveCheckout;

      mockServiceInstance.checkout.mockReturnValue(
        new Promise((resolve) => {
          resolveCheckout = resolve;
        }),
      );

      controller.idempotencyKey = "checkout-attempt-1";

      const submitButton = document.querySelector(
        '#checkout-form button[type="submit"]',
      );

      const firstSubmit = controller.handleSubmit(
        new Event("submit", { cancelable: true }),
      );

      expect(controller.isSubmitting).toBe(true);
      expect(submitButton.disabled).toBe(true);

      await controller.handleSubmit(
        new Event("submit", { cancelable: true }),
      );

      expect(mockServiceInstance.checkout).toHaveBeenCalledTimes(1);
      expect(mockCartController.resetLocal).not.toHaveBeenCalled();

      resolveCheckout({
        id: "order-123",
        orderNumber: "ORD-123",
      });

      await firstSubmit;

      expect(mockCartController.resetLocal).toHaveBeenCalledTimes(1);
      expect(controller.isSubmitting).toBe(false);
    });
  });

  describe("server pricing quote", () => {
    beforeEach(() => {
      mockCartController.getItems.mockReturnValue([
        { id: 1, name: "Container", quantity: 1, subtotal: 150000 },
      ]);
    });

    it("blocks placement while the quote is pending and then uses the tax-inclusive total", async () => {
      let resolveQuote;
      mockServiceInstance.getQuote.mockReturnValue(
        new Promise((resolve) => {
          resolveQuote = resolve;
        }),
      );
      const opening = controller.openCheckout();
      const button = document.querySelector(
        '#checkout-form button[type="submit"]',
      );
      expect(button.disabled).toBe(true);
      await controller.handleSubmit(new Event("submit", { cancelable: true }));
      expect(mockServiceInstance.checkout).not.toHaveBeenCalled();
      resolveQuote({
        subtotal: 150000,
        tax: 15000,
        shippingFee: 30000,
        discountAmount: 0,
        total: 195000,
      });
      await opening;
      expect(button.disabled).toBe(false);
      expect(mockRendererInstance.renderQuote).toHaveBeenCalledWith(
        expect.objectContaining({ total: 195000, tax: 15000 }),
      );
      await controller.handleSubmit(new Event("submit", { cancelable: true }));
      expect(mockServiceInstance.checkout).toHaveBeenCalledWith(
        expect.objectContaining({ expectedTotal: 195000 }),
        expect.any(String),
      );
    });

    it("does not request a quote while checkout is submitting", async () => {
      controller.isSubmitting = true;

      await expect(controller.loadQuote()).resolves.toBe(false);

      expect(mockServiceInstance.getQuote).not.toHaveBeenCalled();
      expect(controller.isLoadingQuote).toBe(false);
    });

    it("keeps placement disabled when pricing cannot be loaded", async () => {
      mockServiceInstance.getQuote.mockRejectedValue(
        new Error("Quote unavailable"),
      );
      await controller.openCheckout();
      expect(
        document.querySelector('#checkout-form button[type="submit"]').disabled,
      ).toBe(true);
      expect(controller.quote).toBeNull();
      expect(mockServiceInstance.checkout).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalled();
    });

    it("uses the ApiError message when quote loading fails", async () => {
      mockServiceInstance.getQuote.mockRejectedValue(
        new ApiError("Discount code expired", 422),
      );

      await expect(controller.loadQuote()).resolves.toBe(false);

      expect(mockToast.error).toHaveBeenCalledWith(
        "Không thể tải tổng tiền",
        "Discount code expired",
      );
    });

    it("ignores a stale quote rejection after a newer request completes", async () => {
      let rejectOld;
      mockServiceInstance.getQuote.mockReturnValueOnce(
        new Promise((_, reject) => {
          rejectOld = reject;
        }),
      );

      const oldRequest = controller.openCheckout();
      await controller.loadQuote();
      rejectOld(new Error("Old quote failed"));

      await expect(oldRequest).resolves.toBe(false);
      expect(controller.quote.total).toBe(195000);
      expect(mockRendererInstance.renderQuote).toHaveBeenCalledTimes(1);
    });

    it("requires an updated quote after the backend rejects a changed total", async () => {
      await controller.openCheckout();
      mockServiceInstance.checkout.mockRejectedValue(
        new ApiError("Checkout total changed", 400),
      );
      await controller.handleSubmit(new Event("submit", { cancelable: true }));
      expect(controller.quote).toBeNull();
      expect(
        document.querySelector('#checkout-form button[type="submit"]').disabled,
      ).toBe(true);
      expect(mockCartController.clear).not.toHaveBeenCalled();
    });

    it("invalidates the reviewed quote as soon as the discount changes", async () => {
      await controller.openCheckout();
      const input = document.getElementById("discount-code");
      input.value = "SAVE10";
      input.dispatchEvent(new Event("input"));
      expect(controller.quote).toBeNull();
      expect(
        document.querySelector('#checkout-form button[type="submit"]').disabled,
      ).toBe(true);
      await controller.handleSubmit(new Event("submit", { cancelable: true }));
      expect(mockServiceInstance.checkout).not.toHaveBeenCalled();
      expect(mockServiceInstance.getQuote).toHaveBeenLastCalledWith("SAVE10");
    });

    it("ignores an old quote after a newer discount request completes", async () => {
      let resolveOld;
      mockServiceInstance.getQuote.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
      );
      const oldRequest = controller.openCheckout();
      document.getElementById("discount-code").value = "SAVE10";
      await controller.loadQuote();
      resolveOld({
        subtotal: 100000,
        tax: 10000,
        shippingFee: 30000,
        discountAmount: 0,
        total: 140000,
      });
      await oldRequest;
      expect(controller.quote.total).toBe(195000);
      expect(mockRendererInstance.renderQuote).toHaveBeenCalledTimes(1);
    });

    it("ignores a quote that arrives after checkout closes", async () => {
      let resolveQuote;
      mockServiceInstance.getQuote.mockReturnValue(
        new Promise((resolve) => {
          resolveQuote = resolve;
        }),
      );
      const opening = controller.openCheckout();
      controller.closeCheckout();
      resolveQuote({
        subtotal: 150000,
        tax: 15000,
        shippingFee: 30000,
        discountAmount: 0,
        total: 195000,
      });
      await opening;
      expect(controller.quote).toBeNull();
      expect(mockRendererInstance.renderQuote).not.toHaveBeenCalled();
    });
  });

  describe("showSuccess", () => {
    it("should use the order id when the order number is unavailable", () => {
      controller.showSuccess({ id: "fallback-order-id" });

      expect(document.getElementById("success-order-id").textContent).toBe(
        "fallback-order-id",
      );
    });

    it("should display success when the optional order ID element is missing", () => {
      document.getElementById("success-order-id").remove();

      expect(() => controller.showSuccess({ id: "order-without-display" })).not.toThrow();
      expect(mockRendererInstance.renderSuccessPricing).toHaveBeenCalledWith({
        id: "order-without-display",
      });
      expect(
        document.getElementById("success-modal").classList.contains("hidden"),
      ).toBe(false);
    });

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
});
