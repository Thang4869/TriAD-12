import { CheckoutService } from "./CheckoutService.js";
import { CheckoutValidator } from "./CheckoutValidator.js";
import { CheckoutRenderer } from "./CheckoutRenderer.js";
import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";
import { ApiError } from "../../shared/services/api.service.js";

export class CheckoutController {
  constructor() {
    this.service = new CheckoutService();
    this.validator = new CheckoutValidator();
    this.renderer = new CheckoutRenderer();
    this.items = [];
    this.isSubmitting = false;
    this.idempotencyKey = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById("checkout-btn")?.addEventListener("click", () => {
      // Backend bắt buộc đăng nhập để checkout -> chặn ở đây trước khi mở modal.
      window.authController?.requireAuth(() => this.openCheckout());
    });

    document
      .getElementById("close-checkout-btn")
      ?.addEventListener("click", () => this.closeCheckout());

    document
      .getElementById("checkout-form")
      ?.addEventListener("submit", (e) => this.handleSubmit(e));

    document
      .getElementById("success-close-btn")
      ?.addEventListener("click", () => this.closeSuccess());
  }

  openCheckout() {
    const cartItems = window.cartController?.getItems() || [];
    if (cartItems.length === 0) {
      window.toast?.warning(
        "Giỏ hàng trống",
        "Vui lòng thêm sản phẩm trước khi thanh toán.",
      );
      return;
    }

    this.renderer.renderSummary(cartItems);
    this.items = cartItems;
    this.idempotencyKey = crypto.randomUUID();

    const modal = document.getElementById("checkout-modal");
    const content = modal.querySelector(".bg-white");
    document.getElementById("checkout-form").reset();

    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      modal.classList.remove("opacity-0");
      content.classList.remove("scale-95");
    });
    document.body.style.overflow = "hidden";
    eventBus.emit(EVENTS.CHECKOUT_STARTED);
  }

  closeCheckout() {
    const modal = document.getElementById("checkout-modal");
    const content = modal.querySelector(".bg-white");
    modal.classList.add("opacity-0");
    content.classList.add("scale-95");
    setTimeout(() => modal.classList.add("hidden"), 300);
    document.body.style.overflow = "";
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting) return;

    // Backend chỉ cần 4 field này (paymentMethod, address, phone, notes) -
    // tên/email khách hàng đã có sẵn từ tài khoản đăng nhập, không cần gửi lại.
    const data = {
      address: document.getElementById("address").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      notes: document.getElementById("notes")?.value.trim() || undefined,
      discountCode:
        document.getElementById("discount-code")?.value.trim() || undefined,
      paymentMethod: "COD",
    };

    const result = this.validator.validate(data);
    if (!result.isValid) {
      window.toast?.error("Thông tin chưa hợp lệ", result.errors.join(", "));
      return;
    }

    this.isSubmitting = true;
    const submitBtn = document.querySelector(
      "#checkout-form button[type=submit]",
    );
    if (submitBtn) submitBtn.disabled = true;
    window.toast?.info("Đang xử lý", "Vui lòng chờ trong giây lát...");

    try {
      const order = await this.service.checkout(data, this.idempotencyKey);

      await window.cartController?.clear();
      window.cartController?.closeDrawer();
      this.closeCheckout();
      this.showSuccess(order);

      window.notifications?.add(
        "Đặt hàng thành công!",
        `Đơn ${order.orderNumber} đã được xác nhận. Cảm ơn bạn!`,
        "success",
      );
      window.toast?.success(
        "Đặt hàng thành công!",
        `Đơn ${order.orderNumber}.`,
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể xử lý đơn hàng. Vui lòng thử lại.";
      window.toast?.error("Lỗi", message);
      window.notifications?.add("Đặt hàng thất bại", message, "warning");
    } finally {
      this.isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  showSuccess(order) {
    const modal = document.getElementById("success-modal");
    const content = modal.querySelector(".bg-white");
    const orderIdEl = document.getElementById("success-order-id");
    if (orderIdEl) orderIdEl.textContent = order.orderNumber || order.id;
    this.renderer.renderSuccessPricing(order);

    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      modal.classList.remove("opacity-0");
      content.classList.remove("scale-95");
    });
    document.body.style.overflow = "hidden";
  }

  closeSuccess() {
    const modal = document.getElementById("success-modal");
    const content = modal.querySelector(".bg-white");
    modal.classList.add("opacity-0");
    content.classList.add("scale-95");
    setTimeout(() => modal.classList.add("hidden"), 300);
    document.body.style.overflow = "";
    window.productsController?.resetFilters();
  }
}
