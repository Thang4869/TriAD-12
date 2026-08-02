/**
 * Modal Service - Business logic for modal operations
 */
import { eventBus, EVENTS } from '../../shared/services/event-bus.service.js';

export class ModalService {
    constructor() {
        this.currentProductId = null;
        this.quantity = 1;
        this.isOpen = false;
    }
    
    /**
     * Set current product
     */
    setProduct(productId) {
        this.currentProductId = productId;
        this.quantity = 1;
    }
    
    /**
     * Get current product ID
     */
    getProductId() {
        return this.currentProductId;
    }
    
    /**
     * Update quantity
     */
    updateQuantity(delta) {
        this.quantity = Math.max(1, this.quantity + delta);
        return this.quantity;
    }
    
    /**
     * Get current quantity
     */
    getQuantity() {
        return this.quantity;
    }
    
    /**
     * Reset modal state
     */
    reset() {
        this.currentProductId = null;
        this.quantity = 1;
        this.isOpen = false;
    }
    
    /**
     * Open modal
     */
    open(productId) {
        this.setProduct(productId);
        this.isOpen = true;
        eventBus.emit(EVENTS.MODAL_OPENED, { productId });
    }
    
    /**
     * Close modal
     */
    close() {
        this.isOpen = false;
        eventBus.emit(EVENTS.MODAL_CLOSED);
        this.reset();
    }
}