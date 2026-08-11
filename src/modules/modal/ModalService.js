import { EVENTS } from '../../shared/constants/Events.js';
import { eventBus } from '../../core/services/EventBus.js';

export class ModalService {
    constructor() {
        this.currentProductId = null;
        this.quantity = 1;
        this.isOpen = false;
    }

    setProduct(productId) {
        this.currentProductId = productId;
        this.quantity = 1;
    }

    getProductId() {
        return this.currentProductId;
    }

    updateQuantity(delta) {
        this.quantity = Math.max(1, this.quantity + delta);
        return this.quantity;
    }

    getQuantity() {
        return this.quantity;
    }

    reset() {
        this.currentProductId = null;
        this.quantity = 1;
        this.isOpen = false;
    }

    open(productId) {
        this.setProduct(productId);
        this.isOpen = true;
        eventBus.emit(EVENTS.MODAL_OPENED, { productId });
    }

    close() {
        this.isOpen = false;
        eventBus.emit(EVENTS.MODAL_CLOSED);
        this.reset();
    }
}