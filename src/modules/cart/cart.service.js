/**
 * Cart Service - Business logic for cart operations
 * 
 * Single Responsibility: Cart business logic
 * Dependencies: CartRepository for data access
 */
import { eventBus, EVENTS } from '../../shared/services/event-bus.service.js';
import { CartItem } from '../../shared/models/cart-item.model.js';
import { CartRepository } from './cart.repository.js';

export class CartService {
    constructor() {
        this.repository = new CartRepository();
        this.items = [];
        this.load();
    }
    
    /**
     * Load cart from repository
     */
    load() {
        this.items = this.repository.findAll();
        this.notify();
        return this.items;
    }
    
    /**
     * Add product to cart
     */
    add(product, quantity = 1) {
        const existing = this.items.find(item => item.id === product.id);
        
        if (existing) {
            // Update existing item
            const index = this.items.indexOf(existing);
            this.items[index] = existing.increment(quantity);
        } else {
            // Add new item
            this.items.push(new CartItem(product, quantity));
        }
        
        this.save();
        eventBus.emit(EVENTS.CART_ITEM_ADDED, { product, quantity });
        
        return this.items;
    }
    
    /**
     * Remove item from cart
     */
    remove(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.save();
        eventBus.emit(EVENTS.CART_ITEM_REMOVED, { id });
        return this.items;
    }
    
    /**
     * Increase quantity
     */
    increase(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1) return this.items;
        
        this.items[index] = this.items[index].increment();
        this.save();
        return this.items;
    }
    
    /**
     * Decrease quantity
     */
    decrease(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1) return this.items;
        
        const newItem = this.items[index].decrement();
        if (newItem.quantity === 1 && this.items[index].quantity === 1) {
            // Remove if quantity becomes 0
            this.items.splice(index, 1);
        } else {
            this.items[index] = newItem;
        }
        
        this.save();
        return this.items;
    }
    
    /**
     * Clear cart
     */
    clear() {
        this.items = [];
        this.repository.clear();
        this.notify();
        eventBus.emit(EVENTS.CART_CLEARED);
        return this.items;
    }
    
    /**
     * Get total price
     */
    get total() {
        return this.items.reduce((sum, item) => sum + item.subtotal, 0);
    }
    
    /**
     * Get item count
     */
    get count() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    /**
     * Check if cart is empty
     */
    get isEmpty() {
        return this.items.length === 0;
    }
    
    /**
     * Save to repository
     */
    save() {
        this.repository.save(this.items);
        this.notify();
    }
    
    /**
     * Notify subscribers
     */
    notify() {
        eventBus.emit(EVENTS.CART_UPDATED, {
            items: this.items,
            total: this.total,
            count: this.count,
            isEmpty: this.isEmpty
        });
    }
}