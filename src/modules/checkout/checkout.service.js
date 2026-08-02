/**
 * Checkout Service - Business logic for checkout
 * 
 * Single Responsibility: Order processing and management
 */
import { Order } from '../../shared/models/order.model.js';
import { storage } from '../../shared/services/storage.service.js';
import { eventBus, EVENTS } from '../../shared/services/event-bus.service.js';

const ORDERS_KEY = 'orders';

export class CheckoutService {
    constructor() {
        this.storage = storage;
        this.orders = [];
        this.loadOrders();
    }
    
    /**
     * Load orders from storage
     */
    loadOrders() {
        const data = this.storage.get(ORDERS_KEY, []);
        this.orders = data.map(order => Order.fromJSON(order));
        return this.orders;
    }
    
    /**
     * Get all orders
     */
    getOrders() {
        return [...this.orders];
    }
    
    /**
     * Create a new order
     */
    createOrder(orderData) {
        const order = new Order(orderData);
        this.orders.push(order);
        this.saveOrders();
        
        eventBus.emit(EVENTS.CHECKOUT_COMPLETED, { order });
        return order;
    }
    
    /**
     * Save orders to storage
     */
    saveOrders() {
        const data = this.orders.map(order => order.toJSON());
        this.storage.set(ORDERS_KEY, data);
    }
    
    /**
     * Get order by ID
     */
    getOrderById(id) {
        return this.orders.find(order => order.id === id) || null;
    }
    
    /**
     * Process checkout
     */
    processCheckout(formData, cartItems) {
        // Calculate shipping
        const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
        const shipping = total >= 500000 ? 0 : 30000;
        
        const orderData = {
            items: cartItems,
            customer: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address
            },
            paymentMethod: formData.paymentMethod,
            total: total + shipping
        };
        
        return this.createOrder(orderData);
    }
}