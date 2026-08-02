import { CartItem } from './cart-item.model.js';

/**
 * Order Model - Represents a customer order
 */
export class Order {
    constructor({
        id = null,
        items = [],
        customer = {},
        paymentMethod = 'cod',
        status = 'pending',
        createdAt = null
    } = {}) {
        this._id = id || this.generateId();
        this._items = items.map(item => 
            item instanceof CartItem ? item : CartItem.fromJSON(item)
        );
        this._customer = customer;
        this._paymentMethod = paymentMethod;
        this._status = status;
        this._createdAt = createdAt || new Date().toISOString();
        
        Object.freeze(this);
    }
    
    get id() { return this._id; }
    get items() { return [...this._items]; }
    get customer() { return { ...this._customer }; }
    get paymentMethod() { return this._paymentMethod; }
    get status() { return this._status; }
    get createdAt() { return this._createdAt; }
    
    get total() {
        return this._items.reduce((sum, item) => sum + item.subtotal, 0);
    }
    
    get formattedTotal() {
        return this.total.toLocaleString('vi-VN') + ' ₫';
    }
    
    get itemCount() {
        return this._items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    generateId() {
        return 'ORD-' + Date.now().toString(36).toUpperCase() + 
               '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    
    toJSON() {
        return {
            id: this._id,
            items: this._items.map(item => item.toJSON()),
            customer: this._customer,
            paymentMethod: this._paymentMethod,
            status: this._status,
            createdAt: this._createdAt,
            total: this.total
        };
    }
    
    static fromJSON(data) {
        return new Order(data);
    }
}