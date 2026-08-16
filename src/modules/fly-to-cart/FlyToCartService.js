import { APP_CONFIG } from "../../config/settings.config.js";
import { Logger } from "../../core/services/Logger.js";

const { FLY_DURATION } = APP_CONFIG;

export class FlyToCart {
  constructor() {
    this.isFlying = false;
    this.cartBadge = this.findCartBadge();
    Logger.debug("FlyToCart initialized");
  }

  findCartBadge() {
    let badge = document.getElementById("cart-badge");
    if (!badge) {
      badge =
        document.querySelector("#cart-icon-btn") ||
        document.querySelector("#mobile-cart-btn");
    }
    return badge;
  }

  fly(element, callback = null) {
    if (this.isFlying) {
      Logger.debug("Fly animation already in progress");
      if (callback) callback();
      return;
    }

    if (!element) {
      Logger.debug("No element to fly");
      if (callback) callback();
      return;
    }

    const imageSrc = this.getImageSrc(element);
    if (!imageSrc) {
      Logger.debug("No image source found");
      if (callback) callback();
      return;
    }

    const badge = this.cartBadge;
    if (!badge || !document.contains(badge)) {
      this.isFlying = false;
      if (callback) callback();
      return;
    }

    const targetRect = badge.getBoundingClientRect();
    if (!targetRect) {
      Logger.debug("Cart target not found");
      this.cartBadge = this.findCartBadge();
      const retryRect = this.cartBadge?.getBoundingClientRect();
      if (!retryRect) {
        this.isFlying = false;
        if (callback) callback();
        return;
      }
      this.isFlying = false;
      if (callback) callback();
      return;
    }

    this.isFlying = true;

    const sourceRect = element.getBoundingClientRect();

    const flyEl = this.createFlyElement(imageSrc, sourceRect);
    document.body.appendChild(flyEl);

    flyEl.offsetHeight;

    const endX = targetRect.left + targetRect.width / 2 - sourceRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2 - sourceRect.height / 2;

    this.animateFly(flyEl, sourceRect, { x: endX, y: endY }, () => {
      flyEl.remove();
      this.isFlying = false;

      if (this.cartBadge) {
        this.cartBadge.classList.add("cart-badge-pulse");
        setTimeout(() => {
          this.cartBadge?.classList.remove("cart-badge-pulse");
        }, 500);
      }

      if (callback) callback();
    });
  }

  getImageSrc(element) {
    if (element.tagName === "IMG") {
      return element.src;
    }
    const img = element.querySelector("img");
    return img?.src || "";
  }

  createFlyElement(imageSrc, sourceRect) {
    const el = document.createElement("img");
    el.src = imageSrc;
    el.className = "fly-element";
    el.style.position = "fixed";

    const minSize = 120;
    const width = sourceRect.width < 30 ? minSize : sourceRect.width;
    const height = sourceRect.height < 30 ? minSize : sourceRect.height;

    el.style.width = width + "px";
    el.style.height = height + "px";
    el.style.left = sourceRect.left + "px";
    el.style.top = sourceRect.top + "px";
    el.style.borderRadius = "12px";
    el.style.objectFit = "contain";
    el.style.backgroundColor = "#f8f8f8";
    el.style.padding = "8px";
    el.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)";
    el.style.zIndex = "9999";
    el.style.pointerEvents = "none";
    return el;
  }

  animateFly(element, start, end, callback) {
    const startTime = performance.now();
    const startX = start.left;
    const startY = start.top;
    const endX = end.x;
    const endY = end.y;

    function animate(time) {
      const progress = Math.min((time - startTime) / FLY_DURATION, 1);
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentX = startX + (endX - startX) * ease;
      const currentY = startY + (endY - startY) * ease;
      const currentScale = 1 - ease * 0.7;
      const currentOpacity = 1 - ease * 0.3;
      const currentRotation = ease * 30;

      element.style.left = currentX + "px";
      element.style.top = currentY + "px";
      element.style.transform = `scale(${currentScale}) rotate(${currentRotation}deg)`;
      element.style.opacity = currentOpacity;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback();
      }
    }

    requestAnimationFrame(animate);
  }
}

export const flyToCart = new FlyToCart();
window.flyToCart = flyToCart;
