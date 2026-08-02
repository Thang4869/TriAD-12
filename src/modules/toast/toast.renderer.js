/**
 * Toast Renderer - Handles toast UI rendering
 * 
 * Single Responsibility: Only renders toast elements
 */
export class ToastRenderer {
    constructor() {
        this.container = this.getContainer();
        this.toasts = [];
        this.maxToasts = 4;
    }
    
    getContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-20 right-4 z-50 space-y-2 pointer-events-none';
            document.body.appendChild(container);
        }
        return container;
    }
    
    createElement({ title, message, type = 'info', duration = 3000, icon = null }) {
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
        
        return wrapper;
    }
    
    render(toastData) {
        // Check for duplicates
        const existing = this.findDuplicate(toastData);
        if (existing) {
            return existing;
        }
        
        const element = this.createElement(toastData);
        this.container.appendChild(element);
        this.toasts.push(element);
        
        // Limit max toasts
        while (this.toasts.length > this.maxToasts) {
            const oldest = this.toasts.shift();
            this.remove(oldest);
        }
        
        return element;
    }
    
    findDuplicate({ title, message }) {
        return this.toasts.find(t => 
            t.querySelector('.title')?.textContent === title &&
            t.querySelector('.message')?.textContent === message
        );
    }
    
    remove(element) {
        if (!element || !element.parentNode) return;
        
        element.classList.add('toast-exit');
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.toasts = this.toasts.filter(t => t !== element);
        }, 300);
    }
    
    resetTimer(element) {
        // Reset progress bar animation
        const progress = element.querySelector('.progress-bar');
        if (progress) {
            progress.style.animation = 'none';
            progress.offsetHeight; // Trigger reflow
            const duration = parseInt(element.dataset.duration) || 3000;
            progress.style.animation = `progress ${duration}ms linear forwards`;
        }
    }
}