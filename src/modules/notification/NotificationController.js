import { Logger } from '../../core/services/Logger.js';
import { NotificationService } from './NotificationService.js';
import { NotificationRenderer } from './NotificationRenderer.js';
import { eventBus } from '../../core/services/EventBus.js';
import { EVENTS } from '../../shared/constants/Events.js';

export class NotificationController {
  constructor() {
    this.service = new NotificationService();
    this.renderer = new NotificationRenderer();
    this._isOpen = false;
    this._initialized = false;
    this._retryCount = 0;
    this._maxRetries = 20;
    this._retryDelay = 300;
    this._listenersAttached = false;
    this._documentEventsAttached = false;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._init());
    } else {
      this._init();
    }
  }

  _init() {
    if (this._initialized) return;
    this._setupEventListeners();
    this._exposeAPI();
    this._updateUI();
    this._initialized = true;
    Logger.info('Notification Controller initialized');
  }

  _setupEventListeners() {
    if (this._listenersAttached) {
      return;
    }

    const findElements = () => {
      this.btn = document.getElementById('notification-btn');
      this.mobileBtn = document.getElementById('mobile-notification-btn');
      this.overlay = document.getElementById('notification-overlay');
      this.markAllBtn = document.getElementById('mark-all-read');

      if (!this.btn && !this.mobileBtn) {
        if (this._retryCount < this._maxRetries) {
          this._retryCount++;
          setTimeout(findElements, this._retryDelay);
        }
        return;
      }

      this._retryCount = 0;

      if (this.btn) {
        this.btn.addEventListener('click', (e) => this._toggleDropdown(e));
      }
      if (this.mobileBtn) {
        this.mobileBtn.addEventListener('click', (e) => this._toggleDropdown(e));
      }
      if (this.overlay) {
        this.overlay.addEventListener('click', () => this._closeDropdown());
      }
      if (this.markAllBtn) {
        this.markAllBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.markAllAsRead();
        });
      }

      if (!this._documentEventsAttached) {
        // ESC
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this._isOpen) {
            this._closeDropdown();
          }
        });

        document.addEventListener('click', (e) => {
          if (this._isOpen) {
            const dropdown = document.getElementById('notification-dropdown');
            if (dropdown && !dropdown.contains(e.target) &&
                !this.btn?.contains(e.target) && !this.mobileBtn?.contains(e.target)) {
              this._closeDropdown();
            }
          }
        });

        document.addEventListener('click', (e) => {
          const item = e.target.closest('.notification-item');
          if (item) {
            const id = Number(item.dataset.id);
            if (id) this.markAsRead(id);
          }
        });

        if (window.eventBus) {
          eventBus.on(EVENTS.CHECKOUT_COMPLETED, (data) => {
            if (data?.order) {
              this.add('New Order', `Order #${data.order.id} placed!`, 'order');
            }
          });
        }

        window.addEventListener('error', (e) => {
          if (e.error?.message) {
            this.add('System Error', 'An unexpected error occurred.', 'warning');
          }
        });

        this._documentEventsAttached = true;
      }

      this._listenersAttached = true;
      this._updateUI();
    };

    findElements();
  }

  reinit() {
    if (!this._listenersAttached) {
      this._setupEventListeners();
    } else {
      this._updateUI();
    }
  }

  _toggleDropdown(e) {
    e?.stopPropagation();
    this._isOpen = !this._isOpen;
    if (this._isOpen) {
      this.renderer.showDropdown();
      this.renderer.renderList(this.service.getAll());
    } else {
      this.renderer.hideDropdown();
    }
  }

  _closeDropdown() {
    this._isOpen = false;
    this.renderer.hideDropdown();
  }

  _updateUI() {
    this.renderer.updateBadge(this.service.getUnreadCount());
  }

  add(title, message, type = 'info') {
    const notif = this.service.add(title, message, type);
    this._updateUI();
    if (this._isOpen) {
      this.renderer.renderList(this.service.getAll());
    }
    if (window.toast) {
      const map = { info: 'info', success: 'success', warning: 'warning', promotion: 'info', order: 'info' };
      window.toast[map[type] || 'info'](title, message);
    }
    const btn = document.getElementById('notification-btn');
    if (btn) {
      btn.style.animation = 'bellRing 0.5s ease';
      setTimeout(() => btn.style.animation = '', 600);
    }
    return notif;
  }

  markAsRead(id) {
    const ok = this.service.markAsRead(id);
    if (ok) {
      this._updateUI();
      if (this._isOpen) this.renderer.renderList(this.service.getAll());
    }
    return ok;
  }

  markAllAsRead() {
    const changed = this.service.markAllAsRead();
    if (changed) {
      this._updateUI();
      if (this._isOpen) this.renderer.renderList(this.service.getAll());
      if (window.toast) window.toast.success('All clear!', 'All notifications marked as read.');
    }
  }

  _exposeAPI() {
    window.notifications = {
      add: (t, m, type) => this.add(t, m, type),
      markAsRead: (id) => this.markAsRead(id),
      markAllAsRead: () => this.markAllAsRead(),
      getUnread: () => this.service.getUnread(),
      getAll: () => this.service.getAll(),
      getCount: () => this.service.getUnreadCount(),
    };
  }
}

export const notificationController = new NotificationController();