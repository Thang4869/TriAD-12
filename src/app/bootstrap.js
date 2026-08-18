import { loadComponents } from "../shared/utils/loader.js";
import { Logger } from "../core/services/Logger.js";
import { App } from "./app.js";
import { initHeaderNavigation } from "./HeaderNavigationService.js";
import { RouterService } from "./services/RouterService.js";
import { UIService } from "./services/UIService.js";
import { KeyboardService } from "./services/KeyboardService.js";
import { ErrorHandler } from "./services/ErrorHandler.js";
import { toast } from "../modules/toast/ToastService.js";
import { notificationController } from "../modules/notification/index.js";
import { Container } from "../core/di/container.js";
import { EventBus } from "../core/services/EventBus.js";
import { StorageService } from "../core/services/Storage.js";

import { CartController } from "../modules/cart/CartController.js";
import { ProductsController } from "../modules/products/controllers/ProductsController.js";
import { ModalController } from "../modules/modal/ModalController.js";
import { CheckoutController } from "../modules/checkout/CheckoutController.js";
import { BlogController } from "../modules/blog/BlogController.js";
import { ReviewsController } from "../modules/reviews/ReviewsController.js";

import { ProductsRepository } from "../modules/products/repositories/ProductsRepository.js";
import { ProductsService } from "../modules/products/services/ProductsService.js";
import { ProductsRenderer } from "../modules/products/renderers/ProductsRenderer.js";

function getCurrentPage() {
  const pathname = window.location.pathname;
  const filename = pathname.split("/").pop();
  if (!filename || filename === "index.html") return "home";
  const page = filename.replace(".html", "");
  const pageMap = {
    about: "about",
    products: "products",
    blog: "blog",
    "blog-detail": "blog-detail",
    reviews: "reviews",
    location: "location",
    contact: "contact",
  };
  return pageMap[page] || "home";
}

function getRootPath() {
  const pathname = window.location.pathname;
  if (pathname.includes("/pages/")) return "../";
  return "./";
}

function getComponentsForPage(page) {
  const root = getRootPath();
  const sharedComponents = [
    {
      elementId: "header-container",
      filePath: `${root}components/header.html`,
    },
    {
      elementId: "footer-container",
      filePath: `${root}components/footer.html`,
    },
    {
      elementId: "cart-drawer-container",
      filePath: `${root}pages/cart-drawer.html`,
    },
    {
      elementId: "product-modal-container",
      filePath: `${root}pages/product-modal.html`,
    },
    {
      elementId: "checkout-modal-container",
      filePath: `${root}pages/checkout-modal.html`,
    },
    {
      elementId: "success-modal-container",
      filePath: `${root}pages/success-modal.html`,
    },
  ];

  const pageComponents = {
    home: [
      {
        elementId: "hero-container",
        filePath: `${root}pages/hero-content.html`,
      },
      {
        elementId: "about-container",
        filePath: `${root}pages/about-preview-content.html`,
      },
      {
        elementId: "features-container",
        filePath: `${root}pages/features-content.html`,
      },
    ],
    about: [
      {
        elementId: "about-content",
        filePath: `${root}pages/about-content.html`,
      },
    ],
    products: [
      {
        elementId: "products-container",
        filePath: `${root}pages/products-content.html`,
      },
    ],
    blog: [
      {
        elementId: "blog-container",
        filePath: `${root}pages/blog-content.html`,
      },
    ],
    "blog-detail": [
      {
        elementId: "blog-detail-container",
        filePath: `${root}pages/blog-detail-content.html`,
      },
    ],
    reviews: [
      {
        elementId: "reviews-container",
        filePath: `${root}pages/reviews-content.html`,
      },
    ],
    location: [
      {
        elementId: "location-container",
        filePath: `${root}pages/location-content.html`,
      },
    ],
    contact: [
      {
        elementId: "contact-content",
        filePath: `${root}pages/contact-content.html`,
      },
    ],
  };

  const pageSpecific = pageComponents[page];
  return [...sharedComponents, ...pageSpecific];
}

export async function bootstrap() {
  Logger.info("Bootstrapping TriAD Application...");
  try {
    const currentPage = getCurrentPage();
    const components = getComponentsForPage(currentPage);
    const results = await loadComponents(components);

    setTimeout(() => {
      notificationController.reinit();
    }, 100);

    const container = new Container();
    container.register("eventBus", new EventBus());
    container.register("storage", new StorageService());

    const productsRepository = new ProductsRepository(container.get("storage"));
    const productsService = new ProductsService(
      productsRepository,
      container.get("eventBus"),
    );
    const productsRenderer = new ProductsRenderer();
    const productsController = new ProductsController(
      productsService,
      productsRenderer,
      container.get("eventBus"),
    );

    container.register("productsRepository", productsRepository);
    container.register("productsService", productsService);
    container.register("productsRenderer", productsRenderer);
    container.register("productsController", productsController);

    container.register("cartController", new CartController());
    container.register("modalController", new ModalController());
    container.register("checkoutController", new CheckoutController());
    container.register("blogController", new BlogController());
    container.register("reviewsController", new ReviewsController());

    const router = new RouterService();
    const uiService = new UIService(container.get("cartController"));
    const keyboardService = new KeyboardService(
      container.get("cartController"),
      container.get("modalController"),
      container.get("checkoutController"),
    );
    const errorHandler = new ErrorHandler(toast);

    const app = new App({
      container,
      routerService: router,
      uiService,
      keyboardService,
      errorHandler,
    });
    await app.init();

    router.fixHeaderLinks();
    router.fixContentLinks();
    initHeaderNavigation(currentPage);

    const { initScrollReveal } =
      await import("./services/ScrollRevealService.js");
    initScrollReveal();

    const { initHeaderScroll } = await import("./HeaderService.js");
    initHeaderScroll();

    Logger.info("Bootstrap complete!");
  } catch (error) {
    Logger.error("Bootstrap failed:", error);
  }
}