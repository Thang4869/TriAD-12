/**
 * Cart Repository - Data access layer for cart
 * 
 * Single Responsibility: Only handles data persistence
 */
import { BaseRepository } from '../../shared/repositories/base.repository.js';
import { storage } from '../../shared/services/storage.service.js';
import { CartItem } from '../../shared/models/cart-item.model.js';

const CART_KEY = 'cart';

export class CartRepository extends BaseRepository {
    constructor() {
        super(storage, CART_KEY);
        this.model = CartItem;
    }
    
    /**
     * Get all cart items
     */
    findAll() {
        const data = this.storage.get(CART_KEY, []);
        return data.map(item => this.model.fromJSON(item));
    }
    
    /**
     * Save cart items
     */
    save(items) {
        const data = items.map(item => item.toJSON());
        this.storage.set(CART_KEY, data);
    }
    
    /**
     * Clear cart
     */
    clear() {
        this.storage.remove(CART_KEY);
    }
    
    /**
     * Check if cart has items
     */
    isEmpty() {
        return this.findAll().length === 0;
    }
    
    /**
     * Get item count
     */
    getCount() {
        const items = this.findAll();
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }
}