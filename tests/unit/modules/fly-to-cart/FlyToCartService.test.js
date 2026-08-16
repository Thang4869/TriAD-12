import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FlyToCart } from "../../../../src/modules/fly-to-cart/FlyToCartService.js";

describe("FlyToCart", () => {
  let flyToCart;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="cart-icon-btn"><span id="cart-badge">0</span></button>
      <img id="product-img" src="test.jpg">
      <div id="product-card">
        <img src="card.jpg">
      </div>
    `;
    vi.spyOn(performance, "now").mockImplementation(() => Date.now());
    vi.useFakeTimers();
    flyToCart = new FlyToCart();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("should initialize with isFlying false", () => {
    expect(flyToCart.isFlying).toBe(false);
    vi.runAllTimers();
  });

  it("should find cart badge on init", () => {
    expect(flyToCart.cartBadge).toBeTruthy();
    vi.runAllTimers();
  });

  it("should find cart badge by id", () => {
    expect(flyToCart.findCartBadge().id).toBe("cart-badge");
    vi.runAllTimers();
  });

  it("should fallback to cart icon button if badge not found", () => {
    document.body.innerHTML = `
      <button id="cart-icon-btn"><span>Cart</span></button>
    `;
    const badge = flyToCart.findCartBadge();
    expect(badge.id).toBe("cart-icon-btn");
    vi.runAllTimers();
  });

  it("should fallback to mobile cart button if neither found", () => {
    document.body.innerHTML = `
      <button id="mobile-cart-btn"><span>Cart</span></button>
    `;
    const badge = flyToCart.findCartBadge();
    expect(badge.id).toBe("mobile-cart-btn");
    vi.runAllTimers();
  });

  it("should get src from img element", () => {
    const img = document.getElementById("product-img");
    expect(flyToCart.getImageSrc(img)).toContain("test.jpg");
    vi.runAllTimers();
  });

  it("should get src from child img inside element", () => {
    const div = document.getElementById("product-card");
    expect(flyToCart.getImageSrc(div)).toContain("card.jpg");
    vi.runAllTimers();
  });

  it("should return empty string if no img found", () => {
    const div = document.createElement("div");
    expect(flyToCart.getImageSrc(div)).toBe("");
    vi.runAllTimers();
  });

  it("should create fly element with correct styles", () => {
    const rect = { left: 100, top: 200, width: 50, height: 60 };
    const el = flyToCart.createFlyElement("test.jpg", rect);
    expect(el.tagName).toBe("IMG");
    expect(el.src).toContain("test.jpg");
    expect(el.style.left).toBe("100px");
    expect(el.style.top).toBe("200px");
    expect(el.style.width).toBe("50px");
    expect(el.style.height).toBe("60px");
    expect(el.style.borderRadius).toBe("12px");
    expect(el.style.position).toBe("fixed");
    vi.runAllTimers();
  });

  it("should return immediately if already flying", () => {
    flyToCart.isFlying = true;
    const callback = vi.fn();
    const img = document.getElementById("product-img");
    flyToCart.fly(img, callback);
    expect(callback).toHaveBeenCalled();
    expect(flyToCart.isFlying).toBe(true);
    vi.runAllTimers();
  });

  it("should return if element is null", () => {
    const callback = vi.fn();
    flyToCart.fly(null, callback);
    expect(callback).toHaveBeenCalled();
    expect(flyToCart.isFlying).toBe(false);
    vi.runAllTimers();
  });

  it("should return if image src is empty", () => {
    const div = document.createElement("div");
    const callback = vi.fn();
    flyToCart.fly(div, callback);
    expect(callback).toHaveBeenCalled();
    vi.runAllTimers();
  });

  it("should return if cart badge not found", () => {
    document.body.innerHTML = "";
    flyToCart.cartBadge = null;
    const img = document.getElementById("product-img");
    const callback = vi.fn();
    flyToCart.fly(img, callback);
    expect(callback).toHaveBeenCalled();
    vi.runAllTimers();
  });

  it("should perform fly animation and callback", () => {
    const img = document.getElementById("product-img");
    const callback = vi.fn();
    const badge = document.getElementById("cart-badge");
    const badgeRect = { left: 200, top: 100, width: 20, height: 20 };
    vi.spyOn(badge, "getBoundingClientRect").mockReturnValue(badgeRect);

    const sourceRect = { left: 50, top: 50, width: 100, height: 100 };
    vi.spyOn(img, "getBoundingClientRect").mockReturnValue(sourceRect);

    const animateSpy = vi.spyOn(flyToCart, "animateFly");

    flyToCart.fly(img, callback);

    expect(animateSpy).toHaveBeenCalled();
    const animateCallback = animateSpy.mock.calls[0][3];
    animateCallback();
    expect(callback).toHaveBeenCalled();
    expect(flyToCart.isFlying).toBe(false);
    expect(badge.classList.contains("cart-badge-pulse")).toBe(true);
    vi.advanceTimersByTime(500);
    expect(badge.classList.contains("cart-badge-pulse")).toBe(false);
    vi.runAllTimers();
  });

  it("should animate element from start to end", async () => {
    const element = document.createElement("div");
    element.style.position = "fixed";
    document.body.appendChild(element);
    const start = { left: 0, top: 0 };
    const end = { x: 100, y: 100 };

    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => {
        cb(performance.now() + 1000);
        return 1;
      });

    await new Promise((resolve) => {
      flyToCart.animateFly(element, start, end, () => {
        expect(element.style.left).toBe("100px");
        expect(element.style.top).toBe("100px");
        expect(element.style.transform).toContain("scale");
        rafSpy.mockRestore();
        resolve();
      });
    });
    vi.runAllTimers();
  });

  it("fly should handle missing cart badge element", () => {
    document.body.innerHTML = ""; // remove badge
    const img = document.createElement("img");
    img.src = "test.jpg";
    const callback = vi.fn();
    flyToCart.fly(img, callback);
    expect(callback).toHaveBeenCalled();
  });

  it("createFlyElement should set size to 120px if sourceRect dimensions are small", () => {
    const rect = { left: 0, top: 0, width: 10, height: 10 };
    const el = flyToCart.createFlyElement("test.jpg", rect);
    expect(el.style.width).toBe("120px");
    expect(el.style.height).toBe("120px");
  });
});
