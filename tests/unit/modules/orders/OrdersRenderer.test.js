import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrdersRenderer } from "../../../../src/modules/orders/OrdersRenderer.js";

describe("OrdersRenderer", () => {
  let container;
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = '<div id="orders-view" aria-busy="false"></div>';
    container = document.getElementById("orders-view");
    renderer = new OrdersRenderer(container);
  });

  it("announces loading while the history request is pending", () => {
    renderer.renderLoading();
    expect(container.getAttribute("aria-busy")).toBe("true");
    expect(container.textContent).toContain("Đang tải đơn hàng");
  });

  it("renders an empty-history state without exposing stale content", () => {
    container.innerHTML = "<p>stale content</p>";
    renderer.renderEmpty();
    expect(container.textContent).not.toContain("stale content");
    expect(container.textContent).toContain("Bạn chưa có đơn hàng nào");
    expect(container.getAttribute("aria-busy")).toBe("false");
  });

  it("renders an order card with status, amount and a detail link", () => {
    renderer.renderList({
      orders: [{
        id: "order-123",
        orderNumber: "TRIAD-123",
        status: "PROCESSING",
        paymentMethod: "COD",
        total: 250000,
        createdAt: "2026-11-15T08:00:00.000Z",
        items: [{ quantity: 2 }],
      }],
      page: 1,
      total: 1,
      totalPages: 1,
    }, vi.fn());

    expect(container.textContent).toContain("TRIAD-123");
    expect(container.textContent).toContain("Đang xử lý");
    expect(container.textContent).toContain("250.000 ₫");
    expect(container.querySelector('a[href*="orderId=order-123"]')).toBeTruthy();
    expect(container.getAttribute("aria-busy")).toBe("false");
  });

  it("disables pagination controls at the first and last page", () => {
    renderer.renderList({
      orders: [{ id: "order-1", orderNumber: "TRIAD-1", total: 100, items: [] }],
      page: 1,
      total: 1,
      totalPages: 1,
    }, vi.fn());

    const buttons = container.querySelectorAll("button");
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });

  it("renders order detail using text nodes for customer-provided values", () => {
    renderer.renderDetail({
      id: "order-1",
      orderNumber: "<script>alert(1)</script>",
      status: "DELIVERED",
      subtotal: 100,
      tax: 10,
      shippingFee: 20,
      discountAmount: 0,
      total: 130,
      customerAddress: "<img src=x onerror=alert(1)>",
      items: [{ productName: "Container", quantity: 1, price: 100 }],
    });

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
    expect(container.getAttribute("aria-busy")).toBe("false");
  });

  it("renders a retry action for request failures", () => {
    const retry = vi.fn();
    renderer.renderError("Network unavailable", "Try again", retry);
    container.querySelector("button").click();

    expect(container.textContent).toContain("Network unavailable");
    expect(retry).toHaveBeenCalledOnce();
  });
});
