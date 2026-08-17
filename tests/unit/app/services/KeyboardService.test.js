import { describe, it, expect, vi, beforeEach } from "vitest";
import { KeyboardService } from "../../../../src/app/services/KeyboardService.js";

describe("KeyboardService", () => {
  let mockCart, mockModal, mockCheckout;
  let keyboardService;

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="search-input">
      <div id="checkout-modal" class="hidden"></div>
      <div id="success-modal" class="hidden"></div>
    `;

    mockCart = {
      closeDrawer: vi.fn(),
      isDrawerOpen: true,
    };
    mockModal = {
      service: { isOpen: false },
      close: vi.fn(),
    };
    mockCheckout = {
      closeCheckout: vi.fn(),
      closeSuccess: vi.fn(),
    };

    keyboardService = new KeyboardService(mockCart, mockModal, mockCheckout);
  });

  describe("Escape key", () => {
    it("should close modal when modal is open", () => {
      mockModal.service.isOpen = true;
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(mockModal.close).toHaveBeenCalled();
      expect(mockCheckout.closeCheckout).not.toHaveBeenCalled();
      expect(mockCart.closeDrawer).not.toHaveBeenCalled();
    });

    it("should close checkout modal when modal closed and checkout visible", () => {
      document.getElementById("checkout-modal").classList.remove("hidden");
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(mockCheckout.closeCheckout).toHaveBeenCalled();
      expect(mockModal.close).not.toHaveBeenCalled();
      expect(mockCheckout.closeSuccess).not.toHaveBeenCalled();
      expect(mockCart.closeDrawer).not.toHaveBeenCalled();
    });

    it("should close success modal when modal and checkout closed, success visible", () => {
      document.getElementById("success-modal").classList.remove("hidden");
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(mockCheckout.closeSuccess).toHaveBeenCalled();
      expect(mockCheckout.closeCheckout).not.toHaveBeenCalled();
      expect(mockModal.close).not.toHaveBeenCalled();
      expect(mockCart.closeDrawer).not.toHaveBeenCalled();
    });

    it("should close cart drawer when all modals closed and drawer open", () => {
      mockCart.isDrawerOpen = true;
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(mockCart.closeDrawer).toHaveBeenCalled();
      expect(mockModal.close).not.toHaveBeenCalled();
      expect(mockCheckout.closeCheckout).not.toHaveBeenCalled();
      expect(mockCheckout.closeSuccess).not.toHaveBeenCalled();
    });

    it("should do nothing when no modal or drawer is open", () => {
      mockCart.isDrawerOpen = false;
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(mockModal.close).not.toHaveBeenCalled();
      expect(mockCheckout.closeCheckout).not.toHaveBeenCalled();
      expect(mockCheckout.closeSuccess).not.toHaveBeenCalled();
      expect(mockCart.closeDrawer).not.toHaveBeenCalled();
    });

    it("should handle missing checkout-modal element gracefully", () => {
      document.getElementById("checkout-modal").remove();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(mockCart.closeDrawer).toHaveBeenCalled();
      expect(mockCheckout.closeCheckout).not.toHaveBeenCalled();
    });

    it("should handle missing success-modal element gracefully", () => {
      document.getElementById("success-modal").remove();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(mockCart.closeDrawer).toHaveBeenCalled();
      expect(mockCheckout.closeSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Ctrl+K / Cmd+K shortcut", () => {
    it("should focus search input on Ctrl+K", () => {
      const search = document.getElementById("search-input");
      const focusSpy = vi.spyOn(search, "focus");
      const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
      document.dispatchEvent(event);
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should focus search input on Cmd+K (metaKey)", () => {
      const search = document.getElementById("search-input");
      const focusSpy = vi.spyOn(search, "focus");
      const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
      document.dispatchEvent(event);
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should prevent default on Ctrl+K", () => {
      const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      document.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should not throw error if search input is missing", () => {
      document.getElementById("search-input").remove();
      const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
      expect(() => document.dispatchEvent(event)).not.toThrow();
    });
  });

  describe("Other keys", () => {
    it("should ignore non-target keys", () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      expect(mockModal.close).not.toHaveBeenCalled();
      expect(mockCheckout.closeCheckout).not.toHaveBeenCalled();
      expect(mockCheckout.closeSuccess).not.toHaveBeenCalled();
      expect(mockCart.closeDrawer).not.toHaveBeenCalled();
    });
  });
});