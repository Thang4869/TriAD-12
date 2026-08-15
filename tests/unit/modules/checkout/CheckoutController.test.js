import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CheckoutController } from '../../../../src/modules/checkout/CheckoutController.js';
import { CheckoutService } from '../../../../src/modules/checkout/CheckoutService.js';
import { CheckoutValidator } from '../../../../src/modules/checkout/CheckoutValidator.js';
import { CheckoutRenderer } from '../../../../src/modules/checkout/CheckoutRenderer.js';
import { EVENTS } from '../../../../src/shared/constants/Events.js';
import { eventBus } from '../../../../src/core/services/EventBus.js';

vi.mock('../../../../src/modules/checkout/CheckoutService.js');
vi.mock('../../../../src/modules/checkout/CheckoutValidator.js');
vi.mock('../../../../src/modules/checkout/CheckoutRenderer.js');

describe('CheckoutController', () => {
  let controller;
  let mockCartController;
  let mockToast;
  let mockNotifications;
  let mockProductsController;
  let mockServiceInstance;
  let mockValidatorInstance;
  let mockRendererInstance;
  let mockEventBusEmit;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="checkout-btn"></button>
      <button id="close-checkout-btn"></button>
      <form id="checkout-form">
        <input id="first-name" value="John">
        <input id="last-name" value="Doe">
        <input id="email" value="john@example.com">
        <input id="phone" value="0123456789">
        <input id="address" value="123 Main St">
        <div id="card-details" class="hidden"></div>
        <input type="radio" name="payment" value="cod" checked>
        <input type="radio" name="payment" value="card">
        <input id="card-number">
        <input id="card-expiry">
        <input id="card-cvv">
        <button type="submit">Place Order</button>
      </form>
      <div id="checkout-modal" class="hidden">
        <div class="bg-white"></div>
      </div>
      <div id="success-modal" class="hidden">
        <div class="bg-white"></div>
      </div>
      <button id="success-close-btn"></button>
      <div id="checkout-items"></div>
      <span id="checkout-total"></span>
    `;

    mockServiceInstance = {
      processCheckout: vi.fn().mockReturnValue({ id: 'ORD-123' }),
    };
    mockValidatorInstance = {
      validate: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
    };
    mockRendererInstance = {
      renderSummary: vi.fn(),
    };

    CheckoutService.mockImplementation(() => mockServiceInstance);
    CheckoutValidator.mockImplementation(() => mockValidatorInstance);
    CheckoutRenderer.mockImplementation(() => mockRendererInstance);

    mockCartController = {
      getItems: vi.fn().mockReturnValue([]),
      clear: vi.fn(),
      closeDrawer: vi.fn(),
    };
    window.cartController = mockCartController;

    mockToast = {
      warning: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
    };
    window.toast = mockToast;

    mockNotifications = {
      add: vi.fn(),
    };
    window.notifications = mockNotifications;

    mockProductsController = {
      resetFilters: vi.fn(),
    };
    window.productsController = mockProductsController;

    mockEventBusEmit = vi.spyOn(eventBus, 'emit');

    controller = new CheckoutController();

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.innerHTML = '';
    window.cartController = undefined;
    window.toast = undefined;
    window.notifications = undefined;
    window.productsController = undefined;
    mockEventBusEmit.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize services and setup event listeners', () => {
      expect(controller.service).toBe(mockServiceInstance);
      expect(controller.validator).toBe(mockValidatorInstance);
      expect(controller.renderer).toBe(mockRendererInstance);
      expect(controller.items).toEqual([]);
    });
  });

  describe('setupEventListeners', () => {
    it('should attach event listeners to DOM elements', () => {
      const btn = document.getElementById('checkout-btn');
      const spy = vi.spyOn(controller, 'openCheckout');
      btn.click();
      expect(spy).toHaveBeenCalled();

      const closeBtn = document.getElementById('close-checkout-btn');
      const closeSpy = vi.spyOn(controller, 'closeCheckout');
      closeBtn.click();
      expect(closeSpy).toHaveBeenCalled();

      const form = document.getElementById('checkout-form');
      const submitSpy = vi.spyOn(controller, 'handleSubmit');
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      expect(submitSpy).toHaveBeenCalled();

      const radios = document.querySelectorAll('input[name="payment"]');
      const toggleSpy = vi.spyOn(controller, 'toggleCardDetails');
      radios.forEach(radio => {
        radio.dispatchEvent(new Event('change'));
      });
      expect(toggleSpy).toHaveBeenCalled();

      const successClose = document.getElementById('success-close-btn');
      const successSpy = vi.spyOn(controller, 'closeSuccess');
      successClose.click();
      expect(successSpy).toHaveBeenCalled();
    });
  });

  describe('openCheckout', () => {
    it('should show warning toast if cart is empty', () => {
      mockCartController.getItems.mockReturnValue([]);
      controller.openCheckout();
      expect(mockToast.warning).toHaveBeenCalledWith('Empty Cart', 'Please add items to your cart first.');
      expect(mockRendererInstance.renderSummary).not.toHaveBeenCalled();
      expect(document.getElementById('checkout-modal').classList.contains('hidden')).toBe(true);
    });

    it('should open checkout modal with cart items', () => {
      const items = [{ id: 1, name: 'Product', quantity: 1, subtotal: 100000 }];
      mockCartController.getItems.mockReturnValue(items);
      controller.openCheckout();

      expect(mockRendererInstance.renderSummary).toHaveBeenCalledWith(items);
      expect(controller.items).toBe(items);
      const modal = document.getElementById('checkout-modal');
      expect(modal.classList.contains('hidden')).toBe(false);
      expect(document.body.style.overflow).toBe('hidden');
      expect(mockEventBusEmit).toHaveBeenCalledWith(EVENTS.CHECKOUT_STARTED);
    });
  });

  describe('closeCheckout', () => {
    it('should close checkout modal and reset overflow', () => {
      const modal = document.getElementById('checkout-modal');
      modal.classList.remove('hidden');
      modal.classList.remove('opacity-0');
      document.body.style.overflow = 'hidden';

      controller.closeCheckout();
      expect(modal.classList.contains('opacity-0')).toBe(true);
      vi.runAllTimers();
      expect(modal.classList.contains('hidden')).toBe(true);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('handleSubmit', () => {
    it('should prevent default and validate form', () => {
      const event = new Event('submit', { cancelable: true });
      const preventDefault = vi.spyOn(event, 'preventDefault');
      controller.handleSubmit(event);
      expect(preventDefault).toHaveBeenCalled();
      expect(mockValidatorInstance.validate).toHaveBeenCalled();
    });

    it('should show error toast if validation fails', () => {
      mockValidatorInstance.validate.mockReturnValue({ isValid: false, errors: ['Error 1', 'Error 2'] });
      const event = new Event('submit', { cancelable: true });
      controller.handleSubmit(event);
      expect(mockToast.error).toHaveBeenCalledWith('Validation Error', 'Error 1, Error 2');
      expect(mockServiceInstance.processCheckout).not.toHaveBeenCalled();
    });

    it('should process checkout successfully', () => {
      const items = [{ id: 1, name: 'Product', quantity: 2, subtotal: 200000 }];
      controller.items = items;
      mockValidatorInstance.validate.mockReturnValue({ isValid: true, errors: [] });
      const order = { id: 'ORD-456' };
      mockServiceInstance.processCheckout.mockReturnValue(order);

      const event = new Event('submit', { cancelable: true });
      controller.handleSubmit(event);

      expect(mockToast.info).toHaveBeenCalledWith('Processing', 'Please wait while we process your order...');
      vi.advanceTimersByTime(1500);

      expect(mockServiceInstance.processCheckout).toHaveBeenCalled();
      expect(mockCartController.clear).toHaveBeenCalled();
      expect(mockCartController.closeDrawer).toHaveBeenCalled();
      expect(mockNotifications.add).toHaveBeenCalledWith(
        'Order Placed!',
        'Order #ORD-456 confirmed with 2 item(s). Thank you!',
        'success'
      );
      expect(mockToast.success).toHaveBeenCalledWith('Order Placed!', 'Order #ORD-456 confirmed.');
      expect(document.getElementById('success-modal').classList.contains('hidden')).toBe(false);
    });

    it('should handle error during checkout', () => {
      mockValidatorInstance.validate.mockReturnValue({ isValid: true, errors: [] });
      mockServiceInstance.processCheckout.mockImplementation(() => {
        throw new Error('Service error');
      });

      const event = new Event('submit', { cancelable: true });
      controller.handleSubmit(event);
      vi.advanceTimersByTime(1500);

      expect(mockToast.error).toHaveBeenCalledWith('Error', 'Failed to process order. Please try again.');
      expect(mockNotifications.add).toHaveBeenCalledWith(
        'Order Failed',
        'There was an error processing your order. Please try again.',
        'warning'
      );
    });
  });

  describe('showSuccess', () => {
    it('should show success modal', () => {
      const modal = document.getElementById('success-modal');
      expect(modal.classList.contains('hidden')).toBe(true);
      controller.showSuccess('ORD-123');
      expect(modal.classList.contains('hidden')).toBe(false);
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('closeSuccess', () => {
    it('should close success modal and reset filters', () => {
      const modal = document.getElementById('success-modal');
      modal.classList.remove('hidden');
      modal.classList.remove('opacity-0');
      document.body.style.overflow = 'hidden';

      controller.closeSuccess();
      expect(modal.classList.contains('opacity-0')).toBe(true);
      vi.runAllTimers();
      expect(modal.classList.contains('hidden')).toBe(true);
      expect(document.body.style.overflow).toBe('');
      expect(mockProductsController.resetFilters).toHaveBeenCalled();
    });
  });

  describe('toggleCardDetails', () => {
    it('should show card details when payment method is card', () => {
      const cardDetails = document.getElementById('card-details');
      cardDetails.classList.add('hidden');

      document.querySelector('input[value="card"]').checked = true;
      controller.toggleCardDetails();
      expect(cardDetails.classList.contains('hidden')).toBe(false);
    });

    it('should hide card details when payment method is not card', () => {
      const cardDetails = document.getElementById('card-details');
      cardDetails.classList.remove('hidden');

      document.querySelector('input[value="cod"]').checked = true;
      controller.toggleCardDetails();
      expect(cardDetails.classList.contains('hidden')).toBe(true);
    });

    it('should handle checkout without toast', () => {
      delete window.toast;
      const items = [{ id: 1, name: 'Product', quantity: 1, subtotal: 100 }];
      mockCartController.getItems.mockReturnValue(items);
      controller.openCheckout();
    });

    it('toggleCardDetails should handle no selected radio', () => {
      document.querySelectorAll('input[name="payment"]').forEach(r => r.checked = false);
      expect(() => controller.toggleCardDetails()).not.toThrow();
    });
  });
});