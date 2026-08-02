/**
 * Event Bus Service - Central event communication
 * 
 * Design Pattern: Observer Pattern
 * Purpose: Decouple modules by using events
 */
import { EVENTS } from '../constants/events.constants.js';

export class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.debug = false;
    }
    
    setDebug(enabled) {
        this.debug = enabled;
    }
    
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
        
        return () => this.off(event, callback, context);
    }
    
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
    
    emit(event, data = null) {
        if (this.debug) {
            console.log(`[EventBus] Emitting: ${event}`, data);
        }
        
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
        
        if (this.onceEvents.has(event)) {
            this.onceEvents.delete(event);
        }
    }
    
    getSubscribers(event) {
        if (!this.events.has(event)) {
            return [];
        }
        return this.events.get(event).map(entry => entry.callback);
    }
    
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

// Re-export EVENTS for backward compatibility
export { EVENTS };