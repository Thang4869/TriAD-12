import { Logger } from "../../core/services/Logger.js";

export class NotificationRenderer {
  constructor() {
    this.container = null;
    this.badge = null;
    this.mobileBadge = null;
    this.dropdown = null;
    this.overlay = null;
    this._ensureElements();
  }

  _ensureElements() {
    this.container =
      document.getElementById("notification-list") || this.container;
    this.badge = document.getElementById("notification-badge") || this.badge;
    this.mobileBadge =
      document.getElementById("mobile-notification-badge") || this.mobileBadge;
    this.dropdown =
      document.getElementById("notification-dropdown") || this.dropdown;
    this.overlay =
      document.getElementById("notification-overlay") || this.overlay;
  }

  renderList(notifications) {
    this._ensureElements();
    if (!this.container) {
      Logger.warn("Notification list container not found");
      return;
    }

    if (!notifications || notifications.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "p-6 text-center text-gray-400 text-sm";

      const emptyIcon = document.createElement("i");
      emptyIcon.className = "ph ph-check-circle text-3xl block mb-2";
      emptyState.append(emptyIcon, document.createTextNode("All caught up!"));
      this.container.replaceChildren(emptyState);
      return;
    }

    const sorted = [...notifications];
    sorted.sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1));

    const fragment = document.createDocumentFragment();

    sorted.forEach((notification) => {
      const item = document.createElement("div");
      item.className = [
        "notification-item",
        "p-3",
        "hover:bg-gray-50",
        "transition-colors",
        "border-b",
        "border-gray-50",
        "cursor-pointer",
        notification.read ? "opacity-70" : "bg-blue-50/30",
      ].join(" ");
      item.dataset.id = String(notification.id ?? "");

      const content = document.createElement("div");
      content.className = "flex gap-3";

      const iconContainer = document.createElement("div");
      iconContainer.className = "flex-shrink-0 mt-0.5";
      // getIconHtml only returns hard-coded markup from the type allowlist.
      iconContainer.innerHTML = this.getIconHtml(notification.type);

      const details = document.createElement("div");
      details.className = "flex-1 min-w-0";

      const heading = document.createElement("div");
      heading.className = "flex justify-between items-start";

      const title = document.createElement("p");
      title.className = `text-sm font-medium ${notification.read ? "text-gray-600" : "text-gray-900"}`;
      title.textContent = String(notification.title ?? "");
      heading.append(title);

      if (!notification.read) {
        const unreadIndicator = document.createElement("span");
        unreadIndicator.className =
          "w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5";
        heading.append(unreadIndicator);
      }

      const message = document.createElement("p");
      message.className = "text-xs text-gray-500 truncate";
      message.textContent = String(notification.message ?? "");

      const time = document.createElement("span");
      time.className = "text-xs text-gray-400";
      time.textContent = this.formatTime(notification.createdAt);

      details.append(heading, message, time);
      content.append(iconContainer, details);
      item.append(content);
      fragment.append(item);
    });

    this.container.replaceChildren(fragment);
  }

  getIconHtml(type) {
    const icons = {
      info: '<i class="ph ph-info text-blue-500 text-lg"></i>',
      success: '<i class="ph-fill ph-check-circle text-green-500 text-lg"></i>',
      warning: '<i class="ph-fill ph-warning text-yellow-500 text-lg"></i>',
      promotion: '<i class="ph-fill ph-fire text-orange-500 text-lg"></i>',
      order: '<i class="ph ph-package text-purple-500 text-lg"></i>',
    };
    return icons[type] || icons.info;
  }

  formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60));

    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
    return date.toLocaleDateString("vi-VN");
  }

  updateBadge(count) {
    this._ensureElements();
    const display = count > 0 ? (count > 99 ? "99+" : count) : null;

    [this.badge, this.mobileBadge].forEach((badge) => {
      if (!badge) return;
      if (display) {
        badge.classList.remove("hidden");
        badge.textContent = display;
      } else {
        badge.classList.add("hidden");
      }
    });
  }

  showDropdown() {
    this._ensureElements();
    if (!this.dropdown) {
      Logger.warn("Notification dropdown not found");
      return;
    }
    this.dropdown.classList.remove("hidden");
    const btn = document.getElementById("notification-btn");
    if (btn) {
      const rect = btn.getBoundingClientRect();
      this.dropdown.style.top = rect.bottom + 8 + "px";
      this.dropdown.style.right = window.innerWidth - rect.right + "px";
    }
    if (this.overlay) {
      this.overlay.classList.remove("hidden");
    }
  }

  hideDropdown() {
    this._ensureElements();
    if (this.dropdown) this.dropdown.classList.add("hidden");
    if (this.overlay) this.overlay.classList.add("hidden");
  }

  isDropdownVisible() {
    return this.dropdown && !this.dropdown.classList.contains("hidden");
  }
}
