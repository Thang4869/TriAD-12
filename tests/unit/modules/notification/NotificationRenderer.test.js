import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationRenderer } from "../../../../src/modules/notification/NotificationRenderer.js";

describe("NotificationRenderer", () => {
  let renderer;

  const setupDOM = (withElements = true) => {
    document.body.innerHTML = withElements
      ? `
        <div id="notification-list"></div>
        <span id="notification-badge"></span>
        <span id="mobile-notification-badge"></span>
        <div id="notification-dropdown" class="hidden"></div>
        <div id="notification-overlay" class="hidden"></div>
        <button id="notification-btn" style="position:fixed;top:10px;right:20px;"></button>
      `
      : "";
  };

  beforeEach(() => {
    setupDOM(true);
    renderer = new NotificationRenderer();
  });

  describe("renderList", () => {
    it("should render list of notifications", () => {
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

    it("should render empty state when no notifications", () => {
      renderer.renderList([]);
      const container = document.getElementById("notification-list");
      expect(container.innerHTML).toContain("All caught up!");
    });

    it("should sort unread notifications first", () => {
      const now = new Date().toISOString();
      const notifications = [
        { id: 1, title: "Read", message: "R", type: "info", read: true, createdAt: now },
        { id: 2, title: "Unread", message: "U", type: "info", read: false, createdAt: now },
      ];
      renderer.renderList(notifications);
      const container = document.getElementById("notification-list");
      const items = container.querySelectorAll(".notification-item");
      expect(items[0].textContent).toContain("Unread");
      expect(items[1].textContent).toContain("Read");
    });

    it("should not throw when container is missing", () => {
      document.getElementById("notification-list")?.remove();
      const renderer2 = new NotificationRenderer();
      expect(() => renderer2.renderList([])).not.toThrow();
    });
  });

  describe("getIconHtml", () => {
    it("should return correct icon for each type", () => {
      expect(renderer.getIconHtml("info")).toContain("ph-info");
      expect(renderer.getIconHtml("success")).toContain("ph-check-circle");
      expect(renderer.getIconHtml("warning")).toContain("ph-warning");
      expect(renderer.getIconHtml("promotion")).toContain("ph-fire");
      expect(renderer.getIconHtml("order")).toContain("ph-package");
      expect(renderer.getIconHtml("unknown")).toContain("ph-info");
    });
  });

  describe("formatTime", () => {
    it("should return 'Just now' for current time", () => {
      const now = new Date();
      expect(renderer.formatTime(now.toISOString())).toBe("Just now");
    });

    it("should return 'Xm ago' for minutes", () => {
      const past = new Date(Date.now() - 5 * 60 * 1000);
      expect(renderer.formatTime(past.toISOString())).toBe("5m ago");
    });

    it("should return 'Xh ago' for hours", () => {
      const past = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(renderer.formatTime(past.toISOString())).toBe("2h ago");
    });

    it("should return 'Xd ago' for days (less than 30)", () => {
      const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(renderer.formatTime(past.toISOString())).toBe("3d ago");
    });

    it("should return full date for dates older than 30 days", () => {
      const past = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
      const result = renderer.formatTime(past.toISOString());
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe("updateBadge", () => {
    it("should update badge with count", () => {
      renderer.updateBadge(5);
      const badge = document.getElementById("notification-badge");
      expect(badge.textContent).toBe("5");
      expect(badge.classList.contains("hidden")).toBe(false);

      renderer.updateBadge(0);
      expect(badge.classList.contains("hidden")).toBe(true);
    });

    it("should display 99+ when count > 99", () => {
      renderer.updateBadge(100);
      const badge = document.getElementById("notification-badge");
      expect(badge.textContent).toBe("99+");
    });

    it("should update mobile badge as well", () => {
      renderer.updateBadge(3);
      const mobileBadge = document.getElementById("mobile-notification-badge");
      expect(mobileBadge.textContent).toBe("3");
    });

    it("should not throw if badge elements are missing", () => {
      document.getElementById("notification-badge")?.remove();
      document.getElementById("mobile-notification-badge")?.remove();
      expect(() => renderer.updateBadge(5)).not.toThrow();
    });
  });

  describe("dropdown visibility", () => {
    it("should show dropdown and position it correctly", () => {
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
      expect(dropdown.classList.contains("hidden")).toBe(false);
      expect(dropdown.style.top).toBe("68px");
      expect(dropdown.style.right).toBe(`${window.innerWidth - rect.right}px`);
      const overlay = document.getElementById("notification-overlay");
      expect(overlay.classList.contains("hidden")).toBe(false);
    });

    it("should hide dropdown", () => {
      renderer.showDropdown();
      renderer.hideDropdown();
      const dropdown = document.getElementById("notification-dropdown");
      expect(dropdown.classList.contains("hidden")).toBe(true);
      const overlay = document.getElementById("notification-overlay");
      expect(overlay.classList.contains("hidden")).toBe(true);
    });

    it("should not throw when dropdown missing on show", () => {
      document.getElementById("notification-dropdown")?.remove();
      const renderer2 = new NotificationRenderer();
      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
      renderer2.showDropdown();
      expect(consoleWarn).toHaveBeenCalledWith("[WARN]", "Notification dropdown not found");
      consoleWarn.mockRestore();
    });

    it("should not throw when dropdown/overlay missing on hide", () => {
      document.getElementById("notification-dropdown")?.remove();
      document.getElementById("notification-overlay")?.remove();
      const renderer2 = new NotificationRenderer();
      expect(() => renderer2.hideDropdown()).not.toThrow();
    });

    it("isDropdownVisible should return true when dropdown is visible", () => {
      renderer.showDropdown();
      expect(renderer.isDropdownVisible()).toBe(true);
      renderer.hideDropdown();
      expect(renderer.isDropdownVisible()).toBe(false);
    });

    it("isDropdownVisible should return falsy when dropdown is missing", () => {
      document.getElementById("notification-dropdown")?.remove();
      const renderer2 = new NotificationRenderer();
      expect(renderer2.isDropdownVisible()).toBeFalsy();
    });
  });

  describe("_ensureElements", () => {
    it("should keep existing references when elements are missing", () => {
      const mockContainer = document.createElement("div");
      const mockBadge = document.createElement("span");
      const mockMobileBadge = document.createElement("span");
      const mockDropdown = document.createElement("div");
      const mockOverlay = document.createElement("div");

      renderer.container = mockContainer;
      renderer.badge = mockBadge;
      renderer.mobileBadge = mockMobileBadge;
      renderer.dropdown = mockDropdown;
      renderer.overlay = mockOverlay;

      document.body.innerHTML = "";

      renderer._ensureElements();

      expect(renderer.container).toBe(mockContainer);
      expect(renderer.badge).toBe(mockBadge);
      expect(renderer.mobileBadge).toBe(mockMobileBadge);
      expect(renderer.dropdown).toBe(mockDropdown);
      expect(renderer.overlay).toBe(mockOverlay);
    });

    it("should update references when elements exist", () => {
      renderer.container = document.createElement("div");
      renderer.badge = document.createElement("span");
      renderer.mobileBadge = document.createElement("span");
      renderer.dropdown = document.createElement("div");
      renderer.overlay = document.createElement("div");

      renderer._ensureElements();

      expect(renderer.container).toBe(document.getElementById("notification-list"));
      expect(renderer.badge).toBe(document.getElementById("notification-badge"));
      expect(renderer.mobileBadge).toBe(document.getElementById("mobile-notification-badge"));
      expect(renderer.dropdown).toBe(document.getElementById("notification-dropdown"));
      expect(renderer.overlay).toBe(document.getElementById("notification-overlay"));
    });
  });
});