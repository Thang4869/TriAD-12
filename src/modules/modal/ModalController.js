import { ModalService } from "./ModalService.js";
import { formatPrice } from "../../shared/utils/helpers.js";
import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";

export class ModalController {
  constructor() {
    this.service = new ModalService();

    this.overlay = document.getElementById("product-modal-overlay");
    this.content = document.getElementById("product-modal-content");
    this.title = document.getElementById("modal-title");
    this.price = document.getElementById("modal-price");
    this.image = document.getElementById("modal-img");
    this.imageThumbnails = document.getElementById("modal-image-thumbnails");
    this.quantityEl = document.getElementById("modal-quantity");
    this.productImages = [];
    this._imageSelectionVersion = 0;
    this._isClosing = false;

    this.setupEventListeners();
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

    this.imageThumbnails?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-image-index]");
      if (!button || !this.imageThumbnails.contains(button)) return;
      this.selectImage(Number(button.dataset.imageIndex));
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
    const images = Array.isArray(product.images)
      ? product.images.filter((src) => typeof src === "string" && src.trim())
      : [];
    this.productImages = images.length > 0 ? images : [product.image].filter(Boolean);
    this._imageSelectionVersion += 1;

    if (this.image) {
      this.image.src = this.productImages[0] || "";
      this.image.className = `w-full max-w-sm h-auto object-contain transition-opacity duration-200 opacity-100 filter ${product.filter || ""}`;
    }
    this.renderImageThumbnails();
    if (this.quantityEl) this.quantityEl.textContent = 1;

    this.show();
  }

  renderImageThumbnails() {
    if (!this.imageThumbnails) return;

    this.imageThumbnails.replaceChildren();
    const hasMultipleImages = this.productImages.length > 1;
    this.imageThumbnails.hidden = !hasMultipleImages;
    if (!hasMultipleImages) return;

    this.productImages.forEach((src, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.imageIndex = String(index);
      button.setAttribute("aria-label", `Show product image ${index + 1}`);
      button.setAttribute("aria-pressed", String(index === 0));
      button.className =
        "w-16 h-16 rounded-md overflow-hidden border-2 border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";
      if (index === 0) button.classList.add("border-black");

      const thumbnail = document.createElement("img");
      thumbnail.src = src;
      thumbnail.alt = "";
      thumbnail.width = 64;
      thumbnail.height = 64;
      thumbnail.decoding = "async";
      thumbnail.className = "w-full h-full object-cover";
      button.append(thumbnail);
      this.imageThumbnails.append(button);
    });
  }

  selectImage(index) {
    if (
      !this.image ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.productImages.length
    ) {
      return;
    }

    const selectedSrc = this.productImages[index];
    if (this.image.src.endsWith(selectedSrc)) return;

    this.imageThumbnails?.querySelectorAll("[data-image-index]").forEach((button) => {
      const selected = Number(button.dataset.imageIndex) === index;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("border-black", selected);
    });

    const selectionVersion = ++this._imageSelectionVersion;
    this.image.classList.add("opacity-0");

    requestAnimationFrame(() => {
      if (selectionVersion !== this._imageSelectionVersion) return;
      this.image.src = selectedSrc;
      requestAnimationFrame(() => {
        if (selectionVersion !== this._imageSelectionVersion) return;
        this.image.classList.remove("opacity-0");
      });
    });
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

    const cart = window.cartController;
    if (!product || !cart) return;

    cart.addToCart(product, quantity, this.image, () => {
      this.close();
      setTimeout(() => cart.openDrawer(), 400);
    });
  }

  handleBuyNow() {
    const productId = this.service.getProductId();
    const quantity = this.service.getQuantity();
    const product = window.productsController?.getProduct(productId);

    const cart = window.cartController;
    if (!product || !cart) return;

    cart.addToCart(product, quantity, this.image, () => {
      this.close();
      setTimeout(() => {
        cart.openDrawer();
        setTimeout(() => {
          document.getElementById("checkout-btn")?.scrollIntoView({
            behavior: "smooth",
          });
        }, 300);
      }, 400);
    });
  }

  open(productId) {
    this.service.open(productId);
  }
}
