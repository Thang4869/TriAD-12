import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bootstrap } from "../../src/app/bootstrap.js";
import { notificationController } from "../../src/modules/notification/index.js";

vi.mock("../../src/shared/utils/loader.js", () => ({
  loadComponents: vi.fn().mockResolvedValue([]),
}));

describe("Cart Flow Integration", () => {
  beforeEach(async () => {
    document.body.innerHTML = `
      <!-- All required containers -->
      <div id="header-container"></div>
      <div id="page-content">
        <div id="hero-container"></div>
        <div id="about-container"></div>
        <div id="features-container"></div>
        <div id="products-container"></div>
      </div>
      <div id="footer-container"></div>
      <div id="toast-container"></div>
      <div id="cart-drawer-container"></div>
      <div id="product-modal-container"></div>
      <div id="checkout-modal-container"></div>
      <div id="success-modal-container"></div>
      <div id="cart-overlay"></div>
      <span id="cart-badge">0</span>
      <button id="cart-icon-btn">Cart</button>
      <button id="checkout-btn">Checkout</button>
      <input id="search-input" placeholder="Search product...">
      <div id="search-suggestion" class="hidden"></div>
      <div id="product-grid"></div>
    `;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<div>Mock HTML</div>"),
    });
    await bootstrap();
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    if (
      notificationController &&
      typeof notificationController.destroy === "function"
    ) {
      notificationController.destroy();
    }
  });

  it("should add product to cart and update badge", async () => {
    const grid = document.getElementById("product-grid");
    grid.innerHTML = `
      <div class="product-card" data-product-id="1">
        <img src="../images/21.jpg" alt="Product">
        <button data-action="add-to-cart" data-id="1">Add to Cart</button>
      </div>
    `;

    const addBtn = screen.getByText("Add to Cart");
    fireEvent.click(addBtn);

    await waitFor(() => {
      const badge = document.getElementById("cart-badge");
      expect(badge.textContent).toBe("1");
    });
  });
});
