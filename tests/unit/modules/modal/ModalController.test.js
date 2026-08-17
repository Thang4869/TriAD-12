import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ModalController } from "../../../../src/modules/modal/ModalController.js";
import { ProductModel } from "../../../../src/shared/models/ProductModel.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

describe("ModalController", () => {
  let modalController;
  let mockProduct;
  let consoleErrorSpy;

  const createDOM = () => {
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
          <button id="checkout-btn">Checkout</button>
        </div>
      </div>
    `;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    createDOM();

    document.body.style.overflow = "";

    mockProduct = new ProductModel({
      id: 1,
      name: "Test Product",
      color: "White",
      price: 150000,
      image: "test.jpg",
      filter: "grayscale",
    });

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

    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => cb());

    modalController = new ModalController();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete window.productsController;
    delete window.cartController;
    delete window.notifications;
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });

  describe("constructor", () => {
    it("should initialize service and DOM references", () => {
      expect(modalController.service).toBeDefined();
      expect(modalController.overlay).toBe(document.getElementById("product-modal-overlay"));
      expect(modalController.content).toBe(document.getElementById("product-modal-content"));
      expect(modalController.title).toBe(document.getElementById("modal-title"));
      expect(modalController.price).toBe(document.getElementById("modal-price"));
      expect(modalController.image).toBe(document.getElementById("modal-img"));
      expect(modalController.quantityEl).toBe(document.getElementById("modal-quantity"));
      expect(modalController._isClosing).toBe(false);
    });

    it("should set up event listeners", () => {
      const onSpy = vi.spyOn(eventBus, "on");
      new ModalController();
      expect(onSpy).toHaveBeenCalledWith(EVENTS.MODAL_OPENED, expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith(EVENTS.MODAL_CLOSED, expect.any(Function));
    });
  });

  describe("open and render", () => {
    it("should call service.open and emit MODAL_OPENED event", () => {
      const openSpy = vi.spyOn(modalController.service, "open");
      const emitSpy = vi.spyOn(eventBus, "emit");

      modalController.open(1);

      expect(openSpy).toHaveBeenCalledWith(1);
      expect(emitSpy).toHaveBeenCalledWith(EVENTS.MODAL_OPENED, { productId: 1 });
    });

    it("should render product details when product exists", () => {
      modalController.open(1);

      expect(modalController.title.textContent).toBe("Test Product");
      expect(modalController.price.textContent).toBe("150.000 ₫");
      expect(modalController.image.src).toContain("test.jpg");
      expect(modalController.image.className).toContain("grayscale");
      expect(modalController.quantityEl.textContent).toBe("1");
      expect(modalController.overlay.classList.contains("hidden")).toBe(false);
    });

    it("should handle missing product gracefully (log error, no update)", () => {
      window.productsController.getProduct.mockReturnValue(null);
      const renderSpy = vi.spyOn(modalController, "show");

      modalController.open(999);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Product not found:", 999);
      expect(modalController.title.textContent).toBe("");
      expect(modalController.price.textContent).toBe("");
      expect(renderSpy).not.toHaveBeenCalled();
    });

    it("should handle missing DOM elements in render gracefully", () => {
      document.getElementById("modal-title")?.remove();
      document.getElementById("modal-price")?.remove();
      document.getElementById("modal-img")?.remove();
      document.getElementById("modal-quantity")?.remove();

      expect(() => modalController.render(1)).not.toThrow();
    });

    it("should apply empty filter if product.filter is undefined", () => {
      const productNoFilter = new ProductModel({
        id: 2,
        name: "No filter",
        color: "Red",
        price: 100,
        image: "no.jpg",
      });
      window.productsController.getProduct.mockReturnValue(productNoFilter);

      modalController.open(2);
      expect(modalController.image.className).toContain("filter ");
    });
  });

  describe("show", () => {
    it("should show overlay and set body overflow hidden", () => {
      const overlay = document.getElementById("product-modal-overlay");
      overlay.classList.add("hidden");
      document.body.style.overflow = "";

      modalController.show();

      expect(overlay.classList.contains("hidden")).toBe(false);
      expect(overlay.classList.contains("opacity-0")).toBe(false);
      expect(document.body.style.overflow).toBe("hidden");
      expect(modalController.service.isOpen).toBe(true);
    });

    it("should do nothing if overlay is missing", () => {
      document.getElementById("product-modal-overlay")?.remove();
      document.body.style.overflow = "";
      const ctrl = new ModalController();
      expect(() => ctrl.show()).not.toThrow();
      expect(document.body.style.overflow).not.toBe("hidden");
    });
  });

  describe("close", () => {
    it("should close overlay and reset state after timeout", () => {
      const overlay = document.getElementById("product-modal-overlay");
      const content = document.getElementById("product-modal-content");
      overlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      modalController._isClosing = false;

      const closeServiceSpy = vi.spyOn(modalController.service, "close");

      modalController.close();

      expect(modalController._isClosing).toBe(true);
      expect(overlay.classList.contains("opacity-0")).toBe(true);
      expect(content.classList.contains("scale-95")).toBe(true);

      vi.advanceTimersByTime(300);

      expect(overlay.classList.contains("hidden")).toBe(true);
      expect(modalController._isClosing).toBe(false);
      expect(document.body.style.overflow).toBe("");
      expect(closeServiceSpy).toHaveBeenCalled();
    });

    it("should return early if already closing or overlay missing", () => {
      modalController._isClosing = true;
      const closeServiceSpy = vi.spyOn(modalController.service, "close");
      modalController.close();
      expect(closeServiceSpy).not.toHaveBeenCalled();

      modalController._isClosing = false;
      modalController.overlay = null;
      const closeServiceSpy2 = vi.spyOn(modalController.service, "close");
      modalController.close();
      expect(closeServiceSpy2).not.toHaveBeenCalled();
    });

    it("should handle missing content element gracefully", () => {
      document.getElementById("product-modal-content")?.remove();
      const overlay = document.getElementById("product-modal-overlay");
      overlay.classList.remove("hidden");
      modalController._isClosing = false;

      expect(() => modalController.close()).not.toThrow();
      expect(overlay.classList.contains("opacity-0")).toBe(true);
    });
  });

  describe("updateQuantity", () => {
    it("should update quantity in service and DOM", () => {
      modalController.open(1);
      const quantityEl = document.getElementById("modal-quantity");

      modalController.updateQuantity(2);
      expect(quantityEl.textContent).toBe("3");
      expect(modalController.service.getQuantity()).toBe(3);

      modalController.updateQuantity(-5);
      expect(quantityEl.textContent).toBe("1");
    });

    it("should update service even if quantity DOM element missing", () => {
      document.getElementById("modal-quantity")?.remove();
      modalController.open(1);

      modalController.updateQuantity(2);
      expect(modalController.service.getQuantity()).toBe(3);
    });
  });

  describe("handleAddToCart", () => {
    it("should return early if product not found", () => {
      window.productsController.getProduct.mockReturnValue(null);
      modalController.open(1);
      const closeSpy = vi.spyOn(modalController, "close");

      modalController.handleAddToCart();

      expect(window.cartController.addToCart).not.toHaveBeenCalled();
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it("should add product to cart with fly element and notifications", () => {
      const closeSpy = vi.spyOn(modalController, "close");
      modalController.open(1);
      modalController.service.updateQuantity(1);

      modalController.handleAddToCart();

      expect(window.cartController.addToCart).toHaveBeenCalledWith(
        mockProduct,
        2,
        modalController.image,
      );
      expect(window.notifications.add).toHaveBeenCalledWith(
        "Added to Cart",
        "Test Product (2 items) has been added to your cart.",
        "success",
      );
      expect(closeSpy).toHaveBeenCalled();

      vi.advanceTimersByTime(400);
      expect(window.cartController.openDrawer).toHaveBeenCalled();
    });

    it("should work without notifications", () => {
      delete window.notifications;
      modalController.open(1);
      const closeSpy = vi.spyOn(modalController, "close");

      modalController.handleAddToCart();

      expect(window.cartController.addToCart).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
      vi.advanceTimersByTime(400);
      expect(window.cartController.openDrawer).toHaveBeenCalled();
    });

    it("should work without cartController (skip add and drawer)", () => {
      delete window.cartController;
      modalController.open(1);
      const closeSpy = vi.spyOn(modalController, "close");

      modalController.handleAddToCart();

      expect(closeSpy).toHaveBeenCalled();
    });

    it("should handle quantity = 1 message correctly", () => {
      modalController.open(1);
      modalController.service.quantity = 1;
      modalController.handleAddToCart();

      expect(window.notifications.add).toHaveBeenCalledWith(
        "Added to Cart",
        "Test Product has been added to your cart.",
        "success",
      );
      vi.advanceTimersByTime(400);
      expect(window.cartController.openDrawer).toHaveBeenCalled();
    });
  });

  describe("handleBuyNow", () => {
    let scrollIntoViewMock;

    beforeEach(() => {
      scrollIntoViewMock = vi.fn();
      const checkoutBtn = document.getElementById("checkout-btn");
      if (checkoutBtn) {
        checkoutBtn.scrollIntoView = scrollIntoViewMock;
      }
    });

    it("should return early if product not found", () => {
      window.productsController.getProduct.mockReturnValue(null);
      modalController.open(1);
      const closeSpy = vi.spyOn(modalController, "close");

      modalController.handleBuyNow();

      expect(window.cartController.addToCart).not.toHaveBeenCalled();
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it("should add product, close, open drawer and scroll to checkout", () => {
      const closeSpy = vi.spyOn(modalController, "close");
      modalController.open(1);
      modalController.service.updateQuantity(1);

      modalController.handleBuyNow();

      expect(window.cartController.addToCart).toHaveBeenCalledWith(
        mockProduct,
        2,
        modalController.image,
      );
      expect(window.notifications.add).toHaveBeenCalledWith(
        "Added to Cart",
        "Test Product (2 items) has been added to your cart.",
        "success",
      );
      expect(closeSpy).toHaveBeenCalled();

      vi.advanceTimersByTime(400);
      expect(window.cartController.openDrawer).toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" });
    });

    it("should work without notifications", () => {
      delete window.notifications;
      modalController.open(1);
      const closeSpy = vi.spyOn(modalController, "close");

      modalController.handleBuyNow();

      expect(window.cartController.addToCart).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
      vi.advanceTimersByTime(400);
      expect(window.cartController.openDrawer).toHaveBeenCalled();
    });

    it("should work without cartController", () => {
      delete window.cartController;
      modalController.open(1);
      const closeSpy = vi.spyOn(modalController, "close");

      modalController.handleBuyNow();

      expect(closeSpy).toHaveBeenCalled();
    });

    it("should not scroll if checkout-btn missing", () => {
      document.getElementById("checkout-btn")?.remove();
      modalController.open(1);
      modalController.handleBuyNow();
      vi.advanceTimersByTime(400);
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });
  });

  describe("event listeners", () => {
    it("should respond to MODAL_OPENED event by rendering", () => {
      const renderSpy = vi.spyOn(modalController, "render");
      eventBus.emit(EVENTS.MODAL_OPENED, { productId: 42 });
      expect(renderSpy).toHaveBeenCalledWith(42);
    });

    it("should respond to MODAL_CLOSED event by closing", () => {
      const closeSpy = vi.spyOn(modalController, "close");
      eventBus.emit(EVENTS.MODAL_CLOSED);
      expect(closeSpy).toHaveBeenCalled();
    });

    it("should close on close-modal-btn click", () => {
      const closeSpy = vi.spyOn(modalController, "close");
      document.getElementById("close-modal-btn").click();
      expect(closeSpy).toHaveBeenCalled();
    });

    it("should close on overlay click only when target is overlay", () => {
      modalController.open(1);
      const closeSpy = vi.spyOn(modalController, "close");
      const overlay = document.getElementById("product-modal-overlay");
      
      expect(overlay.classList.contains("hidden")).toBe(false);

      overlay.click();
      expect(closeSpy).toHaveBeenCalled();

      closeSpy.mockClear();
      const inner = document.getElementById("product-modal-content");
      inner.click();
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it("should increase quantity on qty-plus click", () => {
      const updateSpy = vi.spyOn(modalController, "updateQuantity");
      document.getElementById("qty-plus").click();
      expect(updateSpy).toHaveBeenCalledWith(1);
    });

    it("should decrease quantity on qty-minus click", () => {
      const updateSpy = vi.spyOn(modalController, "updateQuantity");
      document.getElementById("qty-minus").click();
      expect(updateSpy).toHaveBeenCalledWith(-1);
    });

    it("should trigger handleAddToCart on add-cart-btn click", () => {
      const handleSpy = vi.spyOn(modalController, "handleAddToCart");
      document.getElementById("add-cart-btn").click();
      expect(handleSpy).toHaveBeenCalled();
    });

    it("should trigger handleBuyNow on modal-buy-now-btn click", () => {
      const handleSpy = vi.spyOn(modalController, "handleBuyNow");
      document.getElementById("modal-buy-now-btn").click();
      expect(handleSpy).toHaveBeenCalled();
    });

    it("should close on Escape key if modal is open", () => {
      modalController.open(1);
      const closeSpy = vi.spyOn(modalController, "close");
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);
      expect(closeSpy).toHaveBeenCalled();
    });

    it("should ignore Escape if modal is not open", () => {
      const closeSpy = vi.spyOn(modalController, "close");
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });
});