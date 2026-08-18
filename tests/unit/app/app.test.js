import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { App } from '../../../src/app/app.js';
import { eventBus } from '../../../src/core/services/EventBus.js';
import { EVENTS } from '../../../src/shared/constants/Events.js';

// Mock các module
vi.mock('../../../src/modules/toast/ToastService.js', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../src/modules/fly-to-cart/FlyToCartService.js', () => ({
  flyToCart: { fly: vi.fn() }
}));

vi.mock('../../../src/core/services/Logger.js', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../src/core/services/EventBus.js', () => ({
  eventBus: {
    emit: vi.fn()
  }
}));

import { toast } from '../../../src/modules/toast/ToastService.js';
import { Logger } from '../../../src/core/services/Logger.js';

describe('App', () => {
  let app;
  let mockContainer;

  beforeEach(() => {
    vi.useFakeTimers(); // Bắt đầu dùng fake timers

    mockContainer = {
      get: vi.fn((name) => {
        if (name === 'cartController') return {};
        if (name === 'productsController') return {};
        if (name === 'modalController') return {};
        if (name === 'checkoutController') return {};
        if (name === 'blogController') return {};
        if (name === 'reviewsController') return {};
        return undefined;
      })
    };

    app = new App({
      container: mockContainer,
      routerService: {},
      uiService: {},
      keyboardService: {},
      errorHandler: {}
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers(); // Khôi phục timers thật
  });

  it('should initialize and set up global references', async () => {
    expect(app._initialized).toBe(false);
    await app.init();

    // Chạy setTimeout trong app.js (sau 1000ms)
    vi.advanceTimersByTime(1000);

    expect(app._initialized).toBe(true);
    expect(app.cartController).toBeDefined();
    expect(app.productsController).toBeDefined();
    expect(app.modalController).toBeDefined();
    expect(app.checkoutController).toBeDefined();
    expect(app.blogController).toBeDefined();
    expect(app.reviewsController).toBeDefined();
    expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.APP_READY);
    expect(toast.info).toHaveBeenCalledWith('Welcome!', expect.any(String));
    expect(Logger.info).toHaveBeenCalledWith('Application ready!');
  });

  it('should not re-initialize if already initialized', async () => {
    await app.init();
    vi.advanceTimersByTime(1000); // Cần advance để timer trong init chạy

    const setupSpy = vi.spyOn(app, '_setupGlobalReferences');
    await app.init();
    expect(setupSpy).not.toHaveBeenCalled();
    expect(app._initialized).toBe(true);
  });

  it('should handle errors during initialization', async () => {
    mockContainer.get = vi.fn(() => { throw new Error('Test error'); });
    await app.init();
    vi.advanceTimersByTime(1000);

    expect(Logger.error).toHaveBeenCalledWith('Failed to initialize app:', expect.any(Error));
    expect(toast.error).toHaveBeenCalledWith('Error', 'Failed to initialize application. Please refresh.');
    expect(app._initialized).toBe(false);
  });

  it('should set up global references correctly', () => {
    app._setupGlobalReferences();
    expect(window.cartController).toBe(app.cartController);
    expect(window.productsController).toBe(app.productsController);
    expect(window.modalController).toBe(app.modalController);
    expect(window.checkoutController).toBe(app.checkoutController);
    expect(window.toast).toBeDefined();
    expect(window.flyToCart).toBeDefined();
  });
});