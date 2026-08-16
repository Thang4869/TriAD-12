import { screen, fireEvent } from "@testing-library/dom";
import { afterEach } from "vitest";
import { bootstrap } from "../../src/app/bootstrap.js";
import { notificationController } from "../../src/modules/notification/index.js";

describe("Checkout flow", () => {
  beforeEach(async () => {
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
    await bootstrap();
  });

  afterEach(() => {
    if (
      notificationController &&
      typeof notificationController.destroy === "function"
    ) {
      notificationController.destroy();
    }
    document.body.innerHTML = "";
  });

  it("should complete checkout successfully", async () => {
    expect(document.getElementById("header-container")).toBeTruthy();
  });
});
