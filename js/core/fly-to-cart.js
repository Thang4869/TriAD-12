// js/core/fly-to-cart.js
import { APP_CONFIG } from '../config/settings.js';

const { FLY_DURATION } = APP_CONFIG;

class FlyToCart {
    constructor() {
        this.isFlying = false;
        this.cartBadge = document.getElementById('cart-badge');
        
        // Debug
        console.log('FlyToCart initialized');
        console.log('Cart badge found:', !!this.cartBadge);
        
        if (!this.cartBadge) {
            // Fallback: tìm cart icon
            this.cartBadge = document.querySelector('#cart-icon-btn') || 
                            document.querySelector('#mobile-cart-btn');
            console.log('Fallback cart target:', !!this.cartBadge);
        }
    }
    
    fly(element, callback = null) {
        console.log('Fly animation triggered');
        
        if (this.isFlying) {
            console.warn('Fly animation already in progress');
            if (callback) callback();
            return;
        }
        
        if (!element) {
            console.warn('No element to fly');
            if (callback) callback();
            return;
        }
        
        // Lấy ảnh từ element
        let imageSrc = '';
        if (element.tagName === 'IMG') {
            imageSrc = element.src;
        } else {
            const img = element.querySelector('img');
            if (img) imageSrc = img.src;
        }
        
        console.log('Image source:', imageSrc);
        
        if (!imageSrc) {
            console.warn('No image source found');
            if (callback) callback();
            return;
        }
        
        // Kiểm tra target
        const targetRect = this.cartBadge?.getBoundingClientRect();
        if (!targetRect) {
            console.warn('Cart target not found');
            this.isFlying = false;
            if (callback) callback();
            return;
        }
        
        this.isFlying = true;
        
        // Get source position
        const sourceRect = element.getBoundingClientRect();
        console.log('Source rect:', sourceRect);
        console.log('Target rect:', targetRect);
        
        // Create flying element
        const flyEl = document.createElement('img');
        flyEl.src = imageSrc;
        flyEl.className = 'fly-element';
        flyEl.style.width = Math.min(sourceRect.width, 120) + 'px';
        flyEl.style.height = Math.min(sourceRect.height, 120) + 'px';
        flyEl.style.left = sourceRect.left + 'px';
        flyEl.style.top = sourceRect.top + 'px';
        flyEl.style.borderRadius = '12px';
        flyEl.style.objectFit = 'contain';
        flyEl.style.backgroundColor = '#f8f8f8';
        flyEl.style.padding = '8px';
        flyEl.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
        flyEl.style.zIndex = '9999';
        flyEl.style.pointerEvents = 'none';
        
        document.body.appendChild(flyEl);
        console.log('Fly element created');
        
        // Force reflow
        flyEl.offsetHeight;
        
        // Calculate end position
        const endX = targetRect.left + targetRect.width / 2 - sourceRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2 - sourceRect.height / 2;
        
        // Animate
        const startTime = performance.now();
        const startX = sourceRect.left;
        const startY = sourceRect.top;
        
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
            
            flyEl.style.left = currentX + 'px';
            flyEl.style.top = currentY + 'px';
            flyEl.style.transform = `scale(${currentScale}) rotate(${currentRotation}deg)`;
            flyEl.style.opacity = currentOpacity;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                flyEl.remove();
                this.isFlying = false;
                console.log('Fly animation completed');
                
                // Pulse cart badge
                if (this.cartBadge) {
                    this.cartBadge.classList.add('cart-badge-pulse');
                    setTimeout(() => {
                        this.cartBadge?.classList.remove('cart-badge-pulse');
                    }, 500);
                }
                
                if (callback) callback();
            }
        }
        
        requestAnimationFrame(animate);
    }
}

export const flyToCart = new FlyToCart();
window.flyToCart = flyToCart;