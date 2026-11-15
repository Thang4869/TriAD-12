import { authService } from "../auth/AuthService.js";
import { AdminManagementService } from "./AdminManagementService.js";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

export class AdminManagementController {
  constructor(service = new AdminManagementService()) {
    this.service = service;
    this._bound = false;
  }

  async init() {
    const root = document.getElementById("admin-management-content");
    if (!root) return;

    if (!authService.isAuthenticated || authService.getCurrentUser()?.role !== "ADMIN") {
      this.renderGate("Bạn cần đăng nhập bằng tài khoản quản trị để truy cập khu vực này.");
      return;
    }

    this.renderLoading();
    this._bindEvents();

    const results = await Promise.allSettled([
      this.service.getOrders(1, 20),
      this.service.getReviews(1, 20),
      this.service.getAuditLogs(1, 50),
    ]);

    this.renderOrders(results[0]);
    this.renderReviews(results[1]);
    this.renderAuditLogs(results[2]);
    document.getElementById("admin-management-loading")?.classList.add("hidden");
  }

  renderLoading() {
    document.getElementById("admin-management-loading")?.classList.remove("hidden");
    document.getElementById("admin-management-gate")?.classList.add("hidden");
  }

  renderGate(message) {
    document.getElementById("admin-management-loading")?.classList.add("hidden");
    const gate = document.getElementById("admin-management-gate");
    if (!gate) return;
    gate.textContent = message;
    gate.classList.remove("hidden");
  }

  _bindEvents() {
    if (this._bound) return;
    this._bound = true;
    const root = document.getElementById("admin-management-content");
    root?.addEventListener("change", (event) => {
      const select = event.target.closest("[data-order-status]");
      if (select) void this.handleOrderStatus(select);
    });
    root?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-review]");
      if (button) void this.handleDeleteReview(button);
    });
    document.getElementById("admin-management-refresh")?.addEventListener("click", () => {
      void this.init();
    });
  }

  async handleOrderStatus(select) {
    const { orderId } = select.dataset;
    const status = select.value;
    if (!orderId || !ORDER_STATUSES.includes(status)) return;
    select.disabled = true;
    try {
      await this.service.updateOrderStatus(orderId, status);
      window.toast?.success("Đã cập nhật", "Trạng thái đơn hàng đã được thay đổi.");
      const result = await this.service.getOrders(1, 20);
      this.renderOrders({ status: "fulfilled", value: result });
    } catch (error) {
      window.toast?.error("Không thể cập nhật", error?.message || "Vui lòng thử lại.");
      select.value = select.dataset.currentStatus || "";
    } finally {
      select.disabled = false;
    }
  }

  async handleDeleteReview(button) {
    const reviewId = button.dataset.deleteReview;
    if (!reviewId || !window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    button.disabled = true;
    try {
      await this.service.deleteReview(reviewId);
      window.toast?.success("Đã xóa", "Đánh giá đã được gỡ khỏi cửa hàng.");
      const result = await this.service.getReviews(1, 20);
      this.renderReviews({ status: "fulfilled", value: result });
    } catch (error) {
      window.toast?.error("Không thể xóa", error?.message || "Vui lòng thử lại.");
      button.disabled = false;
    }
  }

  renderOrders(result) {
    const container = document.getElementById("admin-orders-table");
    if (!container) return;
    if (result.status !== "fulfilled") {
      container.textContent = "Không thể tải đơn hàng. Vui lòng làm mới để thử lại.";
      return;
    }
    const orders = result.value?.orders || [];
    if (!orders.length) {
      container.textContent = "Chưa có đơn hàng.";
      return;
    }
    container.innerHTML = `
      <div class="overflow-x-auto"><table class="w-full min-w-[760px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr>
          <th class="px-4 py-3">Mã đơn</th><th class="px-4 py-3">Khách hàng</th><th class="px-4 py-3">Tổng tiền</th><th class="px-4 py-3">Ngày tạo</th><th class="px-4 py-3">Trạng thái</th>
        </tr></thead><tbody class="divide-y divide-slate-100">
          ${orders.map((order) => `<tr>
            <td class="px-4 py-3 font-semibold">${escapeHtml(order.orderNumber)}</td>
            <td class="px-4 py-3">${escapeHtml([order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") || order.user?.email || "—")}<span class="block text-xs text-slate-400">${escapeHtml(order.user?.email)}</span></td>
            <td class="px-4 py-3">${formatPrice(order.total)}</td>
            <td class="px-4 py-3 text-slate-500">${formatDate(order.createdAt)}</td>
            <td class="px-4 py-3"><select data-order-status data-order-id="${escapeHtml(order.id)}" data-current-status="${escapeHtml(order.status)}" class="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
              <option value="">${escapeHtml(order.status)}</option>
              ${ORDER_STATUSES.filter((status) => status !== order.status).map((status) => `<option value="${status}">${status}</option>`).join("")}
            </select></td>
          </tr>`).join("")}
        </tbody></table></div>
        <p class="mt-3 text-xs text-slate-400">Hiển thị tối đa 20 đơn hàng gần nhất.</p>`;
  }

  renderReviews(result) {
    const container = document.getElementById("admin-reviews-table");
    if (!container) return;
    if (result.status !== "fulfilled") {
      container.textContent = "Không thể tải đánh giá. Vui lòng làm mới để thử lại.";
      return;
    }
    const reviews = result.value?.reviews || [];
    if (!reviews.length) {
      container.textContent = "Chưa có đánh giá.";
      return;
    }
    container.innerHTML = `
      <div class="overflow-x-auto"><table class="w-full min-w-[720px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr>
          <th class="px-4 py-3">Sản phẩm</th><th class="px-4 py-3">Người đánh giá</th><th class="px-4 py-3">Điểm</th><th class="px-4 py-3">Nội dung</th><th class="px-4 py-3">Ngày tạo</th><th class="px-4 py-3">Thao tác</th>
        </tr></thead><tbody class="divide-y divide-slate-100">
          ${reviews.map((review) => `<tr>
            <td class="px-4 py-3 font-medium">${escapeHtml(review.product?.name || "—")}</td>
            <td class="px-4 py-3">${escapeHtml(review.user?.email || "—")}</td>
            <td class="px-4 py-3 whitespace-nowrap">${"★".repeat(Math.max(0, Math.min(5, Number(review.rating) || 0)))} <span class="text-slate-500">${escapeHtml(review.rating)}/5</span></td>
            <td class="max-w-xs px-4 py-3 text-slate-600">${escapeHtml(review.comment || review.content || "—")}</td>
            <td class="px-4 py-3 text-slate-500">${formatDate(review.createdAt)}</td>
            <td class="px-4 py-3"><button type="button" data-delete-review="${escapeHtml(review.id)}" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Xóa</button></td>
          </tr>`).join("")}
        </tbody></table></div>
        <p class="mt-3 text-xs text-slate-400">Hiển thị tối đa 20 đánh giá gần nhất. Xóa đánh giá được ghi vào Admin Audit Log.</p>`;
  }

  renderAuditLogs(result) {
    const container = document.getElementById("admin-audit-table");
    if (!container) return;
    if (result.status !== "fulfilled") {
      container.textContent = "Không thể tải nhật ký hoạt động. Vui lòng làm mới để thử lại.";
      return;
    }
    const records = result.value?.records || [];
    if (!records.length) {
      container.textContent = "Chưa có bản ghi audit.";
      return;
    }
    container.innerHTML = `
      <div class="overflow-x-auto"><table class="w-full min-w-[760px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr>
          <th class="px-4 py-3">Thời gian</th><th class="px-4 py-3">Quản trị viên</th><th class="px-4 py-3">Hành động</th><th class="px-4 py-3">Đối tượng</th><th class="px-4 py-3">Kết quả</th><th class="px-4 py-3">Request ID</th>
        </tr></thead><tbody class="divide-y divide-slate-100">
          ${records.map((record) => `<tr>
            <td class="px-4 py-3 whitespace-nowrap">${formatDate(record.createdAt)}</td>
            <td class="px-4 py-3">${escapeHtml(record.actorId)}<span class="block text-xs text-slate-400">${escapeHtml(record.actorRole)}</span></td>
            <td class="px-4 py-3 font-medium">${escapeHtml(record.action)}</td>
            <td class="px-4 py-3">${escapeHtml(record.targetType)}<span class="block text-xs text-slate-400">${escapeHtml(record.targetId)}</span></td>
            <td class="px-4 py-3">${escapeHtml(record.outcome)}</td>
            <td class="px-4 py-3 font-mono text-xs text-slate-500">${escapeHtml(record.requestId)}</td>
          </tr>`).join("")}
        </tbody></table></div>
        <p class="mt-3 text-xs text-slate-400">Hiển thị tối đa 50 bản ghi mới nhất. API chưa cung cấp chức năng xuất audit log.</p>`;
  }
}
