/**
 * Toast Service - Manages toast notifications
 * 
 * Design Pattern: Singleton Pattern
 * Single Responsibility: Business logic for toast management
 */
import { ToastRenderer } from './toast.renderer.js';

export class ToastService {
    constructor() {
        this.renderer = new ToastRenderer();
        this.duration = 3000;
    }
    
    show({ title, message, type = 'info', duration = this.duration, icon = null }) {
        const element = this.renderer.render({ title, message, type, duration, icon });
        
        // Setup auto-remove
        const timer = setTimeout(() => {
            this.renderer.remove(element);
        }, duration);
        element._timer = timer;
        
        // Setup close button
        const closeBtn = element.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(timer);
                this.renderer.remove(element);
            });
        }
        
        // Pause on hover
        element.addEventListener('mouseenter', () => {
            clearTimeout(timer);
            const progress = element.querySelector('.progress-bar');
            if (progress) {
                progress.style.animationPlayState = 'paused';
            }
        });
        
        element.addEventListener('mouseleave', () => {
            const newTimer = setTimeout(() => {
                this.renderer.remove(element);
            }, duration);
            element._timer = newTimer;
            
            const progress = element.querySelector('.progress-bar');
            if (progress) {
                progress.style.animationPlayState = 'running';
            }
        });
        
        return element;
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
    
    clear() {
        this.renderer.toasts.forEach(toast => {
            this.renderer.remove(toast);
        });
        this.renderer.toasts = [];
    }
}

// Export singleton
export const toast = new ToastService();