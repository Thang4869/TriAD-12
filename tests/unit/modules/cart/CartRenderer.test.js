import { describe, it, expect, beforeEach } from "vitest";
import { CartRenderer } from "../../../../src/modules/cart/CartRenderer.js";
import { CartItemModel } from "../../../../src/shared/models/CartItemModel.js";

describe("CartRenderer", () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="cart-scroll"></div>
      <span id="cart-total">0 ₫</span>
      <span id="cart-badge">0</span>
      <button id="checkout-btn">Checkout</button>
    `;
    renderer = new CartRenderer();
  });

  it("should render empty cart", () => {
    renderer.render([]);
    const container = document.querySelector(".cart-scroll");
    expect(container.innerHTML).toContain("The shopping cart is empty");
  });

  it("should render cart items", () => {
    const item = new CartItemModel(
      {
        id: 1,
        name: "Test Product",
        color: "White",
        price: 100000,
        image: "test.jpg",
      },
      2,
    );

    renderer.render([item]);
    const container = document.querySelector(".cart-scroll");
    expect(container.innerHTML).toContain("Test Product");
    expect(container.innerHTML).toContain("200.000 ₫");
  });

  it("should update badge count", () => {
    renderer.updateBadge(5);
    const badge = document.getElementById("cart-badge");
    expect(badge.textContent).toBe("5");
    expect(badge.style.display).toBe("flex");
  });

  it("should hide badge when count is 0", () => {
    renderer.updateBadge(0);
    const badge = document.getElementById("cart-badge");
    expect(badge.style.display).toBe("none");
  });

  it("should update total", () => {
    renderer.updateTotal(250000);
    const total = document.getElementById("cart-total");
    expect(total.textContent).toBe("250.000 ₫");
  });

  it("should enable/disable checkout button", () => {
    renderer.setCheckoutEnabled(true);
    const btn = document.getElementById("checkout-btn");
    expect(btn.disabled).toBe(false);
    expect(btn.style.opacity).toBe("1");

    renderer.setCheckoutEnabled(false);
    expect(btn.disabled).toBe(true);
    expect(btn.style.opacity).toBe("0.5");
  });

  it("returns early when the cart container is missing", () => {
    document.body.innerHTML = "";
    const rendererWithoutContainer = new CartRenderer();

    expect(() =>
      rendererWithoutContainer.render([{ id: "item" }]),
    ).not.toThrow();
    expect(rendererWithoutContainer.container).toBeNull();
  });

  it("treats a null item list as an empty cart", () => {
    renderer.render(null);

    expect(document.querySelector(".cart-scroll").textContent).toContain(
      "The shopping cart is empty.",
    );
    expect(document.getElementById("cart-total").textContent).toBe("0 ₫");
    expect(document.getElementById("cart-badge").style.display).toBe("none");
  });

  it("uses an empty image filter when the item has no filter", () => {
    const element = renderer.createItemElement({
      id: "plain",
      image: "plain.jpg",
      name: "Plain item",
      price: 1000,
      subtotal: 1000,
      quantity: 1,
    });

    expect(element.querySelector("img").className).not.toContain("undefined");
  });

  it("tolerates missing optional badge, total, and checkout elements", () => {
    document.body.innerHTML = '<div class="cart-scroll"></div>';
    const minimalRenderer = new CartRenderer();

    expect(() => minimalRenderer.updateBadge(2)).not.toThrow();
    expect(() => minimalRenderer.updateTotal(2000)).not.toThrow();
    expect(() => minimalRenderer.setCheckoutEnabled(true)).not.toThrow();
  });

  it("renders product names as text instead of parsing HTML payloads", () => {
    const element = renderer.createItemElement({
      id: "safe-id",
      image: "product.jpg",
      name: '<img src=x onerror="alert(1)">',
      price: 1000,
      subtotal: 1000,
      quantity: 1,
    });

    expect(element.querySelector("h3").textContent).toBe(
      '<img src=x onerror="alert(1)">',
    );
    expect(element.querySelectorAll("img")).toHaveLength(1);
    expect(element.querySelector("h3 img")).toBeNull();
    expect(element.querySelector("[onerror]")).toBeNull();
  });

  it("rejects image URLs that contain attribute-breaking payloads", () => {
    const element = renderer.createItemElement({
      id: "safe-id",
      image: 'photo.jpg" onerror="alert(1)',
      name: "Safe product",
      price: 1000,
      subtotal: 1000,
      quantity: 1,
    });

    const image = element.querySelector("img");
    expect(image.hasAttribute("src")).toBe(false);
    expect(image.hasAttribute("onerror")).toBe(false);
  });

  it("keeps hostile item IDs inside data attributes without creating markup", () => {
    const hostileId = 'item" onclick="alert(1)';
    const element = renderer.createItemElement({
      id: hostileId,
      image: "product.jpg",
      name: "Safe product",
      price: 1000,
      subtotal: 1000,
      quantity: 1,
    });

    expect(element.dataset.id).toBe(hostileId);
    expect(
      [...element.querySelectorAll("button")].every(
        (button) => button.dataset.id === hostileId,
      ),
    ).toBe(true);
    expect(element.querySelector("[onclick]")).toBeNull();
  });

  it("does not interpret hostile image filters as class attributes or handlers", () => {
    const element = renderer.createItemElement({
      id: "safe-id",
      image: "product.jpg",
      filter: 'grayscale" onerror="alert(1)',
      name: "Safe product",
      price: 1000,
      subtotal: 1000,
      quantity: 1,
    });

    const image = element.querySelector("img");
    expect(image.classList.contains("grayscale")).toBe(false);
    expect(image.hasAttribute("onerror")).toBe(false);
    expect(image.getAttribute("class")).not.toContain('"');
  });

  it("preserves valid image URLs, filters, and delegated cart action attributes", () => {
    const element = renderer.createItemElement({
      id: "product-42",
      image: "https://cdn.example.com/product.jpg",
      filter: "grayscale brightness-95",
      name: "Valid product",
      price: 1000,
      subtotal: 2000,
      quantity: 2,
    });

    expect(element.querySelector("img").getAttribute("src")).toBe(
      "https://cdn.example.com/product.jpg",
    );
    expect(element.querySelector("img").classList.contains("grayscale")).toBe(
      true,
    );
    expect(element.querySelector("h3").textContent).toBe("Valid product");
    expect(
      [...element.querySelectorAll("button")].map((button) => [
        button.dataset.action,
        button.dataset.id,
      ]),
    ).toEqual([
      ["remove", "product-42"],
      ["decrease", "product-42"],
      ["increase", "product-42"],
    ]);
  });

  it("rejects non-HTTP image protocols while accepting relative image paths", () => {
    const unsafeElement = renderer.createItemElement({
      id: "unsafe",
      image: "javascript:alert(1)",
      name: "Unsafe URL",
      price: 1000,
      subtotal: 1000,
      quantity: 1,
    });
    const relativeElement = renderer.createItemElement({
      id: "relative",
      image: "../images/product.jpg",
      name: "Relative URL",
      price: 1000,
      subtotal: 1000,
      quantity: 1,
    });

    expect(unsafeElement.querySelector("img").hasAttribute("src")).toBe(false);
    expect(relativeElement.querySelector("img").getAttribute("src")).toBe(
      "../images/product.jpg",
    );
  });
});
