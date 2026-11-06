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
    expect(document.getElementById("checkout-total").textContent).toBe("—");
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

  it("waits for server pricing instead of calculating shipping locally", () => {
    const items = [{ name: "Product A", quantity: 1, subtotal: 600000 }];
    renderer.renderSummary(items);
    expect(document.getElementById("checkout-total").textContent).toBe("—");
  });

  it("renders the server quote including tax before order placement", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<span id="checkout-subtotal"></span><span id="checkout-tax"></span><span id="checkout-shipping"></span><span id="checkout-discount"></span><p id="checkout-quote-status"></p>',
    );
    renderer.renderQuote({
      subtotal: 150000,
      tax: 15000,
      shippingFee: 30000,
      discountAmount: 0,
      total: 195000,
    });
    expect(document.getElementById("checkout-total").textContent).toBe(
      "195.000 ₫",
    );
    expect(document.getElementById("checkout-tax").textContent).toBe(
      "15.000 ₫",
    );
    expect(document.getElementById("checkout-shipping").textContent).toBe(
      "30.000 ₫",
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
    expect(document.getElementById("success-tax").textContent).toBe("50.000 ₫");
    expect(document.getElementById("success-shipping").textContent).toBe("0 ₫");
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

  it("renders an empty summary for a null item list", () => {
    renderer.renderSummary(null);

    expect(document.getElementById("checkout-items").textContent).toBe(
      "Your cart is empty.",
    );
    expect(document.getElementById("checkout-total").textContent).toBe("0 ₫");
  });

  it("renders quote status and clears pricing fields when present", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<span id="checkout-subtotal">100</span><span id="checkout-tax">10</span><span id="checkout-shipping">20</span><span id="checkout-discount">5</span><p id="checkout-quote-status"></p>',
    );

    renderer.renderQuoteStatus("Pricing unavailable");

    expect(document.getElementById("checkout-total").textContent).toBe("—");
    for (const id of [
      "checkout-subtotal",
      "checkout-tax",
      "checkout-shipping",
      "checkout-discount",
    ]) {
      expect(document.getElementById(id).textContent).toBe("—");
    }
    expect(document.getElementById("checkout-quote-status").textContent).toBe(
      "Pricing unavailable",
    );
  });

  it("renders quote values when the optional status element is absent", () => {
    document.body.innerHTML = `
      <span id="checkout-items"></span><span id="checkout-total"></span>
      <span id="checkout-subtotal"></span><span id="checkout-tax"></span>
      <span id="checkout-shipping"></span><span id="checkout-discount"></span>
    `;
    const minimalRenderer = new CheckoutRenderer();

    expect(() =>
      minimalRenderer.renderQuote({
        subtotal: 100,
        tax: 10,
        shippingFee: 20,
        discountAmount: 5,
        total: 125,
      }),
    ).not.toThrow();
    expect(document.getElementById("checkout-total").textContent).toBe("125 ₫");
  });

  it("omits an empty discount code from success pricing", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<span id="success-subtotal"></span><span id="success-tax"></span><span id="success-shipping"></span><span id="success-discount"></span><span id="success-discount-code">stale</span><span id="success-total"></span>',
    );

    renderer.renderSuccessPricing({
      subtotal: 100,
      tax: 10,
      shippingFee: 20,
      discountAmount: 0,
      discountCode: null,
      total: 130,
    });

    expect(document.getElementById("success-discount-code").textContent).toBe("");
    expect(document.getElementById("success-total").textContent).toBe("130 ₫");
  });

});

describe("CheckoutRenderer optional pricing elements", () => {
  it("renders success pricing when the discount code element is absent", () => {
    document.body.innerHTML = '<span id="success-total"></span>';
    const minimal = new CheckoutRenderer();
    expect(() => minimal.renderSuccessPricing({ subtotal: 1, tax: 2, shippingFee: 3, discountAmount: 0, total: 6 })).not.toThrow();
    expect(document.getElementById("success-total").textContent).toBe("6 ₫");
  });

  it("renders quote status when optional fields are absent", () => {
    document.body.innerHTML = '<span id="checkout-total"></span>';
    const minimal = new CheckoutRenderer();
    expect(() => minimal.renderQuoteStatus("Unavailable")).not.toThrow();
    expect(document.getElementById("checkout-total").textContent).toBe("—");
  });
});
