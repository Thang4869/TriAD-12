/**
 * Application - Main application orchestrator
 * 
 * Single Responsibility: Initialize and coordinate all modules
 */
import { CartController } from '../modules/cart/index.js';
import { ProductsController } from '../modules/products/index.js';
import { ModalController } from '../modules/modal/index.js';
import { CheckoutController } from '../modules/checkout/index.js';
import { toast } from '../modules/toast/toast.service.js';
import { flyToCart } from '../modules/fly-to-cart/index.js';
import { initHeaderScroll } from './header.service.js';
import { initScrollReveal } from './scroll-reveal.service.js';
import { eventBus, EVENTS } from '../shared/services/event-bus.service.js';
import { debounce } from '../shared/utils/dom.utils.js';

export class App {
    constructor() {
        this.controllers = {};
        this.initialized = false;
    }
    
    /**
     * Initialize application
     */
    async init() {
        if (this.initialized) return;
        
        console.log('🚀 Initializing TriAD Application...');
        
        try {
            // Initialize controllers
            this.initControllers();
            
            // Setup global references
            this.setupGlobalReferences();
            
            // Setup UI events
            this.setupUIEvents();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Start header and scroll reveal
            this.initUIComponents();
            
            this.initialized = true;
            
            // Notify ready
            eventBus.emit(EVENTS.APP_READY);
            
            // Show welcome
            setTimeout(() => {
                toast.info('Welcome!', 'Start exploring our premium thermal lunch boxes.');
            }, 1000);
            
            console.log('✅ Application ready!');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            toast.error('Error', 'Failed to initialize application. Please refresh.');
        }
    }
    
    /**
     * Initialize all controllers
     */
    initControllers() {
        this.controllers.cart = new CartController();
        this.controllers.products = new ProductsController();
        this.controllers.modal = new ModalController();
        this.controllers.checkout = new CheckoutController();
    }
    
    /**
     * Setup global references
     */
    setupGlobalReferences() {
        window.cartController = this.controllers.cart;
        window.productsController = this.controllers.products;
        window.modalController = this.controllers.modal;
        window.checkoutController = this.controllers.checkout;
        window.toast = toast;
        window.flyToCart = flyToCart;
    }
    
    /**
     * Setup UI event listeners
     */
    setupUIEvents() {
        // Mobile menu
        this.setupMobileMenu();
        
        // Cart drawer
        this.setupCartDrawer();
        
        // Search suggestions blur
        const suggestion = document.getElementById('search-suggestion');
        if (suggestion) {
            document.addEventListener('click', (e) => {
                if (!suggestion.contains(e.target) && e.target.id !== 'search-input') {
                    suggestion.classList.add('hidden');
                }
            });
        }
        
        // Accordion: open first by default
        const firstAccordion = document.querySelector('.accordion-item');
        if (firstAccordion) {
            firstAccordion.classList.add('accordion-active');
        }
    }
    
    /**
     * Setup mobile menu
     */
    setupMobileMenu() {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        let isOpen = false;
        
        if (btn && menu) {
            btn.addEventListener('click', () => {
                isOpen = !isOpen;
                if (isOpen) {
                    menu.classList.remove('hidden');
                    btn.innerHTML = '<i class="ph ph-x text-2xl"></i>';
                } else {
                    menu.classList.add('hidden');
                    btn.innerHTML = '<i class="ph ph-list text-2xl"></i>';
                }
            });
            
            menu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    isOpen = false;
                    menu.classList.add('hidden');
                    btn.innerHTML = '<i class="ph ph-list text-2xl"></i>';
                });
            });
        }
    }
    
    /**
     * Setup cart drawer
     */
    setupCartDrawer() {
        const overlay = document.getElementById('cart-overlay');
        const closeBtn = document.getElementById('close-cart-btn');
        const cartIcon = document.getElementById('cart-icon-btn');
        const mobileCart = document.getElementById('mobile-cart-btn');
        
        if (cartIcon) {
            cartIcon.addEventListener('click', () => {
                this.controllers.cart.openDrawer();
            });
        }
        
        if (mobileCart) {
            mobileCart.addEventListener('click', () => {
                this.controllers.cart.openDrawer();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.controllers.cart.closeDrawer();
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.controllers.cart.closeDrawer();
            });
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape key - close modals
            if (e.key === 'Escape') {
                // Close modal
                if (this.controllers.modal?.service?.isOpen) {
                    this.controllers.modal.close();
                    return;
                }
                
                // Close checkout
                const checkoutModal = document.getElementById('checkout-modal');
                if (checkoutModal && !checkoutModal.classList.contains('hidden')) {
                    this.controllers.checkout.closeCheckout();
                    return;
                }
                
                // Close success
                const successModal = document.getElementById('success-modal');
                if (successModal && !successModal.classList.contains('hidden')) {
                    this.controllers.checkout.closeSuccess();
                    return;
                }
                
                // Close cart
                if (this.controllers.cart?.isDrawerOpen) {
                    this.controllers.cart.closeDrawer();
                    return;
                }
            }
            
            // Ctrl/Cmd + K - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const search = document.getElementById('search-input');
                if (search) search.focus();
            }
        });
    }
    
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Uncaught error:', e.error || e.message);
            toast.error('Something went wrong', 'Please try again or refresh the page.');
            eventBus.emit(EVENTS.APP_ERROR, { error: e.error || e.message });
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled rejection:', e.reason);
            toast.error('Error', 'An unexpected error occurred.');
            eventBus.emit(EVENTS.APP_ERROR, { error: e.reason });
        });
    }
    
    /**
     * Initialize UI components
     */
    initUIComponents() {
        // Header - after DOM is ready
        setTimeout(() => {
            if (typeof initHeaderScroll === 'function') {
                initHeaderScroll();
            }
        }, 100);
        
        // Scroll reveal - after products are loaded
        setTimeout(() => {
            if (typeof initScrollReveal === 'function') {
                initScrollReveal();
            }
        }, 400);
    }
}