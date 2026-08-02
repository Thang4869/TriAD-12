/**
 * Event Bus Service - Central event communication
 * 
 * Design Pattern: Observer Pattern
 * Purpose: Decouple modules by using events
 * Benefits: Low coupling, high cohesion, easy to extend
 */
export class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.debug = false;
    }
    
    /**
     * Enable/disable debug logging
     */
    setDebug(enabled) {
        this.debug = enabled;
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @param {Object} context - Context for the callback
     * @returns {Function} Unsubscribe function
     */
    on(event, callback, context = null) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        const entry = { callback, context };
        this.events.get(event).push(entry);
        
        if (this.debug) {
            console.log(`[EventBus] Subscribed to: ${event}`);
        }
        
        // Return unsubscribe function
        return () => this.off(event, callback, context);
    }
    
    /**
     * Subscribe to an event once
     */
    once(event, callback, context = null) {
        const wrapper = (data) => {
            callback.call(context, data);
            this.off(event, wrapper);
        };
        
        if (!this.onceEvents.has(event)) {
            this.onceEvents.set(event, []);
        }
        this.onceEvents.get(event).push(wrapper);
        
        return this.on(event, wrapper);
    }
    
    /**
     * Unsubscribe from an event
     */
    off(event, callback, context = null) {
        if (!this.events.has(event)) {
            return;
        }
        
        const entries = this.events.get(event);
        const filtered = entries.filter(entry => {
            if (context !== null) {
                return !(entry.callback === callback && entry.context === context);
            }
            return entry.callback !== callback;
        });
        
        if (filtered.length === 0) {
            this.events.delete(event);
        } else {
            this.events.set(event, filtered);
        }
        
        if (this.debug) {
            console.log(`[EventBus] Unsubscribed from: ${event}`);
        }
    }
    
    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {*} data - Data to pass to handlers
     */
    emit(event, data = null) {
        if (this.debug) {
            console.log(`[EventBus] Emitting: ${event}`, data);
        }
        
        // Regular subscribers
        if (this.events.has(event)) {
            const entries = [...this.events.get(event)];
            entries.forEach(entry => {
                try {
                    entry.callback.call(entry.context, data);
                } catch (error) {
                    console.error(`[EventBus] Error in handler for ${event}:`, error);
                }
            });
        }
        
        // Once subscribers
        if (this.onceEvents.has(event)) {
            this.onceEvents.delete(event);
        }
    }
    
    /**
     * Get all subscribers for an event
     */
    getSubscribers(event) {
        if (!this.events.has(event)) {
            return [];
        }
        return this.events.get(event).map(entry => entry.callback);
    }
    
    /**
     * Clear all subscribers
     */
    clear() {
        this.events.clear();
        this.onceEvents.clear();
        
        if (this.debug) {
            console.log('[EventBus] All subscribers cleared');
        }
    }
}

// Export singleton
export const eventBus = new EventBus();

// Event constants
export const EVENTS = {
    // App lifecycle
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',
    
    // Cart events
    CART_UPDATED: 'cart:updated',
    CART_ITEM_ADDED: 'cart:item:added',
    CART_ITEM_REMOVED: 'cart:item:removed',
    CART_CLEARED: 'cart:cleared',
    
    // Product events
    PRODUCTS_LOADED: 'products:loaded',
    PRODUCTS_FILTERED: 'products:filtered',
    PRODUCT_SELECTED: 'product:selected',
    
    // Checkout events
    CHECKOUT_STARTED: 'checkout:started',
    CHECKOUT_COMPLETED: 'checkout:completed',
    CHECKOUT_FAILED: 'checkout:failed',
    
    // UI events
    MODAL_OPENED: 'modal:opened',
    MODAL_CLOSED: 'modal:closed',
    DRAWER_OPENED: 'drawer:opened',
    DRAWER_CLOSED: 'drawer:closed',
    TOAST_SHOWN: 'toast:shown',
    TOAST_DISMISSED: 'toast:dismissed',
    
    // Navigation events
    NAVIGATION_CHANGED: 'navigation:changed',
    SECTION_VISIBLE: 'section:visible',
};