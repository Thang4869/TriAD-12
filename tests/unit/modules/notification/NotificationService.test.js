import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../../../../src/modules/notification/NotificationService.js";
import { Logger } from "../../../../src/core/services/Logger.js";

vi.mock("../../../../src/core/services/Logger.js", () => ({
  Logger: {
    warn: vi.fn(),
  },
}));

describe("NotificationService", () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    global.localStorage = mockLocalStorage;
    vi.clearAllMocks();
  });

  // ============================================================
  // 1. LOAD (test qua constructor)
  // ============================================================
  describe("load", () => {
    it("should load default notifications when storage is empty (null)", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();

      expect(service.notifications.length).toBe(2);
      expect(service.notifications[0].title).toBe("Welcome to TriAD!");
      expect(service.getUnreadCount()).toBe(2);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should load default notifications when storage returns empty string", () => {
      mockLocalStorage.getItem.mockReturnValue("");
      const service = new NotificationService();

      expect(service.notifications.length).toBe(2);
      expect(service.notifications[0].title).toBe("Welcome to TriAD!");
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should load existing notifications from storage", () => {
      const mockData = [{ id: 1, title: "Test", read: false }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));
      const service = new NotificationService();

      expect(service.notifications.length).toBe(1);
      expect(service.notifications[0].title).toBe("Test");
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it("should load empty array from storage when data is '[]'", () => {
      mockLocalStorage.getItem.mockReturnValue("[]");
      const service = new NotificationService();

      expect(service.notifications.length).toBe(0);
      expect(service.getUnreadCount()).toBe(0);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it("should handle JSON parse error in load and set default empty array", () => {
      mockLocalStorage.getItem.mockReturnValue("{ invalid json }");
      const service = new NotificationService();

      expect(service.notifications).toEqual([]);
      expect(service.getUnreadCount()).toBe(0);
      expect(Logger.warn).toHaveBeenCalledWith(
        "Load notifications error:",
        expect.any(Error)
      );
    });

    it("should handle localStorage getItem error gracefully", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });
      const service = new NotificationService();

      expect(service.notifications).toEqual([]);
      expect(service.getUnreadCount()).toBe(0);
      expect(Logger.warn).toHaveBeenCalled();
    });

    it("should handle 'null' string from storage (JSON.parse(null) returns null) and fallback to empty array", () => {
      mockLocalStorage.getItem.mockReturnValue("null");
      const service = new NotificationService();

      // JSON.parse("null") -> null, gây lỗi trong updateUnreadCount, catch set array rỗng
      expect(service.notifications.length).toBe(0);
      expect(service.getUnreadCount()).toBe(0);
      // Không gọi save() vì đã catch
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 2. SAVE (error handling)
  // ============================================================
  describe("save", () => {
    it("should handle localStorage setItem error gracefully", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Quota exceeded");
      });
      Logger.warn.mockClear();

      service.add("Test", "Message");

      expect(Logger.warn).toHaveBeenCalledWith(
        "Save notifications error:",
        expect.any(Error)
      );
      expect(() => service.save()).not.toThrow();
    });
  });

  // ============================================================
  // 3. ADD
  // ============================================================
  describe("add", () => {
    it("should add notification and update unread count", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();

      const notif = service.add("New", "Message", "info");
      expect(service.getAll().length).toBe(3);
      expect(notif.title).toBe("New");
      expect(notif.read).toBe(false);
      expect(service.getUnreadCount()).toBe(3);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should add notification with default type 'info'", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();

      const notif = service.add("Default", "Msg");
      expect(notif.type).toBe("info");
    });

    it("should add notification and prepend to list (unshift)", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();

      service.add("First", "1");
      service.add("Second", "2");
      const all = service.getAll();
      expect(all[0].title).toBe("Second");
      expect(all[1].title).toBe("First");
    });
  });

  // ============================================================
  // 4. MARK AS READ
  // ============================================================
  describe("markAsRead", () => {
    it("should mark a notification as read and return true", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();

      service.add("Test", "Msg");
      const id = service.getAll()[0].id;
      const result = service.markAsRead(id);

      expect(result).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
      expect(service.getUnreadCount()).toBe(2);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should return false if notification id not found", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();

      const result = service.markAsRead(99999);
      expect(result).toBe(false);
      expect(service.getUnreadCount()).toBe(2);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it("should return false if notification already read", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();

      service.add("Test", "Msg");
      const id = service.getAll()[0].id;
      service.markAsRead(id);
      mockLocalStorage.setItem.mockClear();
      const result = service.markAsRead(id);
      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 5. MARK ALL AS READ
  // ============================================================
  describe("markAllAsRead", () => {
    it("should mark all notifications as read and return true", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();

      service.add("Test1", "Msg1");
      service.add("Test2", "Msg2");
      mockLocalStorage.setItem.mockClear();

      const changed = service.markAllAsRead();
      expect(changed).toBe(true);
      expect(service.getUnreadCount()).toBe(0);
      service.getAll().forEach(n => expect(n.read).toBe(true));
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should return false if no unread notifications", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();

      service.markAllAsRead();
      mockLocalStorage.setItem.mockClear();
      const changed = service.markAllAsRead();
      expect(changed).toBe(false);
      expect(service.getUnreadCount()).toBe(0);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it("should handle case where some notifications already read", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      mockLocalStorage.setItem.mockClear();

      service.add("Unread1", "1");
      const id = service.getAll()[0].id;
      service.markAsRead(id);
      service.add("Unread2", "2");
      mockLocalStorage.setItem.mockClear();

      const changed = service.markAllAsRead();
      expect(changed).toBe(true);
      expect(service.getUnreadCount()).toBe(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  // ============================================================
  // 6. GETTERS & HELPERS
  // ============================================================
  describe("getters", () => {
    it("getAll should return a copy of notifications array", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      const all = service.getAll();
      expect(all).not.toBe(service.notifications);
      expect(all.length).toBe(2);
    });

    it("getUnread should return only unread notifications", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      service.add("Unread", "Msg");
      const unread = service.getUnread();
      expect(unread.length).toBe(3);
      unread.forEach(n => expect(n.read).toBe(false));
    });

    it("getLatest should return latest notifications by limit", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      service.add("A", "1");
      service.add("B", "2");
      const latest = service.getLatest(2);
      expect(latest.length).toBe(2);
      expect(latest[0].title).toBe("B");
      expect(latest[1].title).toBe("A");
    });

    it("getLatest should default to 5 items", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      for (let i = 0; i < 7; i++) {
        service.add(`Item ${i}`, `${i}`);
      }
      const latest = service.getLatest();
      expect(latest.length).toBe(5);
    });

    it("updateUnreadCount should recalculate and return count", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const service = new NotificationService();
      service.add("New", "Msg");
      const count = service.updateUnreadCount();
      expect(count).toBe(3);
      expect(service.unreadCount).toBe(3);
    });
  });
});