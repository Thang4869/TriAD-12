import { waitFor } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartController } from "../../src/modules/cart/CartController.js";
import { CheckoutController } from "../../src/modules/checkout/CheckoutController.js";
import { authService } from "../../src/modules/auth/AuthService.js";

const product = {
  id: "product-1",
  name: "Premium Lunch Box",
  price: 100000,
  stock: 10,
  image: "../images/21.jpg",
  isActive: true,
};

const serverOrder = {
  id: "order-1",
  orderNumber: "ORD-SERVER-001",
  subtotal: 100000,
  tax: 11000,
  shippingFee: 0,
  discountAmount: 5000,
  discountCode: "SAVE5",
  total: 106000,
};

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: vi.fn(() => "application/json") },
    json: vi.fn().mockResolvedValue({ data }),
  };
}

describe("Checkout flow integration", () => {
  let cartState;
  let checkoutController;
  let cartController;
  let checkoutRequests;
  let failCheckout;

  beforeEach(() => {
    cartState = [];
    checkoutRequests = [];
    failCheckout = false;
    authService.currentUser = { id: "user-1", email: "user@example.com" };

    document.body.innerHTML = `
      <div class="cart-scroll"></div>
      <span id="cart-total"></span>
      <span id="cart-badge">0</span>
      <button id="checkout-btn"></button>
      <div id="cart-overlay"></div>
      <div id="cart-drawer" class="hidden"></div>
      <form id="checkout-form">
        <input id="phone" value="0123456789">
        <input id="address" value="123 Main St">
        <textarea id="notes"></textarea>
        <input id="discount-code" value="SAVE5">
        <input type="radio" name="payment" value="cod" checked>
        <button type="submit">Place Order</button>
      </form>
      <div id="checkout-modal" class="hidden"><div class="bg-white"></div><div id="checkout-items"></div><span id="checkout-total"></span></div>
      <div id="success-modal" class="hidden"><div class="bg-white"></div><h2>Order Placed Successfully!</h2><span id="success-order-id"></span><span id="success-subtotal"></span><span id="success-tax"></span><span id="success-shipping"></span><span id="success-discount"></span><span id="success-discount-code"></span><span id="success-total"></span></div>
    `;

    global.fetch = vi.fn(async (url, options = {}) => {
      const method = options.method || "GET";
      if (url.endsWith("/cart") && method === "GET") {
        return jsonResponse({
          items: cartState.map((item) => ({
            id: `cart-${item.productId}`,
            productId: item.productId,
            quantity: item.quantity,
            product,
          })),
        });
      }
      if (url.endsWith("/cart/items") && method === "POST") {
        const body = JSON.parse(options.body);
        cartState = [{ productId: body.productId, quantity: body.quantity }];
        return jsonResponse({});
      }
      if (url.endsWith("/cart") && method === "DELETE") {
        cartState = [];
        return jsonResponse({});
      }
      if (url.endsWith("/checkout") && method === "POST") {
        checkoutRequests.push(JSON.parse(options.body));
        if (failCheckout) return jsonResponse({ message: "Checkout failed" }, 500);
        return jsonResponse({ order: serverOrder });
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    window.authController = { requireAuth: (action) => action() };
    window.toast = { error: vi.fn(), info: vi.fn(), success: vi.fn() };
    window.notifications = { add: vi.fn() };
    window.productsController = { resetFilters: vi.fn() };

    cartController = new CartController();
    window.cartController = cartController;
    checkoutController = new CheckoutController();
    window.checkoutController = checkoutController;
  });

  afterEach(() => {
    authService.currentUser = null;
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("adds a product, submits checkout, renders the server order, and clears the cart", async () => {
    cartController.addToCart(product);
    await waitFor(() => expect(cartController.getItems()).toHaveLength(1));

    checkoutController.openCheckout();
    document.getElementById("notes").value = "Leave at reception";
    await checkoutController.handleSubmit(new Event("submit", { cancelable: true }));

    expect(checkoutRequests).toEqual([
      {
        address: "123 Main St",
        phone: "0123456789",
        notes: "Leave at reception",
        discountCode: "SAVE5",
        paymentMethod: "COD",
      },
    ]);
    expect(document.getElementById("success-order-id").textContent).toBe("ORD-SERVER-001");
    expect(document.getElementById("success-total").textContent).toBe("106.000 ₫");
    expect(document.getElementById("success-subtotal").textContent).toBe("100.000 ₫");
    expect(cartController.getItems()).toHaveLength(0);
    expect(document.getElementById("cart-badge").textContent).toBe("0");
    expect(document.querySelector(".cart-scroll").textContent).toContain("empty");
  });

  it("keeps the cart and hides success when checkout fails", async () => {
    cartController.addToCart(product);
    await waitFor(() => expect(cartController.getItems()).toHaveLength(1));
    failCheckout = true;

    checkoutController.openCheckout();
    await checkoutController.handleSubmit(new Event("submit", { cancelable: true }));

    expect(cartController.getItems()).toHaveLength(1);
    expect(document.getElementById("success-modal").classList.contains("hidden")).toBe(true);
    expect(window.toast.error).toHaveBeenCalled();
  });
});
