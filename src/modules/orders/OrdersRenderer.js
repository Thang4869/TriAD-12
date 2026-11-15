import { formatPrice, formatDate } from "../../shared/utils/helpers.js";

const STATUS_LABELS = {
  PENDING: "Chờ xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const STATUS_CLASSES = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-violet-50 text-violet-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getOrderId(order) {
  return order?.id || order?.orderId || "";
}

function getPlacedAt(order) {
  return order?.createdAt || order?.placedAt || order?.updatedAt;
}

export class OrdersRenderer {
  constructor(container = document.getElementById("orders-view")) {
    this.container = container;
  }

  renderLoading(message = "Đang tải đơn hàng...") {
    if (!this.container) return;
    this.container.replaceChildren(
      createElement("p", "py-16 text-center text-brand-gray", message),
    );
  }

  renderError(message, actionLabel = "Thử lại", onRetry) {
    if (!this.container) return;
    const panel = createElement(
      "div",
      "mx-auto max-w-xl rounded-2xl border border-red-100 bg-red-50 p-8 text-center",
    );
    panel.append(
      createElement("h2", "text-lg font-semibold text-red-800", "Không thể tải đơn hàng"),
      createElement("p", "mt-2 text-sm text-red-700", message),
    );
    if (onRetry) {
      const button = createElement(
        "button",
        "mt-5 rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800",
        actionLabel,
      );
      button.type = "button";
      button.addEventListener("click", onRetry);
      panel.append(button);
    }
    this.container.replaceChildren(panel);
  }

  renderEmpty() {
    if (!this.container) return;
    const panel = createElement(
      "div",
      "rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center",
    );
    panel.append(
      createElement("div", "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl", "□"),
      createElement("h2", "mt-5 text-xl font-semibold text-brand-dark", "Bạn chưa có đơn hàng nào"),
      createElement("p", "mt-2 text-sm text-brand-gray", "Các đơn hàng bạn đặt sẽ xuất hiện tại đây."),
    );
    const link = createElement(
      "a",
      "mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800",
      "Khám phá sản phẩm",
    );
    link.href = "../pages/products.html";
    panel.append(link);
    this.container.replaceChildren(panel);
  }

  renderList(response, onPageChange) {
    if (!this.container) return;
    const orders = Array.isArray(response?.orders) ? response.orders : [];
    if (orders.length === 0) {
      this.renderEmpty();
      return;
    }

    const list = createElement("div", "space-y-4");
    orders.forEach((order) => list.append(this.createOrderCard(order)));

    const page = Number(response.page) || 1;
    const totalPages = Math.max(1, Number(response.totalPages) || 1);
    const pagination = createElement(
      "div",
      "mt-8 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between",
    );
    pagination.append(
      createElement("p", "text-sm text-brand-gray", `Trang ${page} / ${totalPages} · ${Number(response.total) || orders.length} đơn hàng`),
    );
    const controls = createElement("div", "flex items-center gap-2");
    const previous = this.createPageButton("Trước", page <= 1, () => onPageChange(page - 1));
    const next = this.createPageButton("Tiếp", page >= totalPages, () => onPageChange(page + 1));
    controls.append(previous, next);
    pagination.append(controls);
    this.container.replaceChildren(list, pagination);
  }

  createOrderCard(order) {
    const card = createElement(
      "article",
      "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md sm:p-6",
    );
    const top = createElement("div", "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between");
    const identity = createElement("div", "min-w-0");
    identity.append(
      createElement("p", "text-xs font-medium uppercase tracking-wider text-brand-gray", "Mã đơn hàng"),
      createElement("h2", "mt-1 break-all text-lg font-semibold text-brand-dark", order.orderNumber || getOrderId(order)),
      createElement("p", "mt-1 text-sm text-brand-gray", getPlacedAt(order) ? formatDate(getPlacedAt(order)) : "Chưa có ngày đặt"),
    );
    const status = createElement(
      "span",
      `inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[order.status] || "bg-gray-100 text-gray-700"}`,
      STATUS_LABELS[order.status] || order.status || "Chưa xác định",
    );
    top.append(identity, status);

    const summary = createElement("div", "mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between");
    const itemCount = Array.isArray(order.items) ? order.items.reduce((count, item) => count + (Number(item.quantity) || 0), 0) : 0;
    summary.append(
      createElement("p", "text-sm text-brand-gray", `${itemCount} sản phẩm · ${order.paymentMethod || "COD"}`),
      createElement("p", "text-lg font-bold text-brand-dark", formatPrice(Number(order.total) || 0)),
    );

    const footer = createElement("div", "mt-4 flex justify-end");
    const detail = createElement(
      "a",
      "inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-brand-dark transition hover:border-black hover:bg-black hover:text-white",
      "Xem chi tiết →",
    );
    detail.href = `order-detail.html?orderId=${encodeURIComponent(getOrderId(order))}`;
    footer.append(detail);
    card.append(top, summary, footer);
    return card;
  }

  createPageButton(label, disabled, onClick) {
    const button = createElement(
      "button",
      "rounded-full border border-gray-300 px-4 py-2 text-sm font-medium transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40",
      label,
    );
    button.type = "button";
    button.disabled = disabled;
    button.addEventListener("click", onClick);
    return button;
  }

  renderDetail(order) {
    if (!this.container) return;
    const card = createElement("article", "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8");
    const header = createElement("div", "flex flex-col gap-3 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between");
    header.append(
      createElement("div", "", ""),
      createElement("span", `inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[order.status] || "bg-gray-100 text-gray-700"}`, STATUS_LABELS[order.status] || order.status || "Chưa xác định"),
    );
    const identity = header.firstElementChild;
    identity.append(
      createElement("p", "text-xs font-medium uppercase tracking-wider text-brand-gray", "Mã đơn hàng"),
      createElement("h2", "mt-1 break-all text-xl font-semibold", order.orderNumber || order.id),
      createElement("p", "mt-1 text-sm text-brand-gray", getPlacedAt(order) ? formatDate(getPlacedAt(order)) : "Chưa có ngày đặt"),
    );

    const itemSection = createElement("section", "py-6");
    itemSection.append(createElement("h3", "mb-4 font-semibold", "Sản phẩm đã đặt"));
    const items = createElement("div", "divide-y divide-gray-100");
    (Array.isArray(order.items) ? order.items : []).forEach((item) => {
      const row = createElement("div", "flex items-center justify-between gap-4 py-3");
      row.append(
        createElement("div", "min-w-0", ""),
        createElement("p", "shrink-0 text-sm font-medium", formatPrice(Number(item.total) || (Number(item.price) || Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))),
      );
      row.firstElementChild.append(
        createElement("p", "truncate text-sm font-medium", item.product?.name || item.productName || "Sản phẩm"),
        createElement("p", "mt-1 text-xs text-brand-gray", `Số lượng: ${Number(item.quantity) || 0}`),
      );
      items.append(row);
    });
    itemSection.append(items);

    const totals = createElement("section", "space-y-2 border-t border-gray-100 pt-5 text-sm");
    const addTotal = (label, value, strong = false) => {
      const row = createElement("div", `flex justify-between gap-4 ${strong ? "pt-2 text-base font-bold" : "text-brand-gray"}`);
      row.append(createElement("span", "", label), createElement("span", "text-right", formatPrice(Number(value) || 0)));
      totals.append(row);
    };
    addTotal("Tạm tính", order.subtotal);
    addTotal("Thuế", order.tax);
    addTotal("Phí giao hàng", order.shippingFee);
    addTotal("Giảm giá", order.discountAmount);
    addTotal("Tổng thanh toán", order.total, true);

    const shipping = createElement("section", "mt-6 rounded-xl bg-gray-50 p-4");
    shipping.append(
      createElement("h3", "font-semibold", "Thông tin giao hàng"),
      createElement("p", "mt-2 text-sm text-brand-gray", order.customerName || "Khách hàng"),
      createElement("p", "mt-1 text-sm text-brand-gray", order.customerPhone || "Chưa có số điện thoại"),
      createElement("p", "mt-1 text-sm text-brand-gray", order.customerAddress || "Chưa có địa chỉ"),
    );

    card.append(header, itemSection, totals, shipping);
    this.container.replaceChildren(card);
  }
}
