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
  });

  it("should show success toast", () => {
    const element = toastService.success("Success", "Operation completed");
    expect(element).toBeTruthy();
    expect(element.classList.contains("toast-success")).toBe(true);
  });

  it("should show error toast", () => {
    const element = toastService.error("Error", "Something went wrong");
    expect(element.classList.contains("toast-error")).toBe(true);
  });

  it("should show warning toast", () => {
    const element = toastService.warning("Warning", "Please check your input");
    expect(element.classList.contains("toast-warning")).toBe(true);
  });

  it("should show info toast", () => {
    const element = toastService.info("Info", "New update available");
    expect(element.classList.contains("toast-info")).toBe(true);
  });

  it("should clear all toasts", () => {
    toastService.info("Test 1", "Message 1");
    toastService.info("Test 2", "Message 2");

    const container = document.getElementById("toast-container");
    expect(container.children.length).toBe(2);

    toastService.clear();

    vi.runAllTimers();

    expect(container.children.length).toBe(0);
  });
});

describe("ToastService additional edge cases", () => {
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

  it("should pause timer on mouseenter and resume on mouseleave", () => {
    const element = toastService.info("Test", "Message");
    const progress = element.querySelector(".progress-bar");
    expect(progress.style.animationPlayState).toBe("");

    element.dispatchEvent(new Event("mouseenter"));
    expect(progress.style.animationPlayState).toBe("paused");

    element.dispatchEvent(new Event("mouseleave"));
    expect(progress.style.animationPlayState).toBe("running");
  });

  it("should remove toast on close button click", () => {
    const element = toastService.info("Test", "Message");
    const closeBtn = element.querySelector(".close-btn");
    const removeSpy = vi.spyOn(toastService.renderer, "remove");
    closeBtn.click();
    expect(removeSpy).toHaveBeenCalledWith(element);
  });

  it("should limit number of toasts to maxToasts", () => {
    const max = toastService.renderer.maxToasts;
    for (let i = 0; i < max + 2; i++) {
      toastService.info(`Title ${i}`, `Message ${i}`);
    }
    vi.advanceTimersByTime(300);
    const container = document.getElementById("toast-container");
    expect(container.children.length).toBe(max);
    expect(toastService.renderer.toasts.length).toBe(max);
  });

  it("should prevent duplicate toasts", () => {
    toastService.info("Duplicate", "Same");
    const firstCount =
      document.getElementById("toast-container").children.length;
    toastService.info("Duplicate", "Same");
    expect(document.getElementById("toast-container").children.length).toBe(
      firstCount,
    );
  });

  it("should clear all toasts", () => {
    toastService.info("A", "1");
    toastService.info("B", "2");
    toastService.clear();
    vi.runAllTimers();
    const container = document.getElementById("toast-container");
    expect(container.children.length).toBe(0);
  });

  it("should show with custom icon", () => {
    const element = toastService.show({
      title: "Custom",
      message: "Icon",
      type: "info",
      icon: "ph-fill ph-star",
    });
    const iconEl = element.querySelector(".icon");
    expect(iconEl.className).toContain("ph-star");
  });
});
