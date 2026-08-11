import { CartController } from '../modules/cart/CartController.js';
import { ProductsController } from '../modules/products/ProductsController.js';
import { ModalController } from '../modules/modal/ModalController.js';
import { CheckoutController } from '../modules/checkout/CheckoutController.js';
import { toast } from '../modules/toast/ToastService.js';
import { flyToCart } from '../modules/fly-to-cart/FlyToCartService.js';
import '../modules/notification/NotificationService.js';
import { BlogController } from '../modules/blog/BlogController.js';
import { ReviewsController } from '../modules/reviews/ReviewsController.js';
import { eventBus } from '../core/services/EventBus.js';
import { EVENTS } from '../shared/constants/Events.js';
import { Logger } from '../core/services/Logger.js';

export class App {
  constructor() {
    this._controllers = {};
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;

    Logger.info('Initializing TriAD Application...');

    try {
      this._initControllers();
      this._setupGlobalReferences();
      this._setupUIEvents();
      this._setupKeyboardShortcuts();
      this._setupErrorHandling();
      this._initUIComponents();

      this._initialized = true;

      eventBus.emit(EVENTS.APP_READY);

      setTimeout(() => {
        toast.info('Welcome!', 'Start exploring our premium thermal lunch boxes.');
      }, 1000);

      Logger.info('Application ready!');

    } catch (error) {
      Logger.error('Failed to initialize app:', error);
      toast.error('Error', 'Failed to initialize application. Please refresh.');
    }
  }

  _initControllers() {
    this._controllers.cart = new CartController();
    this._controllers.products = new ProductsController();
    this._controllers.modal = new ModalController();
    this._controllers.checkout = new CheckoutController();
    this._controllers.blog = new BlogController();
    this._controllers.reviews = new ReviewsController();
  }

  _setupGlobalReferences() {
    window.cartController = this._controllers.cart;
    window.productsController = this._controllers.products;
    window.modalController = this._controllers.modal;
    window.checkoutController = this._controllers.checkout;
    window.toast = toast;
    window.flyToCart = flyToCart;
  }

  _setupUIEvents() {
    this._setupMobileMenu();
    this._setupCartDrawer();

    const suggestion = document.getElementById('search-suggestion');
    if (suggestion) {
      document.addEventListener('click', (e) => {
        if (!suggestion.contains(e.target) && e.target.id !== 'search-input') {
          suggestion.classList.add('hidden');
        }
      });
    }

    const firstAccordion = document.querySelector('.accordion-item');
    if (firstAccordion) {
      firstAccordion.classList.add('accordion-active');
    }
  }

  _setupMobileMenu() {
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

  _setupCartDrawer() {
    const overlay = document.getElementById('cart-overlay');
    const closeBtn = document.getElementById('close-cart-btn');
    const cartIcon = document.getElementById('cart-icon-btn');
    const mobileCart = document.getElementById('mobile-cart-btn');

    if (cartIcon) {
      cartIcon.addEventListener('click', () => {
        this._controllers.cart.openDrawer();
      });
    }

    if (mobileCart) {
      mobileCart.addEventListener('click', () => {
        this._controllers.cart.openDrawer();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this._controllers.cart.closeDrawer();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        this._controllers.cart.closeDrawer();
      });
    }
  }

  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this._controllers.modal?.service?.isOpen) {
          this._controllers.modal.close();
          return;
        }

        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && !checkoutModal.classList.contains('hidden')) {
          this._controllers.checkout.closeCheckout();
          return;
        }

        const successModal = document.getElementById('success-modal');
        if (successModal && !successModal.classList.contains('hidden')) {
          this._controllers.checkout.closeSuccess();
          return;
        }

        if (this._controllers.cart?.isDrawerOpen) {
          this._controllers.cart.closeDrawer();
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const search = document.getElementById('search-input');
        if (search) search.focus();
      }
    });
  }

  _setupErrorHandling() {
    window.addEventListener('error', (e) => {
      Logger.error('Uncaught error:', e.error || e.message);
      toast.error('Something went wrong', 'Please try again or refresh the page.');
      eventBus.emit(EVENTS.APP_ERROR, { error: e.error || e.message });
    });

    window.addEventListener('unhandledrejection', (e) => {
      Logger.error('Unhandled rejection:', e.reason);
      toast.error('Error', 'An unexpected error occurred.');
      eventBus.emit(EVENTS.APP_ERROR, { error: e.reason });
    });
  }

  _initUIComponents() {
    setTimeout(() => {
      if (typeof initHeaderScroll === 'function') {
        initHeaderScroll();
      }
    }, 100);

    setTimeout(() => {
      if (typeof initScrollReveal === 'function') {
        initScrollReveal();
      }
    }, 400);
  }

  fixHeaderLinks() {
    const root = this._getRootPath();
    const allLinks = document.querySelectorAll('nav a, #mobile-menu a, footer a');

    allLinks.forEach(link => {
      let href = link.getAttribute('href');
      if (!href) return;

      if (href === './') {
        link.setAttribute('href', root);
        return;
      }

      if (href.startsWith('./pages/')) {
        const path = href.replace('./pages/', '');
        link.setAttribute('href', `${root}pages/${path}`);
        return;
      }

      if (href.startsWith('pages/')) {
        link.setAttribute('href', `${root}${href}`);
        return;
      }

      if (href.startsWith('./')) {
        link.setAttribute('href', `${root}${href.substring(2)}`);
        return;
      }
    });

    Logger.debug('All links fixed with root:', root);
  }

  fixContentLinks() {
    const root = this._getRootPath();

    document.querySelectorAll('#page-content img').forEach(img => {
      let src = img.getAttribute('src');
      if (!src) return;

      if (src.startsWith('images/')) {
        img.src = root === './' ? `./${src}` : `../${src}`;
      } else if (src.startsWith('../images/')) {
        img.src = root === './' ? src.replace('../', './') : src;
      }
    });

    document.querySelectorAll('#page-content a').forEach(link => {
      let href = link.getAttribute('href');
      if (!href) return;

      if (href.match(/^(https?|#|mailto|javascript|tel)/i)) return;

      if (href.startsWith('pages/')) {
        if (root === './') {
          link.href = href;
        } else if (root === '../') {
          link.href = href.replace('pages/', '');
        }
      } else if (href.startsWith('./pages/')) {
        if (root === './') {
          link.href = href.replace('./', '');
        } else if (root === '../') {
          link.href = href.replace('./pages/', '');
        }
      }
    });
  }

  _getRootPath() {
    const pathname = window.location.pathname;
    if (pathname.includes('/pages/')) {
      return '../';
    }
    return './';
  }
}