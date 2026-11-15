import { formatPrice, formatDate } from "../../shared/utils/helpers.js";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export class AdminRenderer {
  _el(id) {
    return document.getElementById(id);
  }

  showLoading() {
    this._el("admin-loading")?.classList.remove("hidden");
    this._el("admin-gate")?.classList.add("hidden");
    this._el("admin-dashboard-body")?.classList.add("hidden");
  }

  showGate(message, type = "info", { showLogin = false } = {}) {
    const gate = this._el("admin-gate");
    if (!gate) return;
    this._el("admin-loading")?.classList.add("hidden");
    this._el("admin-dashboard-body")?.classList.add("hidden");
    gate.classList.remove("hidden");
    const color = type === "error" ? "text-red-600" : "text-brand-gray";
    gate.innerHTML = `
      <i class="ph ph-lock-key text-6xl ${color}"></i>
      <p class="mt-4 text-lg ${color}">${message}</p>
      <div class="mt-6 flex gap-3 justify-center">
        ${
          showLogin
            ? '<button id="admin-gate-login" class="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">Sign in with admin account</button>'
            : ""
        }
        <a href="./" class="inline-block px-6 py-2 border border-black text-black rounded-full hover:bg-black hover:text-white transition-colors">
          Back to home
        </a>
      </div>
    `;
    if (showLogin) {
      document
        .getElementById("admin-gate-login")
        ?.addEventListener("click", () => {
          window.authController?.open("login");
        });
    }
  }

  showContent() {
    this._el("admin-loading")?.classList.add("hidden");
    this._el("admin-gate")?.classList.add("hidden");
    this._el("admin-dashboard-body")?.classList.remove("hidden");
  }

  renderStats(stats) {
    if (!stats) return;

    const gmv = stats.grossMã đơnValue?.total30Days ?? 0;
    const byDay = stats.grossMã đơnValue?.byDay ?? [];
    const statusBreakdown = stats.orders?.statusBreakdown ?? [];
    const products = stats.products ?? {};
    const users = stats.users ?? {};

    const totalMã đơns = statusBreakdown.reduce(
      (sum, row) => sum + row.count,
      0,
    );
    const đang chờ xử lýMã đơns =
      statusBreakdown.find((row) => row.status === "PENDING")?.count ?? 0;
    const lowTồn kho = products.lowTồn kho ?? [];

    this._setText("kpi-gmv", formatPrice(gmv));
    this._setText("kpi-orders", totalMã đơns);
    this._setText("kpi-orders-đang chờ xử lý", `${đang chờ xử lýMã đơns} đang chờ xử lý`);
    this._setText("kpi-users", users.total ?? 0);
    this._setText("kpi-users-new", `${users.new30Days ?? 0} new in 30d`);
    this._setText("kpi-products", products.total ?? 0);
    this._setText("kpi-lowstock", `${lowTồn kho.length} low stock`);

    this._renderChart(byDay);
    this._renderTrạng thái(statusBreakdown);
    this._renderLowTồn kho(lowTồn kho);
    this._renderTopSelling(products.topSelling ?? []);
  }

  _renderChart(byDay) {
    const container = this._el("admin-chart");
    if (!container) return;
    if (!byDay.length) {
      container.innerHTML =
        '<p class="text-sm text-gray-400 m-auto">Không có đơn hàng trong 30 ngày gần nhất</p>';
      return;
    }
    const max = Math.max(...byDay.map((d) => d.grossMã đơnValue), 1);
    container.innerHTML = byDay
      .map((d) => {
        const height = Math.max(4, Math.round((d.grossMã đơnValue / max) * 100));
        return `
          <div class="flex-1 flex flex-col items-center justify-end group relative">
            <div class="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
              ${d.date}<br>${formatPrice(d.grossMã đơnValue)}
            </div>
            <div class="w-full bg-brand-accent rounded-t hover:bg-brand-dark transition-colors" style="height:${height}%"></div>
          </div>
        `;
      })
      .join("");
  }

  _renderTrạng thái(rows) {
    const container = this._el("admin-order-status");
    if (!container) return;
    if (!rows.length) {
      container.innerHTML =
        '<p class="text-sm text-gray-400">Chưa có đơn hàng</p>';
      return;
    }
    container.innerHTML = rows
      .map(
        (r) => `
        <div class="flex justify-between items-center">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}">${r.status}</span>
          <span class="font-semibold">${r.count}</span>
        </div>
      `,
      )
      .join("");
  }

  _renderLowTồn kho(products) {
    const container = this._el("admin-low-stock");
    if (!container) return;
    if (!products.length) {
      container.innerHTML =
        '<p class="text-sm text-gray-400">Tất cả sản phẩm đều đủ hàng</p>';
      return;
    }
    container.innerHTML = `
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-brand-gray border-b">
            <th class="pb-2">Sản phẩm</th>
            <th class="pb-2">Tồn kho</th>
            <th class="pb-2 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${products
            .map(
              (p) => `
            <tr class="border-b last:border-0">
              <td class="py-2">${p.name}</td>
              <td class="py-2"><span class="text-red-600 font-semibold">${p.stock}</span></td>
              <td class="py-2 text-right">
                <a href="./products.html" class="text-brand-accent hover:underline text-sm">Quản lý kho</a>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  _renderTopSelling(products) {
    const container = this._el("admin-top-selling");
    if (!container) return;
    if (!products.length) {
      container.innerHTML = '<p class="text-sm text-gray-400">Chưa có dữ liệu bán hàng</p>';
      return;
    }
    container.innerHTML = `
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-brand-gray border-b">
            <th class="pb-2">Sản phẩm</th>
            <th class="pb-2">Số lượng bán</th>
            <th class="pb-2 text-right">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          ${products
            .map(
              (p) => `
            <tr class="border-b last:border-0">
              <td class="py-2">${p.name}</td>
              <td class="py-2">${p.totalQuantitySold}</td>
              <td class="py-2 text-right font-medium">${formatPrice(p.totalMã đơnValue)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  renderMã đơns(data, { onTrạng tháiChange } = {}) {
    const container = this._el("admin-recent-orders");
    if (!container) return;
    const orders = data?.orders ?? [];
    if (!orders.length) {
      container.innerHTML =
        '<p class="text-sm text-gray-400">Chưa có đơn hàng</p>';
      return;
    }
    container.innerHTML = `
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-brand-gray border-b">
            <th class="pb-2">Mã đơn</th>
            <th class="pb-2">Khách hàng</th>
            <th class="pb-2">Tổng tiền</th>
            <th class="pb-2">Trạng thái</th>
            <th class="pb-2">Ngày tạo</th>
            <th class="pb-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${orders
            .map(
              (o) => `
            <tr class="border-b last:border-0">
              <td class="py-2 font-medium">${o.orderNumber}</td>
              <td class="py-2">
                ${o.user?.firstName ?? ""} ${o.user?.lastName ?? ""}
                <br><span class="text-xs text-gray-500">${o.user?.email ?? ""}</span>
              </td>
              <td class="py-2">${formatPrice(o.total)}</td>
              <td class="py-2">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"}">${o.status}</span>
              </td>
              <td class="py-2 text-xs text-gray-500">${formatDate(o.createdAt)}</td>
              <td class="py-2">
                <select class="status-update p-1 border rounded text-xs" data-order-id="${o.id}">
                  <option value="">Đổi trạng thái</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
    container.querySelectorAll(".status-update").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const orderId = e.target.dataset.orderId;
        const status = e.target.value;
        if (!status) return;
        onTrạng tháiChange?.(orderId, status, e.target);
      });
    });
  }

  _setText(id, value) {
    const el = this._el(id);
    if (el) el.textContent = value;
  }
}
