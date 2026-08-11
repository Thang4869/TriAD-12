import { CartController } from '../modules/cart/CartController.js';
import { ProductsController } from '../modules/products/ProductsController.js';
import { ModalController } from '../modules/modal/ModalController.js';
import { CheckoutController } from '../modules/checkout/CheckoutController.js';
import { BlogController } from '../modules/blog/BlogController.js';
import { ReviewsController } from '../modules/reviews/ReviewsController.js';
import { toast } from '../modules/toast/ToastService.js';
import { flyToCart } from '../modules/fly-to-cart/FlyToCartService.js';
import '../modules/notification/NotificationService.js';
import { eventBus } from '../core/services/EventBus.js';
import { EVENTS } from '../shared/constants/Events.js';
import { Logger } from '../core/services/Logger.js';

export class App {
  constructor({ routerService, uiService, keyboardService, errorHandler }) {
    this.router = routerService;
    this.ui = uiService;
    this.keyboard = keyboardService;
    this.errorHandler = errorHandler;
    
    this._controllers = {};
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;

    Logger.info('Initializing TriAD Application...');

    try {
      this._initControllers();
      this._setupGlobalReferences();
      
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
}