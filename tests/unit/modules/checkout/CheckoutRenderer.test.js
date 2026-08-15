import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutRenderer } from '../../../../src/modules/checkout/CheckoutRenderer.js';

describe('CheckoutRenderer', () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="checkout-items"></div>
      <span id="checkout-total">0 ₫</span>
    `;
    renderer = new CheckoutRenderer();
  });

  it('should render summary with items', () => {
    const items = [
      { name: 'Container 1000ml', quantity: 2, subtotal: 300000 },
      { name: 'Container 400ml', quantity: 1, subtotal: 110000 }
    ];
    renderer.renderSummary(items);
    const container = document.getElementById('checkout-items');
    expect(container.innerHTML).toContain('Container 1000ml x2');
    expect(container.innerHTML).toContain('300.000 ₫');
    expect(container.innerHTML).toContain('Container 400ml x1');
    expect(container.innerHTML).toContain('110.000 ₫');
    expect(document.getElementById('checkout-total').textContent).toBe('440.000 ₫');
  });

  it('should apply free shipping when total >= 500000', () => {
    const items = [
      { name: 'Product A', quantity: 1, subtotal: 600000 }
    ];
    renderer.renderSummary(items);
    expect(document.getElementById('checkout-total').textContent).toBe('600.000 ₫');
  });

  it('should render empty state when items empty', () => {
    renderer.renderSummary([]);
    const container = document.getElementById('checkout-items');
    expect(container.innerHTML).toContain('Your cart is empty.');
    expect(document.getElementById('checkout-total').textContent).toBe('0 ₫');
  });

  it('should update total directly', () => {
    renderer.updateTotal(500000);
    expect(document.getElementById('checkout-total').textContent).toBe('500.000 ₫');
  });
});