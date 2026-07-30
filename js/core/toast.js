// js/core/toast.js
import { APP_CONFIG } from '../config/settings.js';

const { TOAST_DURATION, MAX_TOASTS } = APP_CONFIG;

class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed top-20 right-4 z-50 space-y-2 pointer-events-none';
            document.body.appendChild(this.container);
        }
        this.toasts = [];
    }
    
    show({ title, message, type = 'info', duration = TOAST_DURATION, icon = null }) {
        // Kiểm tra nếu đã có toast trùng lặp
        const existing = this.toasts.find(t => 
            t.querySelector('.title')?.textContent === title &&
            t.querySelector('.message')?.textContent === message
        );
        if (existing) {
            // Reset timer của toast cũ
            this.resetToastTimer(existing);
            return existing;
        }
        
        const toast = this.createToast({ title, message, type, duration, icon });
        this.container.appendChild(toast);
        this.toasts.push(toast);
        
        // Limit max toasts
        while (this.toasts.length > MAX_TOASTS) {
            const oldest = this.toasts.shift();
            this.removeToast(oldest);
        }
        
        // Auto remove
        const timer = setTimeout(() => {
            this.removeToast(toast);
        }, duration);
        toast._timer = timer;
        
        return toast;
    }
    
    resetToastTimer(toast) {
        if (toast._timer) {
            clearTimeout(toast._timer);
        }
        const duration = parseInt(toast.dataset.duration) || TOAST_DURATION;
        toast._timer = setTimeout(() => {
            this.removeToast(toast);
        }, duration);
        
        // Reset progress bar
        const progress = toast.querySelector('.progress-bar');
        if (progress) {
            progress.style.animation = 'none';
            progress.offsetHeight; // Trigger reflow
            progress.style.animation = `progress ${duration}ms linear forwards`;
        }
    }
    
    createToast({ title, message, type, duration, icon }) {
        const icons = {
            success: 'ph-fill ph-check-circle',
            error: 'ph-fill ph-x-circle',
            warning: 'ph-fill ph-warning',
            info: 'ph-fill ph-info'
        };
        
        const iconClass = icon || icons[type] || icons.info;
        
        const wrapper = document.createElement('div');
        wrapper.className = `toast toast-${type}`;
        wrapper.setAttribute('role', 'alert');
        wrapper.setAttribute('aria-live', 'polite');
        wrapper.dataset.duration = duration;
        
        wrapper.innerHTML = `
            <i class="ph ${iconClass} icon"></i>
            <div class="content">
                <div class="title">${title}</div>
                ${message ? `<div class="message">${message}</div>` : ''}
            </div>
            <button class="close-btn" aria-label="Close notification">
                <i class="ph ph-x"></i>
            </button>
            <div class="progress-bar" style="animation-duration: ${duration}ms"></div>
        `;
        
        // Close button
        wrapper.querySelector('.close-btn').addEventListener('click', () => {
            this.removeToast(wrapper);
        });
        
        // Pause on hover
        wrapper.addEventListener('mouseenter', () => {
            const progress = wrapper.querySelector('.progress-bar');
            if (progress) {
                progress.style.animationPlayState = 'paused';
            }
            if (wrapper._timer) {
                clearTimeout(wrapper._timer);
            }
        });
        
        wrapper.addEventListener('mouseleave', () => {
            const progress = wrapper.querySelector('.progress-bar');
            if (progress) {
                progress.style.animationPlayState = 'running';
            }
            const duration = parseInt(wrapper.dataset.duration) || TOAST_DURATION;
            wrapper._timer = setTimeout(() => {
                this.removeToast(wrapper);
            }, duration);
        });
        
        return wrapper;
    }
    
    removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        if (toast._timer) {
            clearTimeout(toast._timer);
        }
        toast.classList.add('toast-exit');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }
    
    success(title, message) {
        return this.show({ title, message, type: 'success' });
    }
    
    error(title, message) {
        return this.show({ title, message, type: 'error' });
    }
    
    warning(title, message) {
        return this.show({ title, message, type: 'warning' });
    }
    
    info(title, message) {
        return this.show({ title, message, type: 'info' });
    }
}

export const toast = new ToastManager();
window.toast = toast;