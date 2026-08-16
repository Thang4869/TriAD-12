import { toast } from "../modules/toast/ToastService.js";
import { flyToCart } from "../modules/fly-to-cart/FlyToCartService.js";
import "../modules/notification/NotificationService.js";
import { eventBus } from "../core/services/EventBus.js";
import { EVENTS } from "../shared/constants/Events.js";
import { Logger } from "../core/services/Logger.js";

export class App {
  constructor({
    container,
    routerService,
    uiService,
    keyboardService,
    errorHandler,
  }) {
    this.container = container;
    this.router = routerService;
    this.ui = uiService;
    this.keyboard = keyboardService;
    this.errorHandler = errorHandler;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    Logger.info("Initializing TriAD Application...");

    try {
      this.cartController = this.container.get("cartController");
      this.productsController = this.container.get("productsController");
      this.modalController = this.container.get("modalController");
      this.checkoutController = this.container.get("checkoutController");
      this.blogController = this.container.get("blogController");
      this.reviewsController = this.container.get("reviewsController");

      this._setupGlobalReferences();
      this._initialized = true;
      eventBus.emit(EVENTS.APP_READY);

      setTimeout(() => {
        toast.info(
          "Welcome!",
          "Start exploring our premium thermal lunch boxes.",
        );
      }, 1000);

      Logger.info("Application ready!");
    } catch (error) {
      Logger.error("Failed to initialize app:", error);
      toast.error("Error", "Failed to initialize application. Please refresh.");
    }
  }

  _setupGlobalReferences() {
    window.cartController = this.cartController;
    window.productsController = this.productsController;
    window.modalController = this.modalController;
    window.checkoutController = this.checkoutController;
    window.toast = toast;
    window.flyToCart = flyToCart;
  }
}
