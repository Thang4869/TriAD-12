/**
 * Cart Controller - Orchestrates cart operations
 * 
 * Single Responsibility: Coordinate between service, renderer, and events
 * Dependencies: CartService, CartRenderer, EventBus
 */
import { CartService } from './cart.service.js';
import { CartRenderer } from './cart.renderer.js';
import { eventBus, EVENTS } from '../../shared/services/event-bus.service.js';

export class CartController {
    constructor() {
        this.service = new CartService();
        this.renderer = new CartRenderer();
        this.isDrawerOpen = false;
        
        this.setupEventListeners();
        this.service.load();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Cart updates
        eventBus.on(EVENTS.CART_UPDATED, (data) => {
            this.renderer.render(data.items);
            this.renderer.updateBadge(data.count);
            this.renderer.setCheckoutEnabled(!data.isEmpty);
        });
        
        // Delegate events for cart items (event delegation)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-id]');
            if (!target) return;
            
            const id = Number(target.dataset.id);
            const action = target.dataset.action;
            
            if (action === 'remove') {
                this.removeItem(id);
            } else if (action === 'increase') {
                this.increaseItem(id);
            } else if (action === 'decrease') {
                this.decreaseItem(id);
            }
        });
    }
    
    /**
     * Add to cart
     */
    addToCart(product, quantity = 1, flyElement = null) {
        const result = this.service.add(product, quantity);
        
        // Trigger fly animation if provided
        if (flyElement && window.flyToCart) {
            window.flyToCart.fly(flyElement);
        }
        
        return result;
    }
    
    /**
     * Remove item
     */
    removeItem(id) {
        return this.service.remove(id);
    }
    
    /**
     * Increase quantity
     */
    increaseItem(id) {
        return this.service.increase(id);
    }
    
    /**
     * Decrease quantity
     */
    decreaseItem(id) {
        return this.service.decrease(id);
    }
    
    /**
     * Clear cart
     */
    clear() {
        return this.service.clear();
    }
    
    /**
     * Get cart items
     */
    getItems() {
        return this.service.items;
    }
    
    /**
     * Get cart total
     */
    getTotal() {
        return this.service.total;
    }
    
    /**
     * Get item count
     */
    getCount() {
        return this.service.count;
    }
    
    /**
     * Open cart drawer
     */
    openDrawer() {
        if (this.isDrawerOpen) return;
        
        const overlay = document.getElementById('cart-overlay');
        const drawer = document.getElementById('cart-drawer');
        
        if (!overlay || !drawer) return;
        
        overlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0');
            drawer.classList.remove('translate-x-full');
        });
        
        this.isDrawerOpen = true;
        document.body.style.overflow = 'hidden';
        eventBus.emit(EVENTS.DRAWER_OPENED);
    }
    
    /**
     * Close cart drawer
     */
    closeDrawer() {
        if (!this.isDrawerOpen) return;
        
        const overlay = document.getElementById('cart-overlay');
        const drawer = document.getElementById('cart-drawer');
        
        if (!overlay || !drawer) return;
        
        overlay.classList.add('opacity-0');
        drawer.classList.add('translate-x-full');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300);
        
        this.isDrawerOpen = false;
        document.body.style.overflow = '';
        eventBus.emit(EVENTS.DRAWER_CLOSED);
    }
}