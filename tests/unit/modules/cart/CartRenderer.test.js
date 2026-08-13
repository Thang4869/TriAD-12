import { describe, it, expect, beforeEach } from 'vitest';
import { CartRenderer } from '../../../../src/modules/cart/CartRenderer.js';
import { CartItemModel } from '../../../../src/shared/models/CartItemModel.js';

describe('CartRenderer', () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="cart-scroll"></div>
      <span id="cart-total">0 ₫</span>
      <span id="cart-badge">0</span>
      <button id="checkout-btn">Checkout</button>
    `;
    renderer = new CartRenderer();
  });

  it('should render empty cart', () => {
    renderer.render([]);
    const container = document.querySelector('.cart-scroll');
    expect(container.innerHTML).toContain('The shopping cart is empty');
  });

  it('should render cart items', () => {
    const item = new CartItemModel({
      id: 1,
      name: 'Test Product',
      color: 'White',
      price: 100000,
      image: 'test.jpg'
    }, 2);
    
    renderer.render([item]);
    const container = document.querySelector('.cart-scroll');
    expect(container.innerHTML).toContain('Test Product');
    expect(container.innerHTML).toContain('200.000 ₫');
  });

  it('should update badge count', () => {
    renderer.updateBadge(5);
    const badge = document.getElementById('cart-badge');
    expect(badge.textContent).toBe('5');
    expect(badge.style.display).toBe('flex');
  });

  it('should hide badge when count is 0', () => {
    renderer.updateBadge(0);
    const badge = document.getElementById('cart-badge');
    expect(badge.style.display).toBe('none');
  });

  it('should update total', () => {
    renderer.updateTotal(250000);
    const total = document.getElementById('cart-total');
    expect(total.textContent).toBe('250.000 ₫');
  });

  it('should enable/disable checkout button', () => {
    renderer.setCheckoutEnabled(true);
    const btn = document.getElementById('checkout-btn');
    expect(btn.disabled).toBe(false);
    expect(btn.style.opacity).toBe('1');

    renderer.setCheckoutEnabled(false);
    expect(btn.disabled).toBe(true);
    expect(btn.style.opacity).toBe('0.5');
  });
});