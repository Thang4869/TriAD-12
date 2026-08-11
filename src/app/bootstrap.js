import { loadComponents } from '../shared/utils/loader.js';
import { Logger } from '../core/services/Logger.js';
import { App } from './app.js';
import { initHeaderNavigation } from './HeaderNavigationService.js';
import { RouterService } from './services/RouterService.js';
import { UIService } from './services/UIService.js';
import { KeyboardService } from './services/KeyboardService.js';
import { ErrorHandler } from './services/ErrorHandler.js';
import { toast } from '../modules/toast/ToastService.js';
import { notificationController } from '../modules/notification/index.js';

function getCurrentPage() {
  const pathname = window.location.pathname;
  const filename = pathname.split('/').pop();
  if (!filename || filename === 'index.html') return 'home';
  const page = filename.replace('.html', '');
  const pageMap = {
    about: 'about',
    products: 'products',
    blog: 'blog',
    'blog-detail': 'blog-detail',
    reviews: 'reviews',
    location: 'location',
    contact: 'contact'
  };
  return pageMap[page] || 'home';
}

function getRootPath() {
  const pathname = window.location.pathname;
  if (pathname.includes('/pages/')) return '../';
  return './';
}

function getComponentsForPage(page) {
  const root = getRootPath();
  const sharedComponents = [
    { elementId: 'header-container', filePath: `${root}components/header.html` },
    { elementId: 'footer-container', filePath: `${root}components/footer.html` },
    { elementId: 'cart-drawer-container', filePath: `${root}pages/cart-drawer.html` },
    { elementId: 'product-modal-container', filePath: `${root}pages/product-modal.html` },
    { elementId: 'checkout-modal-container', filePath: `${root}pages/checkout-modal.html` },
    { elementId: 'success-modal-container', filePath: `${root}pages/success-modal.html` }
  ];

  const pageComponents = {
    home: [
      { elementId: 'hero-container', filePath: `${root}pages/hero-content.html` },
      { elementId: 'about-container', filePath: `${root}pages/about-preview-content.html` },
      { elementId: 'features-container', filePath: `${root}pages/features-content.html` }
    ],
    about: [{ elementId: 'about-content', filePath: `${root}pages/about-content.html` }],
    products: [{ elementId: 'products-container', filePath: `${root}pages/products-content.html` }],
    blog: [{ elementId: 'blog-container', filePath: `${root}pages/blog-content.html` }],
    'blog-detail': [{ elementId: 'blog-detail-container', filePath: `${root}pages/blog-detail-content.html` }],
    reviews: [{ elementId: 'reviews-container', filePath: `${root}pages/reviews-content.html` }],
    location: [{ elementId: 'location-container', filePath: `${root}pages/location-content.html` }],
    contact: [{ elementId: 'contact-content', filePath: `${root}pages/contact-content.html` }]
  };

  const pageSpecific = pageComponents[page] || pageComponents.home;
  return [...sharedComponents, ...pageSpecific];
}

export async function bootstrap() {
  Logger.info('Bootstrapping TriAD Application...');

  try {
    const currentPage = getCurrentPage();
    Logger.debug(`Current page: ${currentPage}`);

    const components = getComponentsForPage(currentPage);
    Logger.debug(`Loading ${components.length} components...`);

    const results = await loadComponents(components);

    setTimeout(() => {
        notificationController.reinit();
    }, 100);
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      Logger.warn('Some components failed to load:', failed);
    } else {
      Logger.info('All components loaded successfully!');
    }

    const router = new RouterService();

    const app = new App({ routerService: router });
    await app.init();

    const cartController = window.cartController;
    const modalController = window.modalController;
    const checkoutController = window.checkoutController;

    const uiService = new UIService(cartController);
    const keyboardService = new KeyboardService(cartController, modalController, checkoutController);
    const errorHandler = new ErrorHandler(window.toast);

    app.ui = uiService;
    app.keyboard = keyboardService;
    app.errorHandler = errorHandler;

    router.fixHeaderLinks();
    router.fixContentLinks();

    initHeaderNavigation(currentPage);

    const { initScrollReveal } = await import('./services/ScrollRevealService.js');
    initScrollReveal();

    const { initHeaderScroll } = await import('./HeaderService.js');
    initHeaderScroll();

    Logger.info('Bootstrap complete!');
  } catch (error) {
    Logger.error('Bootstrap failed:', error);
  }
}