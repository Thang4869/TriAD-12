import { Product } from './product.model.js';

/**
 * Cart Item Model - Extends Product with quantity
 * 
 * Inheritance: Extends Product
 * Encapsulation: Manages its own quantity and subtotal
 */
export class CartItem extends Product {
    constructor(product, quantity = 1) {
        // Call parent constructor
        super(product);
        
        // Additional properties
        this._quantity = Math.max(1, quantity);
        
    }
    
    get quantity() { return this._quantity; }
    
    // Computed
    get subtotal() {
        return this._price * this._quantity;
    }
    
    get formattedSubtotal() {
        return this.subtotal.toLocaleString('vi-VN') + ' ₫';
    }
    
    // Immutable operations - return new instance
    withQuantity(newQuantity) {
        if (newQuantity === this._quantity) return this;
        return new CartItem(this, newQuantity);
    }
    
    increment(amount = 1) {
        return this.withQuantity(this._quantity + amount);
    }
    
    decrement(amount = 1) {
        const newQuantity = Math.max(1, this._quantity - amount);
        return this.withQuantity(newQuantity);
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            quantity: this._quantity,
            subtotal: this.subtotal
        };
    }
    
    static fromJSON(data) {
        const product = Product.fromJSON(data);
        return new CartItem(product, data.quantity || 1);
    }
}