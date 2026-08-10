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
import { eventBus } from '../shared/services/event-bus.service.js';
import { EVENTS } from '../shared/constants/events.constants.js';
import { debounce } from '../shared/utils/dom.utils.js';
import { BlogController } from '../modules/blog/index.js';
import { ReviewsController } from '../modules/reviews/index.js';
import { notificationService } from '../modules/notification/index.js';
import { ContactService } from '../modules/contact/index.js';
import { logger } from '../shared/services/logger.service.js';

export class App {
    constructor() {
        this.controllers = {};
        this.initialized = false;
        this.contactService = null;
    }
    
    /**
     * Initialize application
     */
    async init() {
        if (this.initialized) return;
        
        logger.info('Initializing TriAD Application...');
        
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

            // Initialize notification service
            this.initNotificationService();

            // Initialize contact service
            this.initContactService();
            
            this.initialized = true;
            
            // Notify ready
            eventBus.emit(EVENTS.APP_READY);
            
            // Show welcome
            setTimeout(() => {
                toast.info('Welcome!', 'Start exploring our premium thermal lunch boxes.');
            }, 1000);
            
            logger.info('Application ready!');
            
        } catch (error) {
            logger.error('Failed to initialize app:', error);
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
        this.controllers.blog = new BlogController();
        this.controllers.reviews = new ReviewsController();
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
        this.fixHeaderLinks();
    }

    fixHeaderLinks() {
        const root = getRootPath();
        // Chọn tất cả link trong header, mobile menu và footer
        const allLinks = document.querySelectorAll('nav a, #mobile-menu a, footer a');
        allLinks.forEach(link => {
            let href = link.getAttribute('href');
            if (!href) return;

            // Xử lý link HOME
            if (href === './') {
                link.setAttribute('href', root);
                return;
            }

            // Xử lý link bắt đầu bằng './pages/' hoặc 'pages/'
            if (href.startsWith('./pages/')) {
                const path = href.replace('./pages/', '');
                link.setAttribute('href', `${root}pages/${path}`);
                return;
            }
            if (href.startsWith('pages/')) {
                link.setAttribute('href', `${root}${href}`);
                return;
            }

            // Xử lý link bắt đầu bằng './' (không phải pages)
            if (href.startsWith('./')) {
                link.setAttribute('href', `${root}${href.substring(2)}`);
                return;
            }

            // Các link khác (ví dụ: "#", "https://...") giữ nguyên
        });
        logger.debug('[App] All links fixed with root:', root);
    }
    
    fixContentLinks() {
        const root = getRootPath();
        
        // Sửa các thẻ img trong nội dung
        document.querySelectorAll('#page-content img').forEach(img => {
            let src = img.getAttribute('src');
            if (!src) return;
            // Nếu ảnh bắt đầu bằng 'images/' hoặc '../images/'
            if (src.startsWith('images/')) {
                img.src = root === './' ? `./${src}` : `../${src}`;
            } else if (src.startsWith('../images/')) {
                img.src = root === './' ? src.replace('../', './') : src;
            }
        });
        
        // Sửa các link (a) trong nội dung
        document.querySelectorAll('#page-content a').forEach(link => {
            let href = link.getAttribute('href');
            if (!href) return;
            // Bỏ qua các link bắt đầu bằng http, #, mailto, javascript, v.v.
            if (href.match(/^(https?|#|mailto|javascript|tel)/i)) return;
            
            // Xử lý link bắt đầu bằng 'pages/'
            if (href.startsWith('pages/')) {
                if (root === './') {
                    // Đang ở root: giữ nguyên (hoặc thêm './' cho chắc)
                    link.href = href;
                } else if (root === '../') {
                    // Đang ở thư mục pages: bỏ 'pages/' để link cùng cấp
                    link.href = href.replace('pages/', '');
                }
            }
            // Xử lý link bắt đầu bằng './pages/' (tương tự)
            else if (href.startsWith('./pages/')) {
                if (root === './') {
                    link.href = href.replace('./', '');
                } else if (root === '../') {
                    link.href = href.replace('./pages/', '');
                }
            }
            // Các link khác như './', '../' có thể xử lý tùy ý
            // ...
        });
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
            logger.error('Uncaught error:', e.error || e.message);
            toast.error('Something went wrong', 'Please try again or refresh the page.');
            eventBus.emit(EVENTS.APP_ERROR, { error: e.error || e.message });
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            logger.error('Unhandled rejection:', e.reason);
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

    /**
     * Initialize Notification Service
     */
    initNotificationService() {
        // notificationService đã tự khởi tạo khi import
        logger.debug('Notification Service loaded');
    }

    initContactService() {
        // Khởi tạo ContactService (tự động setup form)
        this.contactService = new ContactService();
        logger.debug('Contact Service loaded');
    }
}

function getRootPath() {
    const pathname = window.location.pathname;
    if (pathname.includes('/pages/')) {
        return '../';
    }
    const segments = pathname.split('/').filter(s => s.length > 0);
    if (segments.length > 1 && !pathname.includes('pages')) {
        return '/';
    }
    return './';
}