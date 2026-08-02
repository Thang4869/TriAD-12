/**
 * Checkout Controller - Orchestrates checkout operations
 */
import { CheckoutService } from './checkout.service.js';
import { CheckoutValidator } from './checkout.validator.js';
import { formatPrice } from '../../shared/utils/helpers.utils.js';
import { eventBus, EVENTS } from '../../shared/services/event-bus.service.js';

export class CheckoutController {
    constructor() {
        this.service = new CheckoutService();
        this.validator = new CheckoutValidator();
        this.items = [];
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Checkout button
        document.getElementById('checkout-btn')?.addEventListener('click', () => {
            this.openCheckout();
        });
        
        // Close button
        document.getElementById('close-checkout-btn')?.addEventListener('click', () => {
            this.closeCheckout();
        });
        
        // Form submit
        document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });
        
        // Payment method change
        document.querySelectorAll('input[name="payment"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleCardDetails();
            });
        });
        
        // Success modal
        document.getElementById('success-close-btn')?.addEventListener('click', () => {
            this.closeSuccess();
        });
    }
    
    /**
     * Open checkout modal
     */
    openCheckout() {
        const cartItems = window.cartController?.getItems() || [];
        if (cartItems.length === 0) {
            if (window.toast) {
                window.toast.warning('Empty Cart', 'Please add items to your cart first.');
            }
            return;
        }
        
        this.items = cartItems;
        
        const modal = document.getElementById('checkout-modal');
        const content = modal.querySelector('.bg-white');
        
        // Render order summary
        this.renderOrderSummary(cartItems);
        
        // Reset form
        document.getElementById('checkout-form').reset();
        document.getElementById('card-details').classList.add('hidden');
        
        // Show modal
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        });
        
        document.body.style.overflow = 'hidden';
        eventBus.emit(EVENTS.CHECKOUT_STARTED);
    }
    
    /**
     * Close checkout modal
     */
    closeCheckout() {
        const modal = document.getElementById('checkout-modal');
        const content = modal.querySelector('.bg-white');
        
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
        
        document.body.style.overflow = '';
    }
    
    /**
     * Render order summary
     */
    renderOrderSummary(items) {
        const container = document.getElementById('checkout-items');
        const totalEl = document.getElementById('checkout-total');
        
        if (container) {
            container.innerHTML = items.map(item => `
                <div class="item-row flex justify-between text-sm py-1">
                    <span>${item.name} x${item.quantity}</span>
                    <span>${formatPrice(item.subtotal)}</span>
                </div>
            `).join('');
        }
        
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);
        const shipping = total >= 500000 ? 0 : 30000;
        
        if (totalEl) {
            totalEl.textContent = formatPrice(total + shipping);
        }
    }
    
    /**
     * Handle form submission
     */
    handleSubmit(e) {
        e.preventDefault();
        
        // Collect form data
        const data = {
            firstName: document.getElementById('first-name').value.trim(),
            lastName: document.getElementById('last-name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address').value.trim(),
            paymentMethod: document.querySelector('input[name="payment"]:checked')?.value || 'cod',
            cardNumber: document.getElementById('card-number')?.value.trim(),
            cardExpiry: document.getElementById('card-expiry')?.value.trim(),
            cardCvv: document.getElementById('card-cvv')?.value.trim()
        };
        
        // Validate
        const result = this.validator.validate(data);
        if (!result.isValid) {
            if (window.toast) {
                window.toast.error('Validation Error', result.errors.join(', '));
            }
            return;
        }
        
        // Process order
        if (window.toast) {
            window.toast.info('Processing', 'Please wait while we process your order...');
        }
        
        // Simulate API call
        setTimeout(() => {
            try {
                const order = this.service.processCheckout(data, this.items);
                
                // Clear cart
                if (window.cartController) {
                    window.cartController.clear();
                }
                
                // Close modals
                this.closeCheckout();
                if (window.cartController) {
                    window.cartController.closeDrawer();
                }
                
                // Show success
                this.showSuccess(order.id);
                
                if (window.toast) {
                    window.toast.success('Order Placed!', `Order #${order.id} confirmed.`);
                }
            } catch (error) {
                console.error('Checkout error:', error);
                if (window.toast) {
                    window.toast.error('Error', 'Failed to process order. Please try again.');
                }
            }
        }, 1500);
    }
    
    /**
     * Show success modal
     */
    showSuccess(orderId) {
        const modal = document.getElementById('success-modal');
        const content = modal.querySelector('.bg-white');
        
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        });
        
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Close success modal
     */
    closeSuccess() {
        const modal = document.getElementById('success-modal');
        const content = modal.querySelector('.bg-white');
        
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
        
        document.body.style.overflow = '';
        
        // Refresh products
        if (window.productsController) {
            window.productsController.resetFilters();
        }
    }
    
    /**
     * Toggle card details visibility
     */
    toggleCardDetails() {
        const selected = document.querySelector('input[name="payment"]:checked');
        const cardDetails = document.getElementById('card-details');
        
        if (selected && selected.value === 'card') {
            cardDetails.classList.remove('hidden');
        } else {
            cardDetails.classList.add('hidden');
        }
    }
}