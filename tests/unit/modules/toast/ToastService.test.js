import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ToastService } from "../../../../src/modules/toast/ToastService.js";

describe("ToastService", () => {
  let toastService;

  beforeEach(() => {
    document.body.innerHTML = `<div id="toast-container"></div>`;
    toastService = new ToastService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("show", () => {
    it("should show a toast and set timer", () => {
      const el = toastService.show({ title: "Test", message: "Msg", duration: 1000 });
      expect(el._timer).toBeDefined();
      vi.advanceTimersByTime(1300);
      expect(el.parentNode).toBeNull();
    });

    it("should attach close button event to clear timer and remove", () => {
      const el = toastService.show({ title: "Test", message: "Msg" });
      const closeBtn = el.querySelector(".close-btn");
      const removeSpy = vi.spyOn(toastService.renderer, "remove");
      closeBtn.click();
      expect(removeSpy).toHaveBeenCalledWith(el);
    });

    it("should pause timer on mouseenter and resume on mouseleave", () => {
      const el = toastService.show({ title: "Test", message: "Msg", duration: 2000 });
      const progress = el.querySelector(".progress-bar");
      expect(progress.style.animationPlayState).toBe("");

      el.dispatchEvent(new Event("mouseenter"));
      expect(progress.style.animationPlayState).toBe("paused");

      el.dispatchEvent(new Event("mouseleave"));
      expect(progress.style.animationPlayState).toBe("running");
    });

    it("should set a new timer on mouseleave and remove after duration", () => {
      const el = toastService.show({ title: "Test", message: "Msg", duration: 1000 });
      const removeSpy = vi.spyOn(toastService.renderer, "remove");

      el.dispatchEvent(new Event("mouseleave"));

      vi.advanceTimersByTime(1300);
      expect(removeSpy).toHaveBeenCalledWith(el);
    });
  });

  describe("convenience methods", () => {
    it("should show success toast", () => {
      const el = toastService.success("Success", "Done");
      expect(el.classList.contains("toast-success")).toBe(true);
    });

    it("should show error toast", () => {
      const el = toastService.error("Error", "Fail");
      expect(el.classList.contains("toast-error")).toBe(true);
    });

    it("should show warning toast", () => {
      const el = toastService.warning("Warning", "Check");
      expect(el.classList.contains("toast-warning")).toBe(true);
    });

    it("should show info toast", () => {
      const el = toastService.info("Info", "Update");
      expect(el.classList.contains("toast-info")).toBe(true);
    });
  });

  describe("clear", () => {
    it("should remove all toasts", () => {
      toastService.info("A", "1");
      toastService.info("B", "2");
      expect(document.getElementById("toast-container").children.length).toBe(2);
      toastService.clear();
      vi.runAllTimers();
      expect(document.getElementById("toast-container").children.length).toBe(0);
    });
  });

  describe("duplicate prevention", () => {
    it("should not create duplicate toasts", () => {
      toastService.info("Duplicate", "Same");
      const firstCount = document.getElementById("toast-container").children.length;
      toastService.info("Duplicate", "Same");
      expect(document.getElementById("toast-container").children.length).toBe(firstCount);
    });
  });

  describe("custom icon", () => {
    it("should show toast with custom icon", () => {
      const el = toastService.show({
        title: "Custom",
        message: "Icon",
        type: "info",
        icon: "ph-fill ph-star",
      });
      const iconEl = el.querySelector(".icon");
      expect(iconEl.className).toContain("ph-star");
    });
  });
});