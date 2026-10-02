import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckoutRenderer } from "../../../../src/modules/checkout/CheckoutRenderer.js";

describe("CheckoutRenderer", () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="checkout-items"></div>
      <span id="checkout-total">0 ₫</span>
    `;
    renderer = new CheckoutRenderer();
  });

  it("should render summary with items", () => {
    const items = [
      { name: "Container 1000ml", quantity: 2, subtotal: 300000 },
      { name: "Container 400ml", quantity: 1, subtotal: 110000 },
    ];
    renderer.renderSummary(items);
    const container = document.getElementById("checkout-items");
    expect(container.innerHTML).toContain("Container 1000ml x2");
    expect(container.innerHTML).toContain("300.000 ₫");
    expect(container.innerHTML).toContain("Container 400ml x1");
    expect(container.innerHTML).toContain("110.000 ₫");
    expect(document.getElementById("checkout-total").textContent).toBe(
      "440.000 ₫",
    );
  });

  it("should render product names as text rather than markup", () => {
    const maliciousName = '<img src=x onerror="window.__xss = true">';
    const scriptName = "<script>window.__xss = true</script>";

    renderer.renderSummary([
      { name: maliciousName, quantity: 1, subtotal: 100000 },
      { name: scriptName, quantity: 1, subtotal: 100000 },
    ]);

    const container = document.getElementById("checkout-items");
    expect(container.textContent).toContain(`${maliciousName} x1`);
    expect(container.textContent).toContain(`${scriptName} x1`);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror], [onload]")).toBeNull();
  });

  it("should apply free shipping when total >= 500000", () => {
    const items = [{ name: "Product A", quantity: 1, subtotal: 600000 }];
    renderer.renderSummary(items);
    expect(document.getElementById("checkout-total").textContent).toBe(
      "600.000 ₫",
    );
  });

  it("should render empty state when items empty", () => {
    renderer.renderSummary([]);
    const container = document.getElementById("checkout-items");
    expect(container.innerHTML).toContain("Your cart is empty.");
    expect(document.getElementById("checkout-total").textContent).toBe("0 ₫");
  });

  it("should update total directly", () => {
    renderer.updateTotal(500000);
    expect(document.getElementById("checkout-total").textContent).toBe(
      "500.000 ₫",
    );
  });

  it("should render final pricing from the server order", () => {
    document.body.innerHTML += `
      <span id="success-subtotal"></span>
      <span id="success-tax"></span>
      <span id="success-shipping"></span>
      <span id="success-discount"></span>
      <span id="success-discount-code"></span>
      <span id="success-total"></span>
    `;

    renderer.renderSuccessPricing({
      subtotal: 500000,
      tax: 50000,
      shippingFee: 0,
      discountAmount: 25000,
      discountCode: "SAVE5",
      total: 525000,
    });

    expect(document.getElementById("success-subtotal").textContent).toBe(
      "500.000 ₫",
    );
    expect(document.getElementById("success-tax").textContent).toBe(
      "50.000 ₫",
    );
    expect(document.getElementById("success-shipping").textContent).toBe(
      "0 ₫",
    );
    expect(document.getElementById("success-discount").textContent).toBe(
      "25.000 ₫",
    );
    expect(document.getElementById("success-discount-code").textContent).toBe(
      "(SAVE5)",
    );
    expect(document.getElementById("success-total").textContent).toBe(
      "525.000 ₫",
    );
  });

  it("should return early if itemsContainer is missing", () => {
    document.body.innerHTML = `<span id="checkout-total">0 ₫</span>`;
    const renderer2 = new CheckoutRenderer();
    expect(renderer2.itemsContainer).toBeNull();

    renderer2.renderSummary([{ name: "Test", quantity: 1, subtotal: 100 }]);

    expect(document.getElementById("checkout-total").textContent).toBe("0 ₫");
  });

  it("should not update total when totalElement is missing", () => {
    document.body.innerHTML = `<div id="checkout-items"></div>`;
    const renderer2 = new CheckoutRenderer();
    expect(renderer2.totalElement).toBeNull();

    renderer2.updateTotal(1000);
    expect(document.getElementById("checkout-total")).toBeNull();
  });
});
