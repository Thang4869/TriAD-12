import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initHeaderScroll } from "../../../../src/app/HeaderService.js";

describe("HeaderService", () => {
  beforeEach(() => {
    document.body.innerHTML = `<header id="main-header" class=""></header>`;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should add shrink class on scroll", () => {
    initHeaderScroll();
    const header = document.getElementById("main-header");
    expect(header.classList.contains("header-shrink")).toBe(false);

    Object.defineProperty(window, "pageYOffset", {
      value: 100,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event("scroll"));
    vi.runAllTimers();
    expect(header.classList.contains("header-shrink")).toBe(true);
  });

  it("should warn if header not found", () => {
    document.body.innerHTML = "";
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    initHeaderScroll();
    expect(consoleWarn).toHaveBeenCalledWith("[WARN]", "Header not found!");
  });
});
