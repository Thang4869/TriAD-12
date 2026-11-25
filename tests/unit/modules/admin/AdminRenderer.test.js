import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminRenderer } from "../../../../src/modules/admin/AdminRenderer.js";

const XSS_PAYLOAD = '<img src=x onerror=alert(1)>';

describe("AdminRenderer", () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="admin-gate"></div>
      <div id="admin-recent-orders"></div>
      <div id="admin-low-stock"></div>
      <div id="admin-top-selling"></div>
    `;
    renderer = new AdminRenderer();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const createOrder = (overrides = {}) => ({
    id: "order-42",
    orderNumber: "ORD-2026-0042",
    total: 125000,
    status: "PENDING",
    createdAt: "2026-11-25T08:00:00.000Z",
    user: {
      firstName: "Nguyen",
      lastName: "Van A",
      email: "customer@example.com",
    },
    ...overrides,
  });

  it("renders gate messages as text without creating executable elements", () => {
    renderer.showGate(XSS_PAYLOAD);

    const gate = document.getElementById("admin-gate");

    expect(gate.textContent).toContain(XSS_PAYLOAD);
    expect(gate.querySelector("img, svg, script")).toBeNull();
    expect(gate.querySelector("[onerror], [onload]")).toBeNull();
  });

  it("renders malicious customer fields as text without creating executable elements", () => {
    renderer.renderOrders({
      orders: [
        createOrder({
          user: {
            firstName: XSS_PAYLOAD,
            lastName: '<svg onload="alert(2)">',
            email: '<script>alert(3)</script>',
          },
        }),
      ],
    });

    const container = document.getElementById("admin-recent-orders");

    expect(container.textContent).toContain(XSS_PAYLOAD);
    expect(container.textContent).toContain('<svg onload="alert(2)">');
    expect(container.textContent).toContain("<script>alert(3)</script>");
    expect(container.querySelector("img, svg, script")).toBeNull();
    expect(container.querySelector("[onerror], [onload], [onfocus]")).toBeNull();
  });

  it("escapes order fields and preserves the original order id in the data attribute", () => {
    const orderId = 'order-42" onfocus="alert(1)';
    renderer.renderOrders({
      orders: [
        createOrder({
          id: orderId,
          orderNumber: '<img src=x onerror="alert(1)">',
          status: '<svg onload="alert(1)">',
        }),
      ],
    });

    const container = document.getElementById("admin-recent-orders");
    const select = container.querySelector(".status-update");

    expect(container.querySelector("img, svg, script")).toBeNull();
    expect(container.querySelector("[onerror], [onload], [onfocus]")).toBeNull();
    expect(select.dataset.orderId).toBe(orderId);
  });

  it("escapes malicious product names in the low-stock table", () => {
    renderer._renderLowStock([{ name: XSS_PAYLOAD, stock: 2 }]);

    const container = document.getElementById("admin-low-stock");

    expect(container.textContent).toContain(XSS_PAYLOAD);
    expect(container.querySelector("img, svg, script")).toBeNull();
    expect(container.querySelector("[onerror], [onload]")).toBeNull();
    expect(container.querySelector("table tbody tr")).not.toBeNull();
  });

  it("escapes malicious product names in the top-selling table", () => {
    renderer._renderTopSelling([
      { name: XSS_PAYLOAD, totalQuantitySold: 8, totalOrderValue: 640000 },
    ]);

    const container = document.getElementById("admin-top-selling");

    expect(container.textContent).toContain(XSS_PAYLOAD);
    expect(container.querySelector("img, svg, script")).toBeNull();
    expect(container.querySelector("[onerror], [onload]")).toBeNull();
    expect(container.querySelector("table tbody tr")).not.toBeNull();
  });

  it("keeps the order table and status-change action working", () => {
    const onStatusChange = vi.fn();
    renderer.renderOrders({ orders: [createOrder()] }, { onStatusChange });

    const container = document.getElementById("admin-recent-orders");
    const select = container.querySelector(".status-update");

    expect(container.querySelector("table thead th").textContent).toBe("Mã đơn");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(select.dataset.orderId).toBe("order-42");

    select.value = "PROCESSING";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(onStatusChange).toHaveBeenCalledWith(
      "order-42",
      "PROCESSING",
      select,
    );
  });
});
