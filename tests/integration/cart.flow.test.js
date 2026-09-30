import { fireEvent, waitFor } from "@testing-library/dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bootstrap } from "../../src/app/bootstrap.js";
import { notificationController } from "../../src/modules/notification/index.js";
import { authService } from "../../src/modules/auth/AuthService.js";

vi.mock("../../src/shared/utils/loader.js", () => ({
  loadComponents: vi.fn().mockResolvedValue([]),
}));

const product = {
  id: "product-1",
  name: "Premium Lunch Box",
  description: "Test product",
  price: 100000,
  stock: 10,
  category: "Lunch Box",
  images: ["../images/21.jpg"],
  slug: "premium-lunch-box",
  isActive: true,
};

function jsonResponse(data) {
  return {
    ok: true,
    status: 200,
    headers: {
      get: vi.fn(() => "application/json"),
    },
    json: vi.fn().mockResolvedValue({ data }),
  };
}

describe("Cart Flow Integration", () => {
  beforeEach(async () => {
    sessionStorage.clear();

    sessionStorage.setItem(
      "triad_current_user",
      JSON.stringify({
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
      }),
    );

    authService.currentUser = {
      id: "user-1",
      email: "test@example.com",
      firstName: "Test",
    };

    document.body.innerHTML = `
      <div id="header-container"></div>

      <div id="page-content">
        <div id="hero-container"></div>
        <div id="about-container"></div>
        <div id="features-container"></div>
        <div id="products-container"></div>
      </div>

      <div id="footer-container"></div>
      <div id="toast-container"></div>

      <div id="cart-drawer-container">
        <div id="cart-items"></div>
        <div id="cart-total"></div>
      </div>

      <div id="product-modal-container"></div>
      <div id="checkout-modal-container"></div>
      <div id="success-modal-container"></div>

      <div id="cart-overlay"></div>

      <span id="cart-badge">0</span>

      <button id="cart-icon-btn">Cart</button>
      <button id="checkout-btn">Checkout</button>

      <input id="search-input" placeholder="Search product...">

      <select id="sort-select">
        <option value="default">Default</option>
      </select>

      <input
        id="price-slider"
        type="range"
        min="0"
        max="350000"
        value="350000"
      >

      <span id="price-value"></span>
      <button id="reset-filter">Reset</button>

      <div id="search-suggestion" class="hidden"></div>
      <div id="product-count"></div>
      <div id="product-grid"></div>

      <div id="load-more-container" class="hidden">
        <button id="load-more-btn">Load more</button>
      </div>
    `;

    global.fetch = vi.fn(async (url, options = {}) => {
      const method = options.method || "GET";

      if (url.includes("/products") && method === "GET") {
        return jsonResponse({
          products: [product],
          total: 1,
          page: 1,
          limit: 12,
          totalPages: 1,
        });
      }

      if (url.endsWith("/cart/items") && method === "POST") {
        return jsonResponse({});
      }

      if (url.endsWith("/cart") && method === "GET") {
        return jsonResponse({
          items: [
            {
              id: "cart-item-1",
              productId: product.id,
              quantity: 1,
              product,
            },
          ],
        });
      }

      return jsonResponse({});
    });

    await bootstrap();
  });

  afterEach(() => {
    vi.clearAllMocks();

    authService.currentUser = null;
    sessionStorage.clear();
    document.body.innerHTML = "";

    if (
      notificationController &&
      typeof notificationController.destroy === "function"
    ) {
      notificationController.destroy();
    }
  });

  it("should add product to cart and update badge", async () => {
    const addBtn = document.querySelector(
      '[data-action="add-to-cart"][data-id="product-1"]',
    );

    expect(addBtn).not.toBeNull();

    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(document.getElementById("cart-badge").textContent).toBe("1");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/cart/items"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          productId: "product-1",
          quantity: 1,
        }),
      }),
    );
  });
});
