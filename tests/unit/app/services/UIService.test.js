import { describe, it, expect, vi, beforeEach } from "vitest";
import { UIService } from "../../../../src/app/services/UIService.js";

describe("UIService", () => {
  let uiService;
  let mockCartController;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="mobile-menu-btn"></button>
      <div id="mobile-menu" class="hidden"></div>
      <div id="cart-overlay"></div>
      <button id="close-cart-btn"></button>
      <button id="cart-icon-btn"></button>
      <button id="mobile-cart-btn"></button>
      <div id="search-suggestion"></div>
      <div class="accordion-item"></div>
    `;
    mockCartController = {
      openDrawer: vi.fn(),
      closeDrawer: vi.fn(),
    };
    uiService = new UIService(mockCartController);
  });

  it("should initialize mobile menu", () => {
    const btn = document.getElementById("mobile-menu-btn");
    const menu = document.getElementById("mobile-menu");
    btn.click();
    expect(menu.classList.contains("hidden")).toBe(false);
    btn.click();
    expect(menu.classList.contains("hidden")).toBe(true);
  });

  it("should open cart drawer on icon click", () => {
    document.getElementById("cart-icon-btn").click();
    expect(mockCartController.openDrawer).toHaveBeenCalled();
    document.getElementById("mobile-cart-btn").click();
    expect(mockCartController.openDrawer).toHaveBeenCalledTimes(2);
  });

  it("should close cart drawer on close button or overlay", () => {
    document.getElementById("close-cart-btn").click();
    expect(mockCartController.closeDrawer).toHaveBeenCalled();
    document.getElementById("cart-overlay").click();
    expect(mockCartController.closeDrawer).toHaveBeenCalledTimes(2);
  });

  it("should hide search suggestion on outside click", () => {
    const suggestion = document.getElementById("search-suggestion");
    suggestion.classList.remove("hidden");
    document.body.click();
    expect(suggestion.classList.contains("hidden")).toBe(true);
  });
});
