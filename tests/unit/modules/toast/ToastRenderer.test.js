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
  });

  it("should create toast element", () => {
    const toastData = { title: "Test", message: "Hello", type: "info" };
    const element = renderer.createElement(toastData);
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.querySelector(".title").textContent).toBe("Test");
    expect(element.querySelector(".message").textContent).toBe("Hello");
    expect(element.classList.contains("toast-info")).toBe(true);
  });

  it("should render toast and append to container", () => {
    const toastData = { title: "Test", message: "Hello", type: "success" };
    renderer.render(toastData);
    const container = document.getElementById("toast-container");
    expect(container.children.length).toBe(1);
    const toast = container.querySelector(".toast-success");
    expect(toast).toBeTruthy();
  });

  it("should remove toast", () => {
    const toastData = { title: "Test", message: "Hello" };
    const element = renderer.render(toastData);
    renderer.remove(element);

    vi.runAllTimers();

    const container = document.getElementById("toast-container");
    expect(container.children.length).toBe(0);
  });
});

describe("ToastRenderer additional", () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = "";
    renderer = new ToastRenderer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should create container if missing", () => {
    expect(document.getElementById("toast-container")).toBeTruthy();
  });

  it("should find duplicate toast", () => {
    const data = { title: "Duplicate", message: "Same", type: "info" };
    const el1 = renderer.render(data);
    const el2 = renderer.render(data);
    expect(el2).toBe(el1);
    expect(renderer.toasts.length).toBe(1);
  });

  it("should reset timer of element", () => {
    const el = renderer.render({
      title: "Test",
      message: "Msg",
      duration: 2000,
    });
    const progress = el.querySelector(".progress-bar");
    expect(progress).toBeTruthy();

    const styleSetSpy = vi.spyOn(progress.style, "animation", "set");

    renderer.resetTimer(el);

    expect(styleSetSpy).toHaveBeenCalledWith("none");
    expect(progress.style.animation).toContain("progress 2000ms");
  });

  it("should remove element from DOM and toasts array", () => {
    const el = renderer.render({ title: "Test", message: "Msg" });
    renderer.remove(el);

    vi.runAllTimers();

    expect(el.parentNode).toBeNull();
    expect(renderer.toasts).not.toContain(el);
  });

  it("should remove oldest when exceeds maxToasts", () => {
    const max = renderer.maxToasts;
    const toasts = [];
    for (let i = 0; i < max + 1; i++) {
      const el = renderer.render({ title: `Title ${i}`, message: `Msg ${i}` });
      toasts.push(el);
    }

    vi.runAllTimers();

    expect(renderer.toasts.length).toBe(max);
    expect(renderer.toasts[0]).toBe(toasts[1]);
    expect(document.getElementById("toast-container").children.length).toBe(
      max,
    );
  });
});
