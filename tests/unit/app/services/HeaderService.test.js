import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initHeaderScroll } from "../../../../src/app/HeaderService.js";

describe("HeaderService", () => {
  let header;
  let scrollListeners = [];
  let originalAddEventListener;
  let originalRemoveEventListener;

  beforeEach(() => {
    document.body.innerHTML = `<header id="main-header" class=""></header>`;
    header = document.getElementById("main-header");

    Object.defineProperty(window, "pageYOffset", {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, "scrollTop", {
      value: 0,
      writable: true,
      configurable: true,
    });

    vi.restoreAllMocks();
    scrollListeners = [];

    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;

    window.addEventListener = function (event, handler) {
      if (event === "scroll") {
        scrollListeners.push(handler);
      }
      return originalAddEventListener.call(this, event, handler);
    };

    window.removeEventListener = function (event, handler) {
      if (event === "scroll") {
        const index = scrollListeners.indexOf(handler);
        if (index !== -1) scrollListeners.splice(index, 1);
      }
      return originalRemoveEventListener.call(this, event, handler);
    };
  });

  afterEach(() => {
    scrollListeners.forEach((handler) => {
      window.removeEventListener("scroll", handler);
    });
    scrollListeners = [];

    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;

    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  describe("initHeaderScroll", () => {
    it("should warn and return if header not found", () => {
      document.body.innerHTML = "";
      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
      initHeaderScroll();
      expect(consoleWarn).toHaveBeenCalledWith("[WARN]", "Header not found!");
      consoleWarn.mockRestore();
    });

    it("should add header-shrink class when scroll > 60", () => {
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb();
        return 1;
      });

      initHeaderScroll();
      expect(header.classList.contains("header-shrink")).toBe(false);

      window.pageYOffset = 100;
      window.dispatchEvent(new Event("scroll"));
      expect(header.classList.contains("header-shrink")).toBe(true);
    });

    it("should not add header-shrink class when scroll <= 60", () => {
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb();
        return 1;
      });

      initHeaderScroll();
      expect(header.classList.contains("header-shrink")).toBe(false);

      window.pageYOffset = 50;
      window.dispatchEvent(new Event("scroll"));
      expect(header.classList.contains("header-shrink")).toBe(false);

      window.pageYOffset = 0;
      window.dispatchEvent(new Event("scroll"));
      expect(header.classList.contains("header-shrink")).toBe(false);
    });

    it("should fallback to document.documentElement.scrollTop when pageYOffset is 0", () => {
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb();
        return 1;
      });

      document.documentElement.scrollTop = 0;
      initHeaderScroll();
      expect(header.classList.contains("header-shrink")).toBe(false);

      document.documentElement.scrollTop = 100;
      window.dispatchEvent(new Event("scroll"));
      expect(header.classList.contains("header-shrink")).toBe(true);
    });

    it("should debounce scroll events using ticking flag", () => {
      let rafCallback = null;
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      });

      initHeaderScroll();

      window.dispatchEvent(new Event("scroll"));
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
      expect(rafCallback).toBeDefined();

      window.dispatchEvent(new Event("scroll"));
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

      rafCallback();

      window.dispatchEvent(new Event("scroll"));
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);
    });

    it("should call handleScroll immediately on init to set initial state", () => {
      window.pageYOffset = 100;
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb();
        return 1;
      });

      initHeaderScroll();
      expect(header.classList.contains("header-shrink")).toBe(true);
    });
  });
});