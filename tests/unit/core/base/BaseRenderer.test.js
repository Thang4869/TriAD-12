import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BaseRenderer } from "../../../../src/core/base/BaseRenderer.js";

describe("BaseRenderer", () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `<div id="test-container"></div>`;
    renderer = new BaseRenderer("test-container");
  });

  it("should find container immediately", () => {
    expect(renderer.findContainer()).toBe(
      document.getElementById("test-container"),
    );
  });

  it("should retry finding container if not found initially", () => {
    document.body.innerHTML = "";
    const renderer2 = new BaseRenderer("test-container");
    vi.useFakeTimers();

    renderer2.findContainer();
    expect(renderer2.container).toBeNull();

    vi.advanceTimersByTime(100);
    expect(renderer2.container).toBeNull();

    document.body.innerHTML = `<div id="test-container"></div>`;
    renderer2.findContainer();
    vi.advanceTimersByTime(100);
    expect(renderer2.container).toBe(document.getElementById("test-container"));

    vi.useRealTimers();
  });

  it("should render data (no-op, should not change container)", () => {
    const data = "<div>Test</div>";
    expect(() => renderer.render(data)).not.toThrow();
    expect(renderer.container.innerHTML).toBe("");
  });

  it("should render empty state (no-op)", () => {
    expect(() => renderer.renderEmpty()).not.toThrow();
    expect(renderer.container.innerHTML).toBe("");
  });

  it("should update data (no-op, should not change container)", () => {
    renderer.render("old");
    expect(() => renderer.update("new")).not.toThrow();
    expect(renderer.container.innerHTML).toBe("");
  });

  it("should clear container", () => {
    renderer.container.innerHTML = "some content";
    renderer.clear();
    expect(renderer.container.innerHTML).toBe("");
  });
});
