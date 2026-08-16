import { CartService } from "./CartService.js";
import { CartRenderer } from "./CartRenderer.js";
import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";

export class CartController {
  constructor() {
    this.service = new CartService();
    this.renderer = new CartRenderer();
    this.isDrawerOpen = false;

    this.setupEventListeners();
    this.service.load();
  }

  setupEventListeners() {
    eventBus.on(EVENTS.CART_UPDATED, (data) => {
      this.renderer.render(data.items);
      this.renderer.updateBadge(data.count);
      this.renderer.setCheckoutEnabled(!data.isEmpty);
    });

    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-id]");
      if (!target) return;

      const id = Number(target.dataset.id);
      const action = target.dataset.action;

      if (action === "remove") {
        this.removeItem(id);
      } else if (action === "increase") {
        this.increaseItem(id);
      } else if (action === "decrease") {
        this.decreaseItem(id);
      }
    });
  }

  addToCart(product, quantity = 1, flyElement = null) {
    console.log("Adding to cart:", product);
    const result = this.service.add(product, quantity);

    if (flyElement && window.flyToCart) {
      window.flyToCart.fly(flyElement);
    }

    return result;
  }

  removeItem(id) {
    return this.service.remove(id);
  }

  increaseItem(id) {
    return this.service.increase(id);
  }

  decreaseItem(id) {
    return this.service.decrease(id);
  }

  clear() {
    return this.service.clear();
  }

  getItems() {
    return this.service.items;
  }

  getTotal() {
    return this.service.total;
  }

  getCount() {
    return this.service.count;
  }

  openDrawer() {
    if (this.isDrawerOpen) return;

    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");

    if (!overlay || !drawer) return;

    overlay.classList.remove("hidden");
    requestAnimationFrame(() => {
      overlay.classList.remove("opacity-0");
      drawer.classList.remove("translate-x-full");
    });

    this.isDrawerOpen = true;
    document.body.style.overflow = "hidden";
    eventBus.emit(EVENTS.DRAWER_OPENED);
  }

  closeDrawer() {
    if (!this.isDrawerOpen) return;

    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");

    if (!overlay || !drawer) return;

    overlay.classList.add("opacity-0");
    drawer.classList.add("translate-x-full");

    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 300);

    this.isDrawerOpen = false;
    document.body.style.overflow = "";
    eventBus.emit(EVENTS.DRAWER_CLOSED);
  }
}
