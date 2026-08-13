import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyboardService } from '../../../../src/app/services/KeyboardService.js';

describe('KeyboardService', () => {
  let keyboardService;
  let mockCart, mockModal, mockCheckout;

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="search-input">
      <div id="checkout-modal" class="hidden"></div>
      <div id="success-modal" class="hidden"></div>
    `;
    mockCart = { closeDrawer: vi.fn(), isDrawerOpen: true };
    mockModal = { service: { isOpen: true }, close: vi.fn() };
    mockCheckout = { closeCheckout: vi.fn(), closeSuccess: vi.fn() };
    keyboardService = new KeyboardService(mockCart, mockModal, mockCheckout);
  });

  it('should close modal on Escape', () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    expect(mockModal.close).toHaveBeenCalled();
  });

  it('should close checkout modal on Escape', () => {
    mockModal.service.isOpen = false;
    document.getElementById('checkout-modal').classList.remove('hidden');
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    expect(mockCheckout.closeCheckout).toHaveBeenCalled();
  });

  it('should close success modal on Escape', () => {
    mockModal.service.isOpen = false;
    document.getElementById('success-modal').classList.remove('hidden');
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    expect(mockCheckout.closeSuccess).toHaveBeenCalled();
  });

  it('should close cart drawer on Escape', () => {
    mockModal.service.isOpen = false;
    document.getElementById('checkout-modal').classList.add('hidden');
    document.getElementById('success-modal').classList.add('hidden');
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    expect(mockCart.closeDrawer).toHaveBeenCalled();
  });

  it('should focus search on Ctrl+K', () => {
    const search = document.getElementById('search-input');
    const focusSpy = vi.spyOn(search, 'focus');
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    document.dispatchEvent(event);
    expect(focusSpy).toHaveBeenCalled();
  });
});