/**
 * Fly-to-Cart - Animation for adding items to cart
 * 
 * Single Responsibility: Only handles fly animation
 */
import { APP_CONFIG } from '../../config/settings.config.js';
import { logger } from '../../shared/services/logger.service.js';

const { FLY_DURATION } = APP_CONFIG;

export class FlyToCart {
    constructor() {
        this.isFlying = false;
        this.cartBadge = this.findCartBadge();
        logger.debug('FlyToCart initialized');
    }
    
    /**
     * Find cart badge element
     */
    findCartBadge() {
        let badge = document.getElementById('cart-badge');
        if (!badge) {
            badge = document.querySelector('#cart-icon-btn') || 
                    document.querySelector('#mobile-cart-btn');
        }
        return badge;
    }
    
    /**
     * Fly element to cart
     */
    fly(element, callback = null) {
        if (this.isFlying) {
            logger.debug('Fly animation already in progress');
            if (callback) callback();
            return;
        }
        
        if (!element) {
            logger.debug('No element to fly');
            if (callback) callback();
            return;
        }
        
        // Get image source
        const imageSrc = this.getImageSrc(element);
        if (!imageSrc) {
            logger.debug('No image source found');
            if (callback) callback();
            return;
        }
        
        // Get target
        const targetRect = this.cartBadge?.getBoundingClientRect();
        if (!targetRect) {
            logger.debug('Cart target not found');
            this.cartBadge = this.findCartBadge();
            const retryRect = this.cartBadge?.getBoundingClientRect();
            if (!retryRect) {
                this.isFlying = false;
                if (callback) callback();
                return;
            }
            this.isFlying = false;
            if (callback) callback();
            return;
        }
        
        this.isFlying = true;
        
        // Get source position
        const sourceRect = element.getBoundingClientRect();
        
        // Create flying element
        const flyEl = this.createFlyElement(imageSrc, sourceRect);
        document.body.appendChild(flyEl);
        
        // Force reflow
        flyEl.offsetHeight;
        
        // Calculate end position
        const endX = targetRect.left + targetRect.width / 2 - sourceRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2 - sourceRect.height / 2;
        
        // Animate
        this.animateFly(flyEl, sourceRect, { x: endX, y: endY }, () => {
            flyEl.remove();
            this.isFlying = false;
            
            // Pulse badge
            if (this.cartBadge) {
                this.cartBadge.classList.add('cart-badge-pulse');
                setTimeout(() => {
                    this.cartBadge?.classList.remove('cart-badge-pulse');
                }, 500);
            }
            
            if (callback) callback();
        });
    }
    
    /**
     * Get image source from element
     */
    getImageSrc(element) {
        if (element.tagName === 'IMG') {
            return element.src;
        }
        const img = element.querySelector('img');
        return img?.src || '';
    }
    
    /**
     * Create flying element
     */
    createFlyElement(imageSrc, sourceRect) {
        const el = document.createElement('img');
        el.src = imageSrc;
        el.className = 'fly-element';
        el.style.width = Math.min(sourceRect.width, 120) + 'px';
        el.style.height = Math.min(sourceRect.height, 120) + 'px';
        el.style.left = sourceRect.left + 'px';
        el.style.top = sourceRect.top + 'px';
        el.style.borderRadius = '12px';
        el.style.objectFit = 'contain';
        el.style.backgroundColor = '#f8f8f8';
        el.style.padding = '8px';
        el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
        el.style.zIndex = '9999';
        el.style.pointerEvents = 'none';
        return el;
    }
    
    /**
     * Animate flying element
     */
    animateFly(element, start, end, callback) {
        const startTime = performance.now();
        const startX = start.left;
        const startY = start.top;
        const endX = end.x;
        const endY = end.y;
        
        function animate(time) {
            const progress = Math.min((time - startTime) / FLY_DURATION, 1);
            // Ease in-out cubic
            const ease = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const currentX = startX + (endX - startX) * ease;
            const currentY = startY + (endY - startY) * ease;
            const currentScale = 1 - ease * 0.7;
            const currentOpacity = 1 - ease * 0.3;
            const currentRotation = ease * 30;
            
            element.style.left = currentX + 'px';
            element.style.top = currentY + 'px';
            element.style.transform = `scale(${currentScale}) rotate(${currentRotation}deg)`;
            element.style.opacity = currentOpacity;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        }
        
        requestAnimationFrame(animate);
    }
}

// Export singleton
export const flyToCart = new FlyToCart();
window.flyToCart = flyToCart;