import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ToastRenderer } from "../../../../src/modules/toast/ToastRenderer.js";

describe("ToastRenderer", () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = '<div id="toast-container"></div>';
    renderer = new ToastRenderer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("getContainer", () => {
    it("should return existing container", () => {
      const container = renderer.getContainer();
      expect(container.id).toBe("toast-container");
    });

    it("should create container if missing", () => {
      document.body.innerHTML = "";
      const newRenderer = new ToastRenderer();
      const container = newRenderer.getContainer();
      expect(container.id).toBe("toast-container");
      expect(document.body.contains(container)).toBe(true);
    });
  });

  describe("createElement", () => {
    it("should use success icon when type is success", () => {
      const data = { title: "Test", message: "Msg", type: "success" };
      const el = renderer.createElement(data);
      expect(el.querySelector(".icon").className).toContain("ph-check-circle");
    });

    it("should use warning icon when type is warning", () => {
      const data = { title: "Test", message: "Msg", type: "warning" };
      const el = renderer.createElement(data);
      expect(el.querySelector(".icon").className).toContain("ph-warning");
    });

    it("should use error icon when type is error", () => {
      const data = { title: "Test", message: "Msg", type: "error" };
      const el = renderer.createElement(data);
      expect(el.querySelector(".icon").className).toContain("ph-x-circle");
    });

    it("should use info icon when type is info or invalid", () => {
      const data = { title: "Test", message: "Msg", type: "invalid" };
      const el = renderer.createElement(data);
      expect(el.querySelector(".icon").className).toContain("ph-info");
    });

    it("should use custom icon if provided", () => {
      const data = { title: "Test", message: "Msg", type: "info", icon: "ph-fill ph-star" };
      const el = renderer.createElement(data);
      expect(el.querySelector(".icon").className).toContain("ph-star");
    });

    it("should handle missing message", () => {
      const data = { title: "No Message" };
      const el = renderer.createElement(data);
      expect(el.querySelector(".message")).toBeNull();
    });
  });

  describe("render", () => {
    it("should render a new toast and add to container", () => {
      const data = { title: "New", message: "Toast" };
      const el = renderer.render(data);
      expect(renderer.toasts).toContain(el);
      expect(document.getElementById("toast-container").children.length).toBe(1);
    });

    it("should return existing duplicate toast without creating new", () => {
      const data = { title: "Duplicate", message: "Same" };
      const el1 = renderer.render(data);
      const el2 = renderer.render(data);
      expect(el2).toBe(el1);
      expect(renderer.toasts.length).toBe(1);
    });

    it("should remove oldest when exceeding maxToasts", () => {
      const max = renderer.maxToasts;
      const toasts = [];
      for (let i = 0; i < max + 1; i++) {
        const el = renderer.render({ title: `Title ${i}`, message: `Msg ${i}` });
        toasts.push(el);
      }
      expect(renderer.toasts.length).toBe(max);
      expect(renderer.toasts[0]).toBe(toasts[1]);
      vi.runAllTimers();
      expect(toasts[0].parentNode).toBeNull();
    });
  });

  describe("findDuplicate", () => {
    it("should find duplicate by title and message", () => {
      const data = { title: "Dup", message: "Msg" };
      renderer.render(data);
      const dup = renderer.findDuplicate(data);
      expect(dup).toBeTruthy();
      expect(dup.querySelector(".title").textContent).toBe("Dup");
      expect(dup.querySelector(".message").textContent).toBe("Msg");
    });

    it("should return undefined if no duplicate", () => {
      const data = { title: "Unique", message: "Msg" };
      const dup = renderer.findDuplicate(data);
      expect(dup).toBeUndefined();
    });

    it("should handle null querySelector results gracefully during duplicate check", () => {
      const plainDiv = document.createElement("div");
      renderer.toasts.push(plainDiv);
      const dup = renderer.findDuplicate({ title: "Any", message: "Any" });
      expect(dup).toBeUndefined();
    });
  });

  describe("remove", () => {
    it("should do nothing if element is null or has no parent", () => {
      const el = document.createElement("div");
      renderer.remove(el);
      expect(el.parentNode).toBeNull();
      expect(renderer.toasts.length).toBe(0);
    });

    it("should remove element from DOM and toasts array after animation", () => {
      const el = renderer.render({ title: "Test", message: "Msg" });
      renderer.remove(el);
      expect(el.classList.contains("toast-exit")).toBe(true);
      vi.runAllTimers();
      expect(el.parentNode).toBeNull();
      expect(renderer.toasts).not.toContain(el);
    });
  });

  describe("resetTimer", () => {
    it("should reset animation of progress bar", () => {
      const el = renderer.render({ title: "Test", message: "Msg", duration: 2000 });
      const progress = el.querySelector(".progress-bar");
      expect(progress).toBeTruthy();

      const styleSetSpy = vi.spyOn(progress.style, "animation", "set");
      renderer.resetTimer(el);
      expect(styleSetSpy).toHaveBeenCalledWith("none");
      expect(progress.style.animation).toContain("progress 2000ms");
    });

    it("should do nothing if progress bar is missing", () => {
      const el = document.createElement("div");
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      renderer.resetTimer(el);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe("Edge Cases & Coverage", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });

    describe("resetTimer()", () => {
      it("should handle missing progress bar gracefully without throwing errors", () => {
        const el = document.createElement("div");
        expect(el.querySelector(".progress-bar")).toBeNull();
        expect(() => renderer.resetTimer(el)).not.toThrow();
      });

      it("should use default duration of 3000ms if dataset.duration is missing or invalid", () => {
        const el = renderer.createElement({ title: "Test" });
        document.body.appendChild(el);
        el.dataset.duration = "invalid_duration_string";
        
        renderer.resetTimer(el);
        const progress = el.querySelector(".progress-bar");
        
        expect(progress.style.animation).toContain("3000ms");
      });
    });

    describe("remove()", () => {
      it("should return early if element is null or has no parentNode", () => {
        const el = document.createElement("div");
        expect(() => renderer.remove(null)).not.toThrow();
        expect(() => renderer.remove(el)).not.toThrow();
      });

      it("should clean up element completely after 300ms timeout", () => {
        const el = renderer.render({ title: "Test" });
        
        renderer.remove(el);
        expect(el.classList.contains("toast-exit")).toBe(true);

        vi.advanceTimersByTime(300);

        expect(el.parentNode).toBeNull();
        expect(renderer.toasts).not.toContain(el);
      });

      it("should not throw if parentNode is removed before timeout resolves", () => {
        const el = renderer.render({ title: "Test" });
        
        renderer.remove(el);
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }

        expect(() => vi.advanceTimersByTime(300)).not.toThrow();
      });
    });

    describe("createElement()", () => {
      it("should fallback to info icon if type is unrecognized", () => {
        const el = renderer.createElement({ title: "Test", type: "unrecognized" });
        const iconElement = el.querySelector(".icon");
        expect(iconElement.className).toContain("ph-info");
      });
    });
  });
});