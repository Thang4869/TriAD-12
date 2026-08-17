import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BlogController } from "../../../../src/modules/blog/BlogController.js";
import { Logger } from "../../../../src/core/services/Logger.js";

vi.mock("../../../../src/core/services/Logger.js", () => ({
  Logger: {
    debug: vi.fn(),
  },
}));

describe("BlogController", () => {
  let originalLocationHref;

  beforeEach(() => {
    originalLocationHref = window.location.href;
    // Mock window.location.href
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: originalLocationHref },
      writable: true,
    });
    vi.clearAllMocks();
    vi.spyOn(document, "addEventListener");
  });

  afterEach(() => {
    window.location.href = originalLocationHref;
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  describe("constructor", () => {
    it("should log debug message and attach click listener", () => {
      new BlogController();
      expect(Logger.debug).toHaveBeenCalledWith("Blog Controller initialized");
      expect(document.addEventListener).toHaveBeenCalledWith(
        "click",
        expect.any(Function)
      );
    });
  });

  describe("click event handler", () => {
    let controller;

    beforeEach(() => {
      controller = new BlogController();
    });

    it("should not redirect when clicked element is not .blog-card", () => {
      const div = document.createElement("div");
      div.className = "not-blog";
      document.body.appendChild(div);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
      div.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(window.location.href).toBe(originalLocationHref);
    });

    it("should redirect when clicked element is .blog-card", () => {
      const card = document.createElement("div");
      card.className = "blog-card";
      card.dataset.blogId = "789";
      document.body.appendChild(card);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
      card.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(window.location.href).toBe("blog-detail.html?id=789");
    });

    it("should redirect when clicked child of .blog-card (delegation works)", () => {
      const card = document.createElement("div");
      card.className = "blog-card";
      card.dataset.blogId = "101";
      const child = document.createElement("span");
      child.textContent = "Click me";
      card.appendChild(child);
      document.body.appendChild(card);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
      child.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(window.location.href).toBe("blog-detail.html?id=101");
    });

    it("should handle missing data-blog-id (redirect with 'undefined')", () => {
      const card = document.createElement("div");
      card.className = "blog-card";
      // Không set dataset.blogId
      document.body.appendChild(card);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
      card.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(window.location.href).toBe("blog-detail.html?id=undefined");
    });
  });
});