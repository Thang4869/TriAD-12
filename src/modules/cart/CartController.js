import { CartService } from "./CartService.js";
import { CartRenderer } from "./CartRenderer.js";
import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";
import { authService } from "../auth/AuthService.js";

export class CartController {
  constructor() {
    this.service = new CartService();
    this.renderer = new CartRenderer();
    this.isDrawerOpen = false;

    this.setupEventListeners();

    // Chỉ tải giỏ hàng thật nếu đã đăng nhập, tránh gọi API và nhận 401 vô ích
    // ngay khi tải trang cho khách chưa đăng nhập.
    if (authService.isAuthenticated) {
      this.service.load();
    }

    eventBus.on(EVENTS.AUTH_LOGIN, () => this.service.load());
    eventBus.on(EVENTS.AUTH_LOGOUT, () => this.service.clear());
  }

  setupEventListeners() {
    eventBus.on(EVENTS.CART_UPDATED, (data) => {
      this.renderer.render(data.items);
      this.renderer.updateBadge(data.count);
      this.renderer.setCheckoutEnabled(!data.isEmpty);
    });

    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-id]");
      if (!target) return;

      const id = target.dataset.id; // productId (UUID string)
      const action = target.dataset.action;

      if (action === "remove") this.removeItem(id);
      else if (action === "increase") this.increaseItem(id);
      else if (action === "decrease") this.decreaseItem(id);
    });
  }

  /** Yêu cầu đăng nhập trước khi thêm giỏ hàng thật (backend bắt buộc). */
  addToCart(product, quantity = 1, flyElement = null) {
    window.authController?.requireAuth(async () => {
      try {
        await this.service.add(product.id, quantity);
        if (flyElement && window.flyToCart) window.flyToCart.fly(flyElement);
        window.toast?.success("Đã thêm vào giỏ", product.name);
      } catch (error) {
        window.toast?.error("Không thể thêm vào giỏ", error.message);
      }
    });
  }

  async removeItem(id) {
    try {
      await this.service.remove(id);
    } catch (error) {
      window.toast?.error("Lỗi", error.message);
    }
  }

  async increaseItem(id) {
    try {
      await this.service.increase(id);
    } catch (error) {
      window.toast?.error("Lỗi", error.message);
    }
  }

  async decreaseItem(id) {
    try {
      await this.service.decrease(id);
    } catch (error) {
      window.toast?.error("Lỗi", error.message);
    }
  }

  async clear() {
    return this.service.clear();
  }

  getItems() {
    return this.service.items;
  }
  getTotal() {
    return this.service.total;
  }
  getCount() {
    return this.service.count;
  }

  openDrawer() {
    if (this.isDrawerOpen) return;
    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");
    if (!overlay || !drawer) return;

    overlay.classList.remove("hidden");
    requestAnimationFrame(() => {
      overlay.classList.remove("opacity-0");
      drawer.classList.remove("translate-x-full");
    });
    this.isDrawerOpen = true;
    document.body.style.overflow = "hidden";
    eventBus.emit(EVENTS.DRAWER_OPENED);
  }

  closeDrawer() {
    if (!this.isDrawerOpen) return;
    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");
    if (!overlay || !drawer) return;

    overlay.classList.add("opacity-0");
    drawer.classList.add("translate-x-full");
    setTimeout(() => overlay.classList.add("hidden"), 300);
    this.isDrawerOpen = false;
    document.body.style.overflow = "";
    eventBus.emit(EVENTS.DRAWER_CLOSED);
  }
}
