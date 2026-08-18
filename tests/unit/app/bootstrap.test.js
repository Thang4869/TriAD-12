import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bootstrap } from '../../../src/app/bootstrap.js';

vi.mock('../../../src/shared/utils/loader.js', () => ({
  loadComponents: vi.fn().mockResolvedValue([{ success: true }])
}));

vi.mock('../../../src/app/HeaderNavigationService.js', () => ({
  initHeaderNavigation: vi.fn()
}));

vi.mock('../../../src/app/HeaderService.js', () => ({
  initHeaderScroll: vi.fn()
}));

vi.mock('../../../src/app/services/ScrollRevealService.js', () => ({
  initScrollReveal: vi.fn()
}));

vi.mock('../../../src/core/services/Logger.js', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../../../src/modules/toast/ToastService.js', () => ({
  toast: { info: vi.fn(), error: vi.fn() }
}));

vi.mock('../../../src/modules/notification/index.js', () => ({
  notificationController: { reinit: vi.fn() }
}));

vi.mock('../../../src/core/di/container.js', () => ({
  Container: vi.fn().mockImplementation(() => ({
    register: vi.fn(),
    get: vi.fn(() => ({}))
  }))
}));

vi.mock('../../../src/core/services/EventBus.js', () => ({
  EventBus: vi.fn(),
  eventBus: { on: vi.fn(), emit: vi.fn() }
}));

vi.mock('../../../src/core/services/Storage.js', () => ({
  StorageService: vi.fn()
}));

vi.mock('../../../src/modules/cart/CartController.js', () => ({
  CartController: vi.fn()
}));
vi.mock('../../../src/modules/products/controllers/ProductsController.js', () => ({
  ProductsController: vi.fn()
}));
vi.mock('../../../src/modules/modal/ModalController.js', () => ({
  ModalController: vi.fn()
}));
vi.mock('../../../src/modules/checkout/CheckoutController.js', () => ({
  CheckoutController: vi.fn()
}));
vi.mock('../../../src/modules/blog/BlogController.js', () => ({
  BlogController: vi.fn()
}));
vi.mock('../../../src/modules/reviews/ReviewsController.js', () => ({
  ReviewsController: vi.fn()
}));
vi.mock('../../../src/modules/products/repositories/ProductsRepository.js', () => ({
  ProductsRepository: vi.fn()
}));
vi.mock('../../../src/modules/products/services/ProductsService.js', () => ({
  ProductsService: vi.fn()
}));
vi.mock('../../../src/modules/products/renderers/ProductsRenderer.js', () => ({
  ProductsRenderer: vi.fn()
}));

vi.mock('../../../src/modules/fly-to-cart/FlyToCartService.js', () => ({
  flyToCart: { fly: vi.fn() }
}));

vi.mock('../../../src/app/services/RouterService.js', () => ({
  RouterService: vi.fn().mockImplementation(() => ({
    fixHeaderLinks: vi.fn(),
    fixContentLinks: vi.fn()
  }))
}));

vi.mock('../../../src/app/services/UIService.js', () => ({
  UIService: vi.fn()
}));

vi.mock('../../../src/app/services/KeyboardService.js', () => ({
  KeyboardService: vi.fn()
}));

vi.mock('../../../src/app/services/ErrorHandler.js', () => ({
  ErrorHandler: vi.fn()
}));

describe('bootstrap', () => {
  let loadComponentsMock;
  let initHeaderNavigationMock;
  let initHeaderScrollMock;
  let initScrollRevealMock;
  let LoggerMock;
  let RouterServiceMock;
  let UIServiceMock;
  let KeyboardServiceMock;
  let ErrorHandlerMock;

  beforeEach(async () => {
    const { loadComponents } = await import('../../../src/shared/utils/loader.js');
    loadComponentsMock = loadComponents;
    const { initHeaderNavigation } = await import('../../../src/app/HeaderNavigationService.js');
    initHeaderNavigationMock = initHeaderNavigation;
    const { initHeaderScroll } = await import('../../../src/app/HeaderService.js');
    initHeaderScrollMock = initHeaderScroll;
    const { initScrollReveal } = await import('../../../src/app/services/ScrollRevealService.js');
    initScrollRevealMock = initScrollReveal;
    const { Logger } = await import('../../../src/core/services/Logger.js');
    LoggerMock = Logger;
    const { RouterService } = await import('../../../src/app/services/RouterService.js');
    RouterServiceMock = RouterService;
    const { UIService } = await import('../../../src/app/services/UIService.js');
    UIServiceMock = UIService;
    const { KeyboardService } = await import('../../../src/app/services/KeyboardService.js');
    KeyboardServiceMock = KeyboardService;
    const { ErrorHandler } = await import('../../../src/app/services/ErrorHandler.js');
    ErrorHandlerMock = ErrorHandler;

    document.body.innerHTML = `
      <div id="header-container"></div>
      <div id="page-content"></div>
      <div id="footer-container"></div>
      <div id="toast-container"></div>
      <div id="cart-drawer-container"></div>
      <div id="product-modal-container"></div>
      <div id="checkout-modal-container"></div>
      <div id="success-modal-container"></div>
      <div id="cart-overlay"></div>
      <span id="cart-badge"></span>
      <button id="cart-icon-btn"></button>
      <button id="checkout-btn"></button>
      <input id="search-input">
      <div id="search-suggestion" class="hidden"></div>
      <div id="product-grid"></div>
    `;

    loadComponentsMock.mockClear();
    initHeaderNavigationMock.mockClear();
    initHeaderScrollMock.mockClear();
    initScrollRevealMock.mockClear();
    LoggerMock.info.mockClear();
    LoggerMock.error.mockClear();
    RouterServiceMock.mockClear();
    UIServiceMock.mockClear();
    KeyboardServiceMock.mockClear();
    ErrorHandlerMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call loadComponents with correct components for home page', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
      configurable: true
    });

    await bootstrap();

    expect(loadComponentsMock).toHaveBeenCalled();
    const componentsArg = loadComponentsMock.mock.calls[0][0];
    expect(componentsArg).toContainEqual(expect.objectContaining({ elementId: 'header-container' }));
    expect(componentsArg).toContainEqual(expect.objectContaining({ elementId: 'hero-container' }));
    expect(componentsArg).toContainEqual(expect.objectContaining({ elementId: 'about-container' }));
    expect(componentsArg).toContainEqual(expect.objectContaining({ elementId: 'features-container' }));
  });

  it('should handle index.html pathname correctly', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/index.html' },
      writable: true,
      configurable: true
    });

    await bootstrap();

    expect(initHeaderNavigationMock).toHaveBeenCalledWith('home');
  });

  it('should fallback to home page when pathname is unknown', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/pages/unknown-page.html' },
      writable: true,
      configurable: true
    });

    await bootstrap();

    expect(initHeaderNavigationMock).toHaveBeenCalledWith('home');
  });

  it('should call initHeaderNavigation with correct page for about page', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/pages/about.html' },
      writable: true,
      configurable: true
    });

    await bootstrap();

    expect(initHeaderNavigationMock).toHaveBeenCalledWith('about');
  });

  it('should call initHeaderScroll and initScrollReveal', async () => {
    await bootstrap();
    expect(initHeaderScrollMock).toHaveBeenCalled();
    expect(initScrollRevealMock).toHaveBeenCalled();
  });

  it('should log info on success', async () => {
    await bootstrap();
    expect(LoggerMock.info).toHaveBeenCalledWith('Bootstrapping TriAD Application...');
    expect(LoggerMock.info).toHaveBeenCalledWith('Bootstrap complete!');
  });

  it('should handle errors and log error', async () => {
    loadComponentsMock.mockRejectedValue(new Error('Load error'));

    await bootstrap();

    expect(LoggerMock.error).toHaveBeenCalledWith('Bootstrap failed:', expect.any(Error));
  });

  it('should instantiate services and app', async () => {
    await bootstrap();
    expect(window.cartController).toBeDefined();
    expect(window.productsController).toBeDefined();
    expect(window.modalController).toBeDefined();
    expect(window.checkoutController).toBeDefined();
  });
});