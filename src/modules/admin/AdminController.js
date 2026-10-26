import { AdminService } from "./AdminService.js";
import { AdminRenderer } from "./AdminRenderer.js";
import { authService } from "../auth/AuthService.js";
import { eventBus } from "../../core/services/EventBus.js";
import { EVENTS } from "../../shared/constants/Events.js";

export class AdminController {
  constructor(service = new AdminService(), renderer = new AdminRenderer()) {
    this.service = service;
    this.renderer = renderer;
    this._bound = false;

    // Reload dashboard as soon as an admin logs in (e.g. via the gate's "Sign in").
    eventBus.on(EVENTS.AUTH_LOGIN, () => {
      if (document.getElementById("admin-dashboard-body")) {
        void this.init();
      }
    });
  }

  async init() {
    if (!document.getElementById("admin-dashboard-body")) return;

    this.renderer.showLoading();

    if (!authService.isAuthenticated) {
      this.renderer.showGate(
        "Please sign in with an admin account to access this page.",
        "error",
        { showLogin: true },
      );
      return;
    }

    const user = authService.getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      this.renderer.showGate(
        "You do not have permission to access this page.",
        "error",
        { showLogin: true },
      );
      return;
    }

    try {
      const stats = await this.service.getDashboardStats();
      this.renderer.renderStats(stats);
      this.renderer.showContent();
      this._bindEvents();
      await this.loadRecentOrders();
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      const message =
        error?.status === 403
          ? "Admin access required. Please sign in with an admin account."
          : "Failed to load dashboard data. Please try again.";
      this.renderer.showGate(message, "error");
    }
  }

  _bindEvents() {
    if (this._bound) return;
    this._bound = true;

    document
      .getElementById("admin-refresh-btn")
      ?.addEventListener("click", () => {
        void this.init();
      });

    document
      .getElementById("admin-order-status-filter")
      ?.addEventListener("change", () => {
        void this.loadRecentOrders();
      });
  }

  async loadRecentOrders() {
    const status =
      document.getElementById("admin-order-status-filter")?.value || undefined;
    try {
      const data = await this.service.getOrders({ status }, 1, 10);
      this.renderer.renderOrders(data, {
        onStatusChange: (orderId, newStatus, selectEl) =>
          this.handleStatusUpdate(orderId, newStatus, selectEl),
      });
    } catch (error) {
      console.error("Failed to load recent orders:", error);
      window.toast?.error("Lỗi", "Không thể tải danh sách đơn hàng.");
    }
  }

  async handleStatusUpdate(orderId, newStatus, selectEl) {
    try {
      selectEl.disabled = true;
      await this.service.updateOrderStatus(orderId, newStatus);
      window.toast?.success("Cập nhật thành công", `Đơn hàng → ${newStatus}`);
      await this.init();
    } catch (error) {
      console.error("Failed to update order status:", error);
      window.toast?.error(
        "Lỗi",
        error?.message || "Không thể cập nhật trạng thái đơn hàng.",
      );
      selectEl.value = "";
    } finally {
      selectEl.disabled = false;
    }
  }
}
