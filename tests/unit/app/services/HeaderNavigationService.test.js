import { describe, it, expect, vi, beforeEach } from "vitest";
import { initHeaderNavigation } from "../../../../src/app/HeaderNavigationService.js";

describe("HeaderNavigationService", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav>
        <a href="./">Home</a>
        <a href="about.html">About</a>
        <a href="products.html">Products</a>
      </nav>
      <div id="mobile-menu">
        <a href="./">Home</a>
        <a href="about.html">About</a>
        <a href="products.html">Products</a>
      </div>
    `;
  });

  it("should add active class to current page link", () => {
    initHeaderNavigation("about");
    const links = document.querySelectorAll("nav a");
    expect(links[1].classList.contains("active")).toBe(true);
    expect(links[0].classList.contains("active")).toBe(false);
  });

  it("should warn if no links", () => {
    document.body.innerHTML = "";
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    initHeaderNavigation("home");
    expect(consoleWarn).toHaveBeenCalled();
  });
});
