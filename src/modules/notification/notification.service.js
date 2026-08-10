// src/app/notification.service.js

import { logger } from '../../shared/services/logger.service.js';

/**
 * Notification Service - Quản lý thông báo
 */
class NotificationService {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isDropdownOpen = false;
        this.storageKey = 'triad_notifications';
        this.initialized = false;
        
        // DOM elements
        this.btn = null;
        this.mobileBtn = null;
        this.dropdown = null;
        this.overlay = null;
        this.list = null;
        this.badge = null;
        this.mobileBadge = null;
        this.markAllBtn = null;
        
        this.init();
    }

    init() {
        // Đợi DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initElements());
        } else {
            this.initElements();
        }
    }

    initElements() {
        // Tìm DOM elements
        this.btn = document.getElementById('notification-btn');
        this.mobileBtn = document.getElementById('mobile-notification-btn');
        this.dropdown = document.getElementById('notification-dropdown');
        this.overlay = document.getElementById('notification-overlay');
        this.list = document.getElementById('notification-list');
        this.badge = document.getElementById('notification-badge');
        this.mobileBadge = document.getElementById('mobile-notification-badge');
        this.markAllBtn = document.getElementById('mark-all-read');

        // Nếu chưa có button, thử lại sau 200ms
        if (!this.btn && !this.mobileBtn) {
            logger.debug('Waiting for notification elements...');
            setTimeout(() => this.initElements(), 200);
            return;
        }

        logger.debug('Initializing Notification Service...');
        
        // Load dữ liệu
        this.loadNotifications();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Expose API
        this.exposeAPI();
        
        this.initialized = true;
        logger.info('Notification Service ready!');
        logger.debug('Total:', this.notifications.length, 'Unread:', this.unreadCount);
    }

    loadNotifications() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.notifications = JSON.parse(data);
            } else {
                this.notifications = [
                    {
                        id: Date.now() + 1,
                        title: 'Welcome to TriAD!',
                        message: 'Discover our premium kitchenware collection.',
                        type: 'info',
                        read: false,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: Date.now() + 2,
                        title: 'Hot Sale!',
                        message: 'Up to 30% off on all glass containers.',
                        type: 'promotion',
                        read: false,
                        createdAt: new Date().toISOString()
                    }
                ];
                this.saveNotifications();
            }
            this.updateBadge();
        } catch (e) {
            logger.warn('Load error:', e);
            this.notifications = [];
        }
    }

    saveNotifications() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.notifications));
        } catch (e) {
            logger.warn('Save error:', e);
        }
    }

    updateBadge() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (this.badge) {
            if (this.unreadCount > 0) {
                this.badge.classList.remove('hidden');
                this.badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            } else {
                this.badge.classList.add('hidden');
            }
        }
        
        if (this.mobileBadge) {
            if (this.unreadCount > 0) {
                this.mobileBadge.classList.remove('hidden');
                this.mobileBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            } else {
                this.mobileBadge.classList.add('hidden');
            }
        }
    }

    renderNotifications() {
        if (!this.list) return;

        const unread = this.notifications.filter(n => !n.read);
        const read = this.notifications.filter(n => n.read);
        const sorted = [...unread, ...read];

        if (sorted.length === 0) {
            this.list.innerHTML = `
                <div class="p-6 text-center text-gray-400 text-sm">
                    <i class="ph ph-check-circle text-3xl block mb-2"></i>
                    All caught up!
                </div>
            `;
            return;
        }

        this.list.innerHTML = sorted.map(n => `
            <div class="notification-item p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 cursor-pointer ${n.read ? 'opacity-70' : 'bg-blue-50/30'}"
                 data-id="${n.id}">
                <div class="flex gap-3">
                    <div class="flex-shrink-0 mt-0.5">
                        ${this.getIcon(n.type)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <p class="text-sm font-medium ${n.read ? 'text-gray-600' : 'text-gray-900'}">${n.title}</p>
                            ${!n.read ? '<span class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>' : ''}
                        </div>
                        <p class="text-xs text-gray-500 truncate">${n.message}</p>
                        <span class="text-xs text-gray-400">${this.formatTime(n.createdAt)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.list.querySelectorAll('.notification-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = Number(el.dataset.id);
                this.markAsRead(id);
            });
        });
    }

    getIcon(type) {
        const icons = {
            info: '<i class="ph ph-info text-blue-500 text-lg"></i>',
            success: '<i class="ph-fill ph-check-circle text-green-500 text-lg"></i>',
            warning: '<i class="ph-fill ph-warning text-yellow-500 text-lg"></i>',
            promotion: '<i class="ph-fill ph-fire text-orange-500 text-lg"></i>',
            order: '<i class="ph ph-package text-purple-500 text-lg"></i>'
        };
        return icons[type] || icons.info;
    }

    formatTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60));

        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
        return date.toLocaleDateString('vi-VN');
    }

    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif && !notif.read) {
            notif.read = true;
            this.saveNotifications();
            this.updateBadge();
            this.renderNotifications();
        }
    }

    markAllAsRead() {
        let changed = false;
        this.notifications.forEach(n => {
            if (!n.read) {
                n.read = true;
                changed = true;
            }
        });
        if (changed) {
            this.saveNotifications();
            this.updateBadge();
            this.renderNotifications();
            if (window.toast) {
                window.toast.success('All clear!', 'All notifications marked as read.');
            }
        }
    }

    add(title, message, type = 'info') {
        const notif = {
            id: Date.now() + Math.random() * 1000,
            title: title,
            message: message,
            type: type,
            read: false,
            createdAt: new Date().toISOString()
        };
        this.notifications.unshift(notif);
        this.saveNotifications();
        this.updateBadge();
        
        if (this.isDropdownOpen) {
            this.renderNotifications();
        }
        
        if (window.toast) {
            const typeMap = {
                info: 'info',
                success: 'success',
                warning: 'warning',
                promotion: 'info',
                order: 'info'
            };
            window.toast[typeMap[type] || 'info'](title, message);
        }
        
        // Bell animation
        if (this.btn) {
            this.btn.style.animation = 'bellRing 0.5s ease';
            setTimeout(() => {
                this.btn.style.animation = '';
            }, 600);
        }
        
        return notif;
    }

    toggleDropdown(e) {
        e.stopPropagation();
        this.isDropdownOpen = !this.isDropdownOpen;

        if (this.isDropdownOpen) {
            this.dropdown.classList.remove('hidden');
            this.overlay.classList.remove('hidden');
            this.renderNotifications();
            if (this.btn) {
                const rect = this.btn.getBoundingClientRect();
                this.dropdown.style.top = (rect.bottom + 8) + 'px';
                this.dropdown.style.right = (window.innerWidth - rect.right) + 'px';
            }
        } else {
            this.dropdown.classList.add('hidden');
            this.overlay.classList.add('hidden');
        }
    }

    closeDropdown() {
        if (this.isDropdownOpen) {
            this.isDropdownOpen = false;
            this.dropdown.classList.add('hidden');
            this.overlay.classList.add('hidden');
        }
    }

    setupEventListeners() {
        if (this.btn) {
            this.btn.addEventListener('click', (e) => this.toggleDropdown(e));
        }
        
        if (this.mobileBtn) {
            this.mobileBtn.addEventListener('click', (e) => this.toggleDropdown(e));
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeDropdown());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
            }
        });

        if (this.markAllBtn) {
            this.markAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAllAsRead();
            });
        }

                // Thêm thông báo khi cart được clear (thanh toán xong)
        if (window.eventBus) {
            // Khi có đơn hàng mới
            window.eventBus.on('checkout:completed', (data) => {
                if (data && data.order) {
                    this.add(
                        'New Order',
                        `Order #${data.order.id} has been placed successfully!`,
                        'order'
                    );
                }
            });

            // Khi giỏ hàng được cập nhật
            window.eventBus.on('cart:updated', (data) => {
                // Không cần thông báo mỗi lần cập nhật
                // Chỉ khi có item được thêm
            });
            
            // Khi sản phẩm được thêm vào giỏ (từ bất kỳ đâu)
            window.eventBus.on('cart:item:added', (data) => {
                // Đã có thông báo từ các controller
                // Tránh trùng lặp
            });
            
            window.eventBus.on('checkout:completed', (data) => {
                // Đã có thông báo từ checkout controller
            });
        }
        
        // Thêm thông báo khi có lỗi
        window.addEventListener('error', (e) => {
            // Chỉ thông báo lỗi nghiêm trọng
            if (e.error && e.error.message) {
                this.add(
                    'System Error',
                    'An unexpected error occurred. Please refresh the page.',
                    'warning'
                );
            }
        });

        // Auto-add notification when adding to cart
        document.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-action="add-to-cart"]');
            if (addBtn) {
                const productName = addBtn.closest('.product-card')?.querySelector('h3')?.textContent || 'Product';
                setTimeout(() => {
                    this.add('Added to Cart', `${productName} has been added to your cart.`, 'success');
                }, 300);
            }
        });
    }

    exposeAPI() {
        window.notifications = {
            add: (title, message, type) => this.add(title, message, type),
            markAsRead: (id) => this.markAsRead(id),
            markAllAsRead: () => this.markAllAsRead(),
            getUnread: () => this.notifications.filter(n => !n.read),
            getAll: () => [...this.notifications],
            getCount: () => this.notifications.length
        };
    }
}

// Export singleton
export const notificationService = new NotificationService();