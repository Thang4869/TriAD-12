import { ModalService } from "./ModalService.js";
import { formatPrice } from "../../shared/utils/helpers.js";
import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";

export class ModalController {
  constructor() {
    this.service = new ModalService();
    this.setupEventListeners();

    this.overlay = document.getElementById("product-modal-overlay");
    this.content = document.getElementById("product-modal-content");
    this.title = document.getElementById("modal-title");
    this.price = document.getElementById("modal-price");
    this.image = document.getElementById("modal-img");
    this.quantityEl = document.getElementById("modal-quantity");
    this._isClosing = false;
  }

  close() {
    if (this._isClosing || !this.overlay) return;
    this._isClosing = true;

    this.overlay.classList.add("opacity-0");
    this.content?.classList.add("scale-95");

    setTimeout(() => {
      this.overlay.classList.add("hidden");
      this._isClosing = false;
    }, 300);

    document.body.style.overflow = "";
    this.service.close();
  }

  setupEventListeners() {
    eventBus.on(EVENTS.MODAL_OPENED, (data) => {
      this.render(data.productId);
    });

    eventBus.on(EVENTS.MODAL_CLOSED, () => {
      this.close();
    });

    document
      .getElementById("close-modal-btn")
      ?.addEventListener("click", () => {
        this.close();
      });

    this.overlay?.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.getElementById("qty-plus")?.addEventListener("click", () => {
      this.updateQuantity(1);
    });

    document.getElementById("qty-minus")?.addEventListener("click", () => {
      this.updateQuantity(-1);
    });

    document.getElementById("add-cart-btn")?.addEventListener("click", () => {
      this.handleAddToCart();
    });

    document
      .getElementById("modal-buy-now-btn")
      ?.addEventListener("click", () => {
        this.handleBuyNow();
      });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.service.isOpen) {
        this.close();
      }
    });
  }

  render(productId) {
    const product = window.productsController?.getProduct(productId);
    if (!product) {
      console.error("Product not found:", productId);
      return;
    }

    this.service.setProduct(productId);

    if (this.title) this.title.textContent = product.name;
    if (this.price) this.price.textContent = formatPrice(product.price);
    if (this.image) {
      this.image.src = product.image;
      this.image.className = `w-full max-w-sm h-auto object-contain transition-all duration-300 filter ${product.filter || ""}`;
    }
    if (this.quantityEl) this.quantityEl.textContent = 1;

    this.show();
  }

  show() {
    if (!this.overlay) return;

    this.overlay.classList.remove("hidden");
    requestAnimationFrame(() => {
      this.overlay.classList.remove("opacity-0");
      this.content?.classList.remove("scale-95");
    });

    document.body.style.overflow = "hidden";
    this.service.isOpen = true;
  }

  updateQuantity(delta) {
    const newQuantity = this.service.updateQuantity(delta);
    if (this.quantityEl) {
      this.quantityEl.textContent = newQuantity;
    }
  }

  handleAddToCart() {
    const productId = this.service.getProductId();
    const quantity = this.service.getQuantity();
    const product = window.productsController?.getProduct(productId);

    if (!product) return;

    if (window.cartController) {
      const img = this.image;
      window.cartController.addToCart(product, quantity, img);
    }

    if (window.notifications) {
      const qtyText = quantity > 1 ? ` (${quantity} items)` : "";
      window.notifications.add(
        "Added to Cart",
        `${product.name}${qtyText} has been added to your cart.`,
        "success",
      );
    }

    this.close();

    setTimeout(() => {
      if (window.cartController) {
        window.cartController.openDrawer();
      }
    }, 400);
  }

  handleBuyNow() {
    const productId = this.service.getProductId();
    const quantity = this.service.getQuantity();
    const product = window.productsController?.getProduct(productId);

    if (!product) return;

    if (window.cartController) {
      const img = this.image;
      window.cartController.addToCart(product, quantity, img);
    }

    if (window.notifications) {
      const qtyText = quantity > 1 ? ` (${quantity} items)` : "";
      window.notifications.add(
        "Added to Cart",
        `${product.name}${qtyText} has been added to your cart.`,
        "success",
      );
    }

    this.close();

    setTimeout(() => {
      if (window.cartController) {
        window.cartController.openDrawer();
        setTimeout(() => {
          document.getElementById("checkout-btn")?.scrollIntoView({
            behavior: "smooth",
          });
        }, 300);
      }
    }, 400);
  }

  open(productId) {
    this.service.open(productId);
  }
}
