import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlyToCart } from '../../../../src/modules/fly-to-cart/FlyToCartService.js';

describe('FlyToCart', () => {
  let flyToCart;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="cart-icon-btn"><span id="cart-badge">0</span></button>
      <img id="product-img" src="test.jpg">
    `;
    flyToCart = new FlyToCart();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should find cart badge', () => {
    expect(flyToCart.findCartBadge()).toBeTruthy();
  });

  it('should get image src from element', () => {
    const img = document.getElementById('product-img');
    expect(flyToCart.getImageSrc(img)).toContain('test.jpg');
    const div = document.createElement('div');
    div.innerHTML = '<img src="div-img.jpg">';
    expect(flyToCart.getImageSrc(div)).toContain('div-img.jpg');
  });

  it('should create fly element', () => {
    const rect = { left: 100, top: 100, width: 50, height: 50 };
    const element = flyToCart.createFlyElement('test.jpg', rect);
    expect(element.tagName).toBe('IMG');
    expect(element.src).toContain('test.jpg');
    expect(element.style.left).toBe('100px');
    expect(element.style.top).toBe('100px');
  });

  it('should fly animation', async () => {
    const element = document.createElement('div');
    element.style.position = 'fixed';
    document.body.appendChild(element);
    const start = { left: 0, top: 0 };
    const end = { x: 100, y: 100 };
    await new Promise((resolve) => {
      flyToCart.animateFly(element, start, end, () => {
        expect(element.style.left).toBe('100px');
        expect(element.style.top).toBe('100px');
        resolve();
      });
      vi.runAllTimers();
    });
  });

  it('should not fly if already flying', () => {
    flyToCart.isFlying = true;
    const callback = vi.fn();
    flyToCart.fly(document.getElementById('product-img'), callback);
    expect(callback).toHaveBeenCalled();
  });
});