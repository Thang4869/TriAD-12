import { Logger } from "../../core/services/Logger.js";

const STORAGE_KEY = "triad_notifications";

export class NotificationService {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.notifications = JSON.parse(data);
      } else {
        this.notifications = [
          {
            id: Date.now() + 1,
            title: "Welcome to TriAD!",
            message: "Discover our premium kitchenware collection.",
            type: "info",
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: Date.now() + 2,
            title: "Hot Sale!",
            message: "Up to 30% off on all glass containers.",
            type: "promotion",
            read: false,
            createdAt: new Date().toISOString(),
          },
        ];
        this.save();
      }
      this.updateUnreadCount();
    } catch (e) {
      Logger.warn("Load notifications error:", e);
      this.notifications = [];
      this.unreadCount = 0;
    }
    return this.notifications;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      Logger.warn("Save notifications error:", e);
    }
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter((n) => !n.read).length;
    return this.unreadCount;
  }

  getAll() {
    return [...this.notifications];
  }

  getUnread() {
    return this.notifications.filter((n) => !n.read);
  }

  getLatest(limit = 5) {
    return [...this.notifications].slice(0, limit);
  }

  add(title, message, type = "info") {
    const notif = {
      id: Date.now() + Math.random() * 1000,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    this.save();
    this.updateUnreadCount();
    return notif;
  }

  markAsRead(id) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif && !notif.read) {
      notif.read = true;
      this.save();
      this.updateUnreadCount();
      return true;
    }
    return false;
  }

  markAllAsRead() {
    let changed = false;
    this.notifications.forEach((n) => {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) {
      this.save();
      this.updateUnreadCount();
    }
    return changed;
  }

  getUnreadCount() {
    return this.unreadCount;
  }
}
