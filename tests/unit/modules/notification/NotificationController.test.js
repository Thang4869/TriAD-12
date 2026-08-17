import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotificationController } from "../../../../src/modules/notification/NotificationController.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

vi.mock("../../../../src/core/services/EventBus.js", () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));

describe("NotificationController", () => {
  let controller;
  let mockToast;

  const setupDOM = (withButtons = true) => {
    document.body.innerHTML = `
      ${withButtons ? '<button id="notification-btn"></button>' : ''}
      ${withButtons ? '<button id="mobile-notification-btn"></button>' : ''}
      <div id="notification-overlay"></div>
      <div id="notification-dropdown" class="hidden"></div>
      <div id="notification-list"></div>
      <span id="notification-badge"></span>
      <span id="mobile-notification-badge"></span>
      <button id="mark-all-read"></button>
    `;
  };

  beforeEach(() => {
    global.localStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    };

    mockToast = {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    };
    window.toast = mockToast;

    vi.useFakeTimers();
    setupDOM(true);
    vi.mocked(eventBus.on).mockClear();
    vi.mocked(eventBus.emit).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete window.toast;
    document.body.innerHTML = "";
    if (controller?.destroy) controller.destroy();
  });

  describe("initialization", () => {
    it("should initialize when document is ready", () => {
      Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
      controller = new NotificationController();
      expect(controller._initialized).toBe(true);
    });

    it("should initialize via DOMContentLoaded when document is loading", () => {
      Object.defineProperty(document, "readyState", { value: "loading", configurable: true });
      const spy = vi.spyOn(document, "addEventListener");
      controller = new NotificationController();
      const handler = spy.mock.calls.find(c => c[0] === "DOMContentLoaded")[1];
      handler();
      expect(controller._initialized).toBe(true);
      Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
    });

    it("should not re-init if already initialized", () => {
      controller = new NotificationController();
      const spy = vi.spyOn(controller, "_setupEventListeners");
      controller._init();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("_setupEventListeners", () => {
    beforeEach(() => {
      controller = new NotificationController();
      controller._listenersAttached = false;
      controller._documentEventsAttached = false;
      vi.clearAllMocks();
    });

    it("should retry finding buttons when both are missing", () => {
      setupDOM(false);
      controller = new NotificationController();
      controller._listenersAttached = false;
      controller._retryCount = 0;
      const spy = vi.spyOn(global, "setTimeout");
      controller._setupEventListeners();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(controller._retryCount).toBe(1);
    });

    it("should attach click event to notification-btn", () => {
      const btn = document.getElementById("notification-btn");
      const spy = vi.spyOn(btn, "addEventListener");
      controller._setupEventListeners();
      expect(spy).toHaveBeenCalledWith("click", expect.any(Function));
    });

    it("should attach click event to mobile-notification-btn", () => {
      const btn = document.getElementById("mobile-notification-btn");
      const spy = vi.spyOn(btn, "addEventListener");
      controller._setupEventListeners();
      expect(spy).toHaveBeenCalledWith("click", expect.any(Function));
    });

    it("should attach click event to overlay", () => {
      const overlay = document.getElementById("notification-overlay");
      const spy = vi.spyOn(overlay, "addEventListener");
      controller._setupEventListeners();
      expect(spy).toHaveBeenCalledWith("click", expect.any(Function));
    });

    it("should attach click event to mark-all-read button", () => {
      const btn = document.getElementById("mark-all-read");
      const spy = vi.spyOn(btn, "addEventListener");
      controller._setupEventListeners();
      expect(spy).toHaveBeenCalledWith("click", expect.any(Function));
    });

    it("should handle click on mark-all-read and call markAllAsRead", () => {
      const btn = document.getElementById("mark-all-read");
      const spy = vi.spyOn(controller, "markAllAsRead");
      controller._setupEventListeners();
      btn.dispatchEvent(new Event("click", { bubbles: true }));
      expect(spy).toHaveBeenCalled();
    });

    it("should attach keydown event for Escape key", () => {
      const spy = vi.spyOn(document, "addEventListener");
      controller._setupEventListeners();
      expect(spy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });

    it("should close dropdown on Escape when open", () => {
      controller._isOpen = true;
      const spy = vi.spyOn(controller, "_closeDropdown");
      controller._setupEventListeners();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(spy).toHaveBeenCalled();
    });

    it("should not close dropdown on Escape when not open", () => {
      controller._isOpen = false;
      const spy = vi.spyOn(controller, "_closeDropdown");
      controller._setupEventListeners();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(spy).not.toHaveBeenCalled();
    });

    it("should close dropdown when clicking outside", () => {
      controller._isOpen = true;
      const spy = vi.spyOn(controller, "_closeDropdown");
      controller._setupEventListeners();
      const dropdown = document.getElementById("notification-dropdown");
      dropdown.contains = vi.fn(() => false);
      document.body.dispatchEvent(new Event("click", { bubbles: true }));
      expect(spy).toHaveBeenCalled();
    });

    it("should not close dropdown when clicking inside dropdown", () => {
      controller._isOpen = true;
      const spy = vi.spyOn(controller, "_closeDropdown");
      controller._setupEventListeners();
      const dropdown = document.getElementById("notification-dropdown");
      dropdown.contains = vi.fn(() => true);
      dropdown.dispatchEvent(new Event("click", { bubbles: true }));
      expect(spy).not.toHaveBeenCalled();
    });

    it("should mark notification as read when clicking .notification-item", () => {
      const item = document.createElement("div");
      item.className = "notification-item";
      item.dataset.id = "123";
      document.body.appendChild(item);
      const spy = vi.spyOn(controller, "markAsRead");
      controller._setupEventListeners();
      item.dispatchEvent(new Event("click", { bubbles: true }));
      expect(spy).toHaveBeenCalledWith(123);
    });

    it("should not mark if item has no id", () => {
      const item = document.createElement("div");
      item.className = "notification-item";
      document.body.appendChild(item);
      const spy = vi.spyOn(controller, "markAsRead");
      controller._setupEventListeners();
      item.dispatchEvent(new Event("click", { bubbles: true }));
      expect(spy).not.toHaveBeenCalled();
    });

    it("should subscribe to CHECKOUT_COMPLETED when window.eventBus exists", () => {
      window.eventBus = { on: vi.fn() };
      controller._setupEventListeners();
      expect(eventBus.on).toHaveBeenCalledWith(EVENTS.CHECKOUT_COMPLETED, expect.any(Function));
      delete window.eventBus;
    });

    it("should not subscribe if window.eventBus is undefined", () => {
      delete window.eventBus;
      controller._setupEventListeners();
      expect(eventBus.on).not.toHaveBeenCalled();
    });

    it("should add system error on window error with message", () => {
      const spy = vi.spyOn(controller, "add");
      controller._setupEventListeners();
      window.dispatchEvent(new ErrorEvent("error", { error: new Error("Test") }));
      expect(spy).toHaveBeenCalledWith("System Error", "An unexpected error occurred.", "warning");
    });

    it("should not add system error if error has no message", () => {
      const spy = vi.spyOn(controller, "add");
      controller._setupEventListeners();
      window.dispatchEvent(new ErrorEvent("error", { error: {} }));
      expect(spy).not.toHaveBeenCalled();
    });

    it("should not attach duplicate document events", () => {
      const before = document.addEventListener.mock?.calls?.length || 0;
      controller._listenersAttached = false;
      controller._documentEventsAttached = true;
      controller._setupEventListeners();
      const after = document.addEventListener.mock?.calls?.length || 0;
      expect(after).toBe(before);
    });
  });

  describe("dropdown", () => {
    beforeEach(() => { controller = new NotificationController(); });

    it("should open dropdown via _toggleDropdown", () => {
      const show = vi.spyOn(controller.renderer, "showDropdown");
      const render = vi.spyOn(controller.renderer, "renderList");
      controller._toggleDropdown();
      expect(controller._isOpen).toBe(true);
      expect(show).toHaveBeenCalled();
      expect(render).toHaveBeenCalledWith(controller.service.getAll());
    });

    it("should close dropdown via _toggleDropdown when already open", () => {
      controller._isOpen = true;
      const spy = vi.spyOn(controller.renderer, "hideDropdown");
      controller._toggleDropdown();
      expect(controller._isOpen).toBe(false);
      expect(spy).toHaveBeenCalled();
    });

    it("should close dropdown via _closeDropdown", () => {
      controller._isOpen = true;
      const spy = vi.spyOn(controller.renderer, "hideDropdown");
      controller._closeDropdown();
      expect(controller._isOpen).toBe(false);
      expect(spy).toHaveBeenCalled();
    });

    it("should handle _toggleDropdown with undefined event", () => {
      const spy = vi.spyOn(controller.renderer, "showDropdown");
      controller._toggleDropdown(undefined);
      expect(controller._isOpen).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it("should stop propagation if event provided", () => {
      const event = { stopPropagation: vi.fn() };
      controller._toggleDropdown(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe("public methods", () => {
    beforeEach(() => {
      controller = new NotificationController();
      controller._isOpen = false;
    });

    describe("add", () => {
      it("should add notification and update UI", () => {
        const spy = vi.spyOn(controller, "_updateUI");
        const notif = controller.add("Test", "Message", "info");
        expect(notif.title).toBe("Test");
        expect(spy).toHaveBeenCalled();
        expect(controller.service.getUnreadCount()).toBeGreaterThan(0);
      });

      it("should render list if dropdown is open", () => {
        controller._isOpen = true;
        const spy = vi.spyOn(controller.renderer, "renderList");
        controller.add("Test", "Msg");
        expect(spy).toHaveBeenCalledWith(controller.service.getAll());
      });

      it("should not render list if dropdown is closed", () => {
        controller._isOpen = false;
        const spy = vi.spyOn(controller.renderer, "renderList");
        controller.add("Test", "Msg");
        expect(spy).not.toHaveBeenCalled();
      });

      it("should call toast if window.toast exists", () => {
        controller.add("Test", "Msg", "success");
        expect(mockToast.success).toHaveBeenCalledWith("Test", "Msg");
      });

      it("should map unknown type to info", () => {
        controller.add("Test", "Msg", "unknown");
        expect(mockToast.info).toHaveBeenCalledWith("Test", "Msg");
      });

      it("should not call toast if window.toast is undefined", () => {
        delete window.toast;
        expect(() => controller.add("Test", "Msg")).not.toThrow();
      });

      it("should animate bell button if exists", () => {
        const btn = document.getElementById("notification-btn");
        btn.style.animation = "";
        controller.add("Test", "Msg");
        expect(btn.style.animation).toContain("bellRing");
        vi.advanceTimersByTime(600);
        expect(btn.style.animation).toBe("");
      });

      it("should not fail if notification-btn is missing", () => {
        document.getElementById("notification-btn")?.remove();
        expect(() => controller.add("Test", "Msg")).not.toThrow();
      });
    });

    describe("markAsRead", () => {
      it("should mark notification as read and update UI", () => {
        controller.markAllAsRead();

        const notif = controller.add("Test", "Msg");
        const updateSpy = vi.spyOn(controller, "_updateUI");
        const renderSpy = vi.spyOn(controller.renderer, "renderList");

        const result = controller.markAsRead(notif.id);
        expect(result).toBe(true);
        expect(updateSpy).toHaveBeenCalled();
        expect(renderSpy).not.toHaveBeenCalled();
        expect(controller.service.getUnreadCount()).toBe(0);
      });

      it("should render list if dropdown is open", () => {
        controller._isOpen = true;
        controller.markAllAsRead();
        const notif = controller.add("Test", "Msg");
        const spy = vi.spyOn(controller.renderer, "renderList");
        controller.markAsRead(notif.id);
        expect(spy).toHaveBeenCalled();
      });

      it("should return false and not update if id not found", () => {
        const spy = vi.spyOn(controller, "_updateUI");
        const result = controller.markAsRead(99999);
        expect(result).toBe(false);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe("markAllAsRead", () => {
      it("should mark all as read and update UI", () => {
        controller.add("A", "1");
        controller.add("B", "2");
        const updateSpy = vi.spyOn(controller, "_updateUI");
        const renderSpy = vi.spyOn(controller.renderer, "renderList");
        const changed = controller.markAllAsRead();
        expect(changed).toBe(true);
        expect(updateSpy).toHaveBeenCalled();
        expect(renderSpy).not.toHaveBeenCalled();
        expect(controller.service.getUnreadCount()).toBe(0);
      });

      it("should render list if dropdown is open", () => {
        controller._isOpen = true;
        controller.add("A", "1");
        const spy = vi.spyOn(controller.renderer, "renderList");
        controller.markAllAsRead();
        expect(spy).toHaveBeenCalled();
      });

      it("should show toast if window.toast exists", () => {
        controller.add("A", "1");
        controller.markAllAsRead();
        expect(mockToast.success).toHaveBeenCalledWith("All clear!", "All notifications marked as read.");
      });

      it("should not show toast if window.toast undefined", () => {
        delete window.toast;
        controller.add("A", "1");
        expect(() => controller.markAllAsRead()).not.toThrow();
      });

      it("should return false if no unread notifications", () => {
        controller.markAllAsRead();
        const changed = controller.markAllAsRead();
        expect(changed).toBe(false);
        const spy = vi.spyOn(controller, "_updateUI");
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe("_exposeAPI", () => {
    it("should expose window.notifications with all methods", () => {
      controller = new NotificationController();
      expect(window.notifications).toBeDefined();
      expect(typeof window.notifications.add).toBe("function");
      expect(typeof window.notifications.markAsRead).toBe("function");
      expect(typeof window.notifications.markAllAsRead).toBe("function");
      expect(typeof window.notifications.getUnread).toBe("function");
      expect(typeof window.notifications.getAll).toBe("function");
      expect(typeof window.notifications.getCount).toBe("function");
    });

    it("should proxy methods correctly", () => {
      controller = new NotificationController();
      const addSpy = vi.spyOn(controller, "add");
      const markSpy = vi.spyOn(controller, "markAsRead");
      const markAllSpy = vi.spyOn(controller, "markAllAsRead");

      window.notifications.add("Title", "Msg", "info");
      expect(addSpy).toHaveBeenCalledWith("Title", "Msg", "info");

      window.notifications.markAsRead(1);
      expect(markSpy).toHaveBeenCalledWith(1);

      window.notifications.markAllAsRead();
      expect(markAllSpy).toHaveBeenCalled();
    });
  });

  describe("destroy and reinit", () => {
    beforeEach(() => { controller = new NotificationController(); });

    it("destroy should clear timer and reset flags", () => {
      controller._retryTimer = setTimeout(() => {}, 1000);
      controller.destroy();
      expect(controller._retryTimer).toBeNull();
      expect(controller._listenersAttached).toBe(false);
      expect(controller._documentEventsAttached).toBe(false);
      expect(controller._initialized).toBe(false);
    });

    it("destroy should handle null timer", () => {
      controller._retryTimer = null;
      expect(() => controller.destroy()).not.toThrow();
    });

    it("reinit should call _setupEventListeners if listeners not attached", () => {
      controller._listenersAttached = false;
      const spy = vi.spyOn(controller, "_setupEventListeners");
      controller.reinit();
      expect(spy).toHaveBeenCalled();
    });

    it("reinit should call _updateUI if listeners already attached", () => {
      controller._listenersAttached = true;
      const spy = vi.spyOn(controller, "_updateUI");
      controller.reinit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("_updateUI", () => {
    it("should update badge with unread count", () => {
      controller = new NotificationController();
      const spy = vi.spyOn(controller.renderer, "updateBadge");
      controller._updateUI();
      expect(spy).toHaveBeenCalledWith(controller.service.getUnreadCount());
    });
  });
});