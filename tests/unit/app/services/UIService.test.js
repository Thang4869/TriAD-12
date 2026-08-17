import { describe, it, expect, vi, beforeEach } from "vitest";
import { UIService } from "../../../../src/app/services/UIService.js";

describe("UIService", () => {
  let mockCartController;
  let uiService;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    mockCartController = {
      openDrawer: vi.fn(),
      closeDrawer: vi.fn(),
    };
  });

  describe("constructor", () => {
    it("should initialize all sub-modules", () => {
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

      const spyMobile = vi.spyOn(UIService.prototype, "_initMobileMenu");
      const spyCart = vi.spyOn(UIService.prototype, "_initCartDrawer");
      const spySearch = vi.spyOn(UIService.prototype, "_initSearchSuggestion");
      const spyAccordion = vi.spyOn(UIService.prototype, "_initAccordion");

      uiService = new UIService(mockCartController);

      expect(spyMobile).toHaveBeenCalled();
      expect(spyCart).toHaveBeenCalled();
      expect(spySearch).toHaveBeenCalled();
      expect(spyAccordion).toHaveBeenCalled();
    });
  });

  describe("_initMobileMenu", () => {
    it("should toggle menu on button click", () => {
      document.body.innerHTML = `
        <button id="mobile-menu-btn"></button>
        <div id="mobile-menu" class="hidden"></div>
      `;

      uiService = new UIService(mockCartController);
      const btn = document.getElementById("mobile-menu-btn");
      const menu = document.getElementById("mobile-menu");

      btn.click();
      expect(menu.classList.contains("hidden")).toBe(false);
      expect(btn.innerHTML).toContain("ph-x");

      btn.click();
      expect(menu.classList.contains("hidden")).toBe(true);
      expect(btn.innerHTML).toContain("ph-list");
    });

    it("should close menu when a link inside is clicked", () => {
      document.body.innerHTML = `
        <button id="mobile-menu-btn"></button>
        <div id="mobile-menu" class="hidden">
          <a href="#">Link</a>
        </div>
      `;

      uiService = new UIService(mockCartController);
      const btn = document.getElementById("mobile-menu-btn");
      const menu = document.getElementById("mobile-menu");
      const link = menu.querySelector("a");

      btn.click();
      expect(menu.classList.contains("hidden")).toBe(false);

      link.click();
      expect(menu.classList.contains("hidden")).toBe(true);
      expect(btn.innerHTML).toContain("ph-list");
    });

    it("should do nothing if btn or menu is missing", () => {
      document.body.innerHTML = `<div>no elements</div>`;
      expect(() => new UIService(mockCartController)).not.toThrow();
    });
  });

  describe("_initCartDrawer", () => {
    it("should open drawer on cart icon click", () => {
      document.body.innerHTML = `
        <button id="cart-icon-btn"></button>
        <button id="mobile-cart-btn"></button>
      `;

      uiService = new UIService(mockCartController);
      document.getElementById("cart-icon-btn").click();
      expect(mockCartController.openDrawer).toHaveBeenCalledTimes(1);

      document.getElementById("mobile-cart-btn").click();
      expect(mockCartController.openDrawer).toHaveBeenCalledTimes(2);
    });

    it("should close drawer on close button or overlay click", () => {
      document.body.innerHTML = `
        <button id="close-cart-btn"></button>
        <div id="cart-overlay"></div>
      `;

      uiService = new UIService(mockCartController);
      document.getElementById("close-cart-btn").click();
      expect(mockCartController.closeDrawer).toHaveBeenCalledTimes(1);

      document.getElementById("cart-overlay").click();
      expect(mockCartController.closeDrawer).toHaveBeenCalledTimes(2);
    });

    it("should not call cartController if cartController is null", () => {
      document.body.innerHTML = `
        <button id="cart-icon-btn"></button>
      `;

      uiService = new UIService(null);
      document.getElementById("cart-icon-btn").click();
      expect(mockCartController.openDrawer).not.toHaveBeenCalled();
    });

    it("should do nothing if required elements are missing", () => {
      document.body.innerHTML = `<div>no elements</div>`;
      expect(() => new UIService(mockCartController)).not.toThrow();
    });
  });

  describe("_initSearchSuggestion", () => {
    it("should hide suggestion when clicking outside", () => {
      document.body.innerHTML = `
        <div id="search-suggestion" class="hidden"></div>
        <input id="search-input">
      `;

      uiService = new UIService(mockCartController);
      const suggestion = document.getElementById("search-suggestion");
      suggestion.classList.remove("hidden");

      document.body.click();
      expect(suggestion.classList.contains("hidden")).toBe(true);
    });

    it("should NOT hide suggestion when clicking inside search input", () => {
      document.body.innerHTML = `
        <div id="search-suggestion" class="hidden"></div>
        <input id="search-input">
      `;

      uiService = new UIService(mockCartController);
      const suggestion = document.getElementById("search-suggestion");
      suggestion.classList.remove("hidden");

      document.getElementById("search-input").click();
      expect(suggestion.classList.contains("hidden")).toBe(false);
    });

    it("should do nothing if suggestion element is missing", () => {
      document.body.innerHTML = `<input id="search-input">`;
      expect(() => new UIService(mockCartController)).not.toThrow();
    });
  });

  describe("_initAccordion", () => {
    it("should add active class to first accordion item", () => {
      document.body.innerHTML = `
        <div class="accordion-item"></div>
      `;

      uiService = new UIService(mockCartController);
      const item = document.querySelector(".accordion-item");
      expect(item.classList.contains("accordion-active")).toBe(true);
    });

    it("should do nothing if no accordion item exists", () => {
      document.body.innerHTML = `<div></div>`;
      expect(() => new UIService(mockCartController)).not.toThrow();
    });
  });
});