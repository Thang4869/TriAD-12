import { describe, it, expect, beforeEach } from "vitest";
import { NotificationRenderer } from "../../../../src/modules/notification/NotificationRenderer.js";

describe("NotificationRenderer", () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="notification-list"></div>
      <span id="notification-badge"></span>
      <span id="mobile-notification-badge"></span>
      <div id="notification-dropdown" class="hidden"></div>
      <div id="notification-overlay" class="hidden"></div>
    `;
    renderer = new NotificationRenderer();
  });

  it("should render list", () => {
    const notifications = [
      {
        id: 1,
        title: "Test",
        message: "Hello",
        type: "info",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
    renderer.renderList(notifications);
    const container = document.getElementById("notification-list");
    expect(container.innerHTML).toContain("Test");
    expect(container.innerHTML).toContain("Hello");
  });

  it("should render empty state", () => {
    renderer.renderList([]);
    const container = document.getElementById("notification-list");
    expect(container.innerHTML).toContain("All caught up!");
  });

  it("should update badge", () => {
    renderer.updateBadge(5);
    const badge = document.getElementById("notification-badge");
    expect(badge.textContent).toBe("5");
    expect(badge.classList.contains("hidden")).toBe(false);

    renderer.updateBadge(0);
    expect(badge.classList.contains("hidden")).toBe(true);
  });

  it("should show/hide dropdown", () => {
    renderer.showDropdown();
    const dropdown = document.getElementById("notification-dropdown");
    expect(dropdown.classList.contains("hidden")).toBe(false);
    const overlay = document.getElementById("notification-overlay");
    expect(overlay.classList.contains("hidden")).toBe(false);

    renderer.hideDropdown();
    expect(dropdown.classList.contains("hidden")).toBe(true);
    expect(overlay.classList.contains("hidden")).toBe(true);
  });

  it("should format time", () => {
    const now = new Date();
    const result = renderer.formatTime(now.toISOString());
    expect(result).toBe("Just now");

    const past = new Date(now - 5 * 60 * 1000);
    expect(renderer.formatTime(past.toISOString())).toBe("5m ago");
  });
});

describe("NotificationRenderer - additional coverage", () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="notification-list"></div>
      <span id="notification-badge"></span>
      <span id="mobile-notification-badge"></span>
      <div id="notification-dropdown" class="hidden"></div>
      <div id="notification-overlay" class="hidden"></div>
    `;
    renderer = new NotificationRenderer();
  });

  it("_ensureElements should fallback when elements are missing", () => {
    document.body.innerHTML = "";
    const renderer2 = new NotificationRenderer();
    expect(renderer2.container).toBeNull();
    expect(renderer2.badge).toBeNull();
    expect(renderer2.dropdown).toBeNull();
    expect(renderer2.overlay).toBeNull();

    expect(() => renderer2.updateBadge(5)).not.toThrow();
    expect(() => renderer2.showDropdown()).not.toThrow();
  });

  it("getIconHtml should return correct HTML for each type", () => {
    expect(renderer.getIconHtml("info")).toContain("ph-info");
    expect(renderer.getIconHtml("success")).toContain("ph-check-circle");
    expect(renderer.getIconHtml("warning")).toContain("ph-warning");
    expect(renderer.getIconHtml("promotion")).toContain("ph-fire");
    expect(renderer.getIconHtml("order")).toContain("ph-package");
    expect(renderer.getIconHtml("unknown")).toContain("ph-info");
  });

  it("formatTime should return correct strings for different time differences", () => {
    const now = new Date();
    const justNow = new Date(now);
    expect(renderer.formatTime(justNow.toISOString())).toBe("Just now");

    const fiveMinAgo = new Date(now - 5 * 60 * 1000);
    expect(renderer.formatTime(fiveMinAgo.toISOString())).toBe("5m ago");

    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
    expect(renderer.formatTime(twoHoursAgo.toISOString())).toBe("2h ago");

    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
    expect(renderer.formatTime(threeDaysAgo.toISOString())).toBe("3d ago");

    const twoMonthsAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const result = renderer.formatTime(twoMonthsAgo.toISOString());
    expect(result).not.toMatch(/ago/);
  });

  it("updateBadge should display 99+ when count exceeds 99", () => {
    renderer.updateBadge(100);
    const badge = document.getElementById("notification-badge");
    expect(badge.textContent).toBe("99+");
    expect(badge.classList.contains("hidden")).toBe(false);

    renderer.updateBadge(50);
    expect(badge.textContent).toBe("50");

    renderer.updateBadge(0);
    expect(badge.classList.contains("hidden")).toBe(true);
  });

  it("showDropdown should position dropdown correctly based on button", () => {
    document.body.innerHTML += `<button id="notification-btn" style="position:fixed;top:10px;right:20px;"></button>`;
    const btn = document.getElementById("notification-btn");
    const rect = {
      bottom: 60,
      right: 100,
      left: 50,
      top: 10,
      width: 30,
      height: 30,
    };
    vi.spyOn(btn, "getBoundingClientRect").mockReturnValue(rect);
    renderer.showDropdown();
    const dropdown = document.getElementById("notification-dropdown");
    expect(dropdown.style.top).toBe("68px");
    const expectedRight = window.innerWidth - rect.right + "px";
    expect(dropdown.style.right).toBe(expectedRight);
  });
});
