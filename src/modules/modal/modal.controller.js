/**
 * Modal Controller - Orchestrates modal operations
 */
import { ModalService } from './modal.service.js';
import { formatPrice } from '../../shared/utils/helpers.utils.js';
import { eventBus, EVENTS } from '../../shared/services/event-bus.service.js';

export class ModalController {
    constructor() {
        this.service = new ModalService();
        this.setupEventListeners();
        
        // DOM refs
        this.overlay = document.getElementById('product-modal-overlay');
        this.content = document.getElementById('product-modal-content');
        this.title = document.getElementById('modal-title');
        this.price = document.getElementById('modal-price');
        this.image = document.getElementById('modal-img');
        this.quantityEl = document.getElementById('modal-quantity');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Open modal
        eventBus.on(EVENTS.MODAL_OPENED, (data) => {
            this.render(data.productId);
        });
        
        eventBus.on(EVENTS.MODAL_CLOSED, () => {
            this.close();
        });
        
        // Close button
        document.getElementById('close-modal-btn')?.addEventListener('click', () => {
            this.close();
        });
        
        // Overlay click
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        
        // Quantity buttons
        document.getElementById('qty-plus')?.addEventListener('click', () => {
            this.updateQuantity(1);
        });
        
        document.getElementById('qty-minus')?.addEventListener('click', () => {
            this.updateQuantity(-1);
        });
        
        // Action buttons
        document.getElementById('add-cart-btn')?.addEventListener('click', () => {
            this.handleAddToCart();
        });
        
        document.getElementById('modal-buy-now-btn')?.addEventListener('click', () => {
            this.handleBuyNow();
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.service.isOpen) {
                this.close();
            }
        });
    }
    
    /**
     * Render modal content
     */
    render(productId) {
        const product = window.productsController?.getProduct(productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }
        
        this.service.setProduct(productId);
        
        // Update DOM
        if (this.title) this.title.textContent = product.name;
        if (this.price) this.price.textContent = formatPrice(product.price);
        if (this.image) {
            this.image.src = product.image;
            this.image.className = `w-full max-w-sm h-auto object-contain transition-all duration-300 filter ${product.filter || ''}`;
        }
        if (this.quantityEl) this.quantityEl.textContent = 1;
        
        // Show modal
        this.show();
    }
    
    /**
     * Show modal with animation
     */
    show() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.overlay.classList.remove('opacity-0');
            this.content?.classList.remove('scale-95');
        });
        
        document.body.style.overflow = 'hidden';
        this.service.isOpen = true;
    }
    
    /**
     * Close modal with animation
     */
    close() {
        if (!this.overlay) return;
        
        this.overlay.classList.add('opacity-0');
        this.content?.classList.add('scale-95');
        
        setTimeout(() => {
            this.overlay.classList.add('hidden');
        }, 300);
        
        document.body.style.overflow = '';
        this.service.reset();
    }
    
    /**
     * Update quantity
     */
    updateQuantity(delta) {
        const newQuantity = this.service.updateQuantity(delta);
        if (this.quantityEl) {
            this.quantityEl.textContent = newQuantity;
        }
    }
    
    /**
     * Handle add to cart
     */
    handleAddToCart() {
        const productId = this.service.getProductId();
        const quantity = this.service.getQuantity();
        const product = window.productsController?.getProduct(productId);
        
        if (!product) return;
        
        if (window.cartController) {
            const img = this.image;
            window.cartController.addToCart(product, quantity, img);
        }
        
        this.close();
        
        // Open cart after animation
        setTimeout(() => {
            if (window.cartController) {
                window.cartController.openDrawer();
            }
        }, 400);
    }
    
    /**
     * Handle buy now
     */
    handleBuyNow() {
        const productId = this.service.getProductId();
        const quantity = this.service.getQuantity();
        const product = window.productsController?.getProduct(productId);
        
        if (!product) return;
        
        if (window.cartController) {
            const img = this.image;
            window.cartController.addToCart(product, quantity, img);
        }
        
        this.close();
        
        // Open cart and scroll to checkout
        setTimeout(() => {
            if (window.cartController) {
                window.cartController.openDrawer();
                setTimeout(() => {
                    document.getElementById('checkout-btn')?.scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                }, 300);
            }
        }, 400);
    }
    
    /**
     * Open modal (public API)
     */
    open(productId) {
        this.service.open(productId);
    }
}