import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ModalController } from "../../../../src/modules/modal/ModalController.js";
import { ProductModel } from "../../../../src/shared/models/ProductModel.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

describe("ModalController additional edge cases", () => {
  let modalController;
  const mockProduct = new ProductModel({
    id: 1,
    name: "Test Product",
    color: "White",
    price: 150000,
    image: "test.jpg",
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="product-modal-overlay" class="hidden">
        <div id="product-modal-content">
          <button id="close-modal-btn"></button>
          <h2 id="modal-title"></h2>
          <p id="modal-price"></p>
          <img id="modal-img" src="">
          <span id="modal-quantity">1</span>
          <button id="qty-plus"></button>
          <button id="qty-minus"></button>
          <button id="add-cart-btn"></button>
          <button id="modal-buy-now-btn"></button>
        </div>
      </div>
    `;

    window.productsController = {
      getProduct: vi.fn().mockReturnValue(mockProduct),
    };
    window.cartController = {
      addToCart: vi.fn(),
      openDrawer: vi.fn(),
    };
    window.notifications = {
      add: vi.fn(),
    };
    modalController = new ModalController();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete window.productsController;
    delete window.cartController;
    delete window.notifications;
  });

  it("should handle opening with non-existent product", () => {
    window.productsController.getProduct.mockReturnValue(null);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    modalController.open(999);
    expect(consoleSpy).toHaveBeenCalledWith("Product not found:", 999);
    consoleSpy.mockRestore();
  });

  it("should close modal via Escape key", () => {
    modalController.open(1);
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    vi.runAllTimers();
    const overlay = document.getElementById("product-modal-overlay");
    expect(overlay.classList.contains("hidden")).toBe(true);
  });

  it("should handle buy now without cartController", () => {
    const oldCart = window.cartController;
    delete window.cartController;
    const addSpy = vi.spyOn(modalController, "close");
    modalController.open(1);
    document.getElementById("modal-buy-now-btn").click();
    expect(addSpy).toHaveBeenCalled();
    window.cartController = oldCart;
  });

  it("should handle add to cart without notifications", () => {
    const oldNotif = window.notifications;
    delete window.notifications;
    modalController.open(1);
    document.getElementById("add-cart-btn").click();
    expect(window.cartController.addToCart).toHaveBeenCalled();
    window.notifications = oldNotif;
  });

  it("should not decrease quantity below 1", () => {
    modalController.open(1);
    const quantityEl = document.getElementById("modal-quantity");
    document.getElementById("qty-minus").click();
    expect(quantityEl.textContent).toBe("1");
  });

  it("should call eventBus emit on open/close", () => {
    const emitSpy = vi.spyOn(eventBus, "emit");
    modalController.open(1);
    expect(emitSpy).toHaveBeenCalledWith(EVENTS.MODAL_OPENED, { productId: 1 });
    modalController.close();
    vi.advanceTimersByTime(300);
    expect(emitSpy).toHaveBeenCalledWith(EVENTS.MODAL_CLOSED);
  });
});

describe("ModalController - additional edge cases", () => {
  let modalController;
  const mockProduct = new ProductModel({
    id: 1,
    name: "Test",
    price: 100000,
    image: "test.jpg",
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="product-modal-overlay" class="hidden">
        <div id="product-modal-content">
          <button id="close-modal-btn"></button>
          <span id="modal-quantity">1</span>
          <button id="qty-plus"></button>
          <button id="qty-minus"></button>
          <button id="add-cart-btn"></button>
          <button id="modal-buy-now-btn"></button>
          <img id="modal-img">
          <h2 id="modal-title"></h2>
          <p id="modal-price"></p>
        </div>
      </div>
    `;
    window.productsController = {
      getProduct: vi.fn().mockReturnValue(mockProduct),
    };
    window.cartController = { addToCart: vi.fn(), openDrawer: vi.fn() };
    window.notifications = { add: vi.fn() };
    modalController = new ModalController();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.productsController;
    delete window.cartController;
    delete window.notifications;
  });

  it("should handle close when overlay missing", () => {
    document.body.innerHTML = "";
    const ctrl = new ModalController();
    expect(() => ctrl.close()).not.toThrow();
  });

  it("should handle add to cart when cartController missing", () => {
    delete window.cartController;
    modalController.open(1);
    const addBtn = document.getElementById("add-cart-btn");
    const closeSpy = vi.spyOn(modalController, "close");
    addBtn.click();
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should handle add to cart when notifications missing", () => {
    delete window.notifications;
    modalController.open(1);
    const addBtn = document.getElementById("add-cart-btn");
    addBtn.click();
    expect(window.cartController.addToCart).toHaveBeenCalled();
  });

  it("should handle buy now when cartController missing", () => {
    delete window.cartController;
    modalController.open(1);
    const buyBtn = document.getElementById("modal-buy-now-btn");
    const closeSpy = vi.spyOn(modalController, "close");
    buyBtn.click();
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should not update quantity if quantity element missing", () => {
    document.getElementById("modal-quantity")?.remove();
    modalController.open(1);
    modalController.updateQuantity(2);
    expect(modalController.service.getQuantity()).toBe(3);
  });

  it("should handle show when overlay missing", () => {
    document.body.innerHTML = "";
    const ctrl = new ModalController();
    expect(() => ctrl.show()).not.toThrow();
  });
});
