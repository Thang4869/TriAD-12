import { describe, it, expect, vi, beforeEach } from "vitest";
import { initHeaderNavigation } from "../../../../src/app/HeaderNavigationService.js";

describe("HeaderNavigationService", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav>
        <a href="./">Home</a>
        <a href="about.html">About</a>
        <a href="products.html">Products</a>
        <a>No Href</a>
        <a href="TriAD-12/contact.html">Contact</a>
      </nav>
      <div id="mobile-menu">
        <a href="./">Home</a>
        <a href="about.html">About</a>
        <a href="products.html">Products</a>
      </div>
    `;
    vi.restoreAllMocks();
  });

  describe("initHeaderNavigation", () => {
    it("should add active class to current page link", () => {
      initHeaderNavigation("about");
      const links = document.querySelectorAll("nav a");
      expect(links[1].classList.contains("active")).toBe(true);
      expect(links[0].classList.contains("active")).toBe(false);
    });

    it("should warn if no menu links found", () => {
      document.body.innerHTML = "";
      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
      initHeaderNavigation("home");
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("Header navigation links not found.")
      );
    });

    it("should return early when currentPage is not in PAGE_HREF_MAP", () => {
      const links = document.querySelectorAll("nav a");
      links.forEach((link) => link.classList.remove("active"));

      initHeaderNavigation("unknown-page");

      links.forEach((link) => {
        expect(link.classList.contains("active")).toBe(false);
      });
    });

    it("should correctly handle href with TriAD-12 prefix", () => {
      initHeaderNavigation("contact");
      const contactLink = document.querySelector('nav a[href="TriAD-12/contact.html"]');
      expect(contactLink.classList.contains("active")).toBe(true);
    });
  });

  describe("normalizePath (indirectly via initHeaderNavigation)", () => {
    it("should handle null/undefined href gracefully (no error, no active class)", () => {
      const noHrefLink = document.querySelector('nav a:not([href])');
      expect(noHrefLink).toBeTruthy();

      initHeaderNavigation("home");

      expect(noHrefLink.classList.contains("active")).toBe(false);

      expect(() => initHeaderNavigation("home")).not.toThrow();
    });

    it("should normalize path correctly and toggle active class", () => {
      initHeaderNavigation("about");
      const aboutLink = document.querySelector('nav a[href="about.html"]');
      expect(aboutLink.classList.contains("active")).toBe(true);

      const homeLink = document.querySelector('nav a[href="./"]');
      expect(homeLink.classList.contains("active")).toBe(false);
    });
  });
});