import { CheckoutService } from './CheckoutService.js';
import { CheckoutValidator } from './CheckoutValidator.js';
import { CheckoutRenderer } from './CheckoutRenderer.js';
import { formatPrice } from '../../shared/utils/helpers.js';
import { EVENTS } from '../../shared/constants/Events.js';
import { eventBus } from '../../core/services/EventBus.js';

export class CheckoutController {
    constructor() {
        this.service = new CheckoutService();
        this.validator = new CheckoutValidator();
        this.renderer = new CheckoutRenderer();
        this.items = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('checkout-btn')?.addEventListener('click', () => {
            this.openCheckout();
        });

        document.getElementById('close-checkout-btn')?.addEventListener('click', () => {
            this.closeCheckout();
        });

        document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        document.querySelectorAll('input[name="payment"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleCardDetails();
            });
        });

        document.getElementById('success-close-btn')?.addEventListener('click', () => {
            this.closeSuccess();
        });
    }

    openCheckout() {
        const cartItems = window.cartController?.getItems() || [];
        if (cartItems.length === 0) {
            if (window.toast) {
                window.toast.warning('Empty Cart', 'Please add items to your cart first.');
            }
            return;
        }

        this.renderer.renderSummary(cartItems);

        this.items = cartItems;

        const modal = document.getElementById('checkout-modal');
        const content = modal.querySelector('.bg-white');

        document.getElementById('checkout-form').reset();
        document.getElementById('card-details').classList.add('hidden');

        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        });

        document.body.style.overflow = 'hidden';
        eventBus.emit(EVENTS.CHECKOUT_STARTED);
    }

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

    handleSubmit(e) {
        e.preventDefault();

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

        const result = this.validator.validate(data);
        if (!result.isValid) {
            if (window.toast) {
                window.toast.error('Validation Error', result.errors.join(', '));
            }
            return;
        }

        if (window.toast) {
            window.toast.info('Processing', 'Please wait while we process your order...');
        }

        setTimeout(() => {
            try {
                const order = this.service.processCheckout(data, this.items);

                if (window.cartController) {
                    window.cartController.clear();
                }

                this.closeCheckout();
                if (window.cartController) {
                    window.cartController.closeDrawer();
                }

                this.showSuccess(order.id);

                if (window.notifications) {
                    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
                    window.notifications.add(
                        'Order Placed!',
                        `Order #${order.id} confirmed with ${totalItems} item(s). Thank you!`,
                        'success'
                    );
                }

                if (window.toast) {
                    window.toast.success('Order Placed!', `Order #${order.id} confirmed.`);
                }

            } catch (error) {
                console.error('Checkout error:', error);
                if (window.toast) {
                    window.toast.error('Error', 'Failed to process order. Please try again.');
                }
                if (window.notifications) {
                    window.notifications.add(
                        'Order Failed',
                        'There was an error processing your order. Please try again.',
                        'warning'
                    );
                }
            }
        }, 1500);
    }

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

    closeSuccess() {
        const modal = document.getElementById('success-modal');
        const content = modal.querySelector('.bg-white');

        modal.classList.add('opacity-0');
        content.classList.add('scale-95');

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);

        document.body.style.overflow = '';

        if (window.productsController) {
            window.productsController.resetFilters();
        }
    }

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